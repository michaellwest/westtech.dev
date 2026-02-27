---
title: "PrecisionScheduler v1.1.0: Fixing the Bugs That Hurt in Production"
date: 2026-02-25
tags: [sitecore, dotnet, hangfire]
summary: "Real-world use surfaced six issues in PrecisionScheduler — some cosmetic, some quietly catastrophic — here's what changed in v1.1.0 and why."
draft: false
---

A few weeks after publishing the [original PrecisionScheduler post](/posts/replacement-task-scheduler-for-sitecore), feedback and real-world use surfaced a handful of issues — some cosmetic, some quietly catastrophic. This post walks through everything fixed in v1.1.0, explains why the old behavior was wrong, and covers the one breaking change you need to handle before upgrading.

The NuGet package is available at [nuget.org/packages/PrecisionScheduler](https://www.nuget.org/packages/PrecisionScheduler/).

## The silent failures

Three of the five issues produced no error, no exception, and no log entry. They just didn't work.

### Issue #1 — Config typo that prevented the scheduler from loading

The `<processor>` registration in `PrecisionScheduler.config` referenced `PrecisionsScheduler` — one extra `s`. On a PackageReference install Sitecore would fail to resolve the type, skip the processor silently, and carry on. Jobs never ran. Nothing in the log.

```xml
<!-- before (broken) -->
<processor type="Scms.Foundation.Scheduling.Pipelines.PrecisionsScheduler, Scms.Foundation">

<!-- after (fixed) -->
<processor type="Scms.Foundation.Scheduling.Pipelines.PrecisionScheduler, Scms.Foundation">
```

If you copied the config from the original post and your jobs have never run, this is likely why. Check your Sitecore log for `[PrecisionScheduler] Starting up precision scheduler.` on startup — if it isn't there, the processor never loaded.

### Issue #2 — Unhandled exception silently killed the refresh cycle

`ManageJobs()` had no try/catch at all. Any unhandled exception — a transient Hangfire storage error, a bad item read, anything — would abort the entire refresh loop. The recurring job that calls `ManageJobs()` every two minutes would keep firing, but the method would throw, log nothing, and leave your job list out of sync.

The fix adds two layers of protection:

- **Outer try/catch** around the entire method body, logging at ERROR level so at least something appears in the Sitecore log.
- **Per-item try/catch** inside each inner loop, so one bad schedule item cannot prevent the rest from being registered or updated.

Two new log helpers were added alongside the existing `LogMessage()`:

```csharp
private static void LogWarning(string message) =>
    Log.Warn($"[PrecisionScheduler] {message}", nameof(PrecisionScheduler));

private static void LogError(string message, Exception ex) =>
    Log.Error($"[PrecisionScheduler] {message}", ex, nameof(PrecisionScheduler));
```

### Issue #3 — Invalid schedule items skipped without a trace

When `GetSchedule()` returned an empty string for a task item — because the schedule field was blank, the recurrence was out of range, or the days bitmask was zero — `ManageJobs()` silently continued to the next item. There was no way to know which items were being skipped without attaching a debugger.

`ManageJobs()` now emits a WARN entry including the Sitecore item path whenever an item is skipped:

```
WARN [PrecisionScheduler] Skipping /sitecore/system/tasks/schedules/MyTask — schedule field is empty or invalid.
```

## The catch-up problem

This is the most significant change in v1.1.0 and the one that required the most iteration.

### What the original code did

At startup, `ManageJobs()` would iterate recurring jobs and check whether a job had missed its last run using this heuristic:

```csharp
var missedLastRun = (recurringJob.NextExecution - scheduleItem.LastRun) > TimeSpan.FromHours(24);
```

The idea was sound — if the gap between when a job last ran and when it's next due is suspiciously large, it probably missed a run during a restart or outage. But the implementation was wrong in both directions.

**Infrequent jobs always triggered.** A weekly job has a `NextExecution - LastRun` gap of roughly seven days. It would satisfy the 24-hour check on every single restart, even when it had run exactly on schedule. The result: a stale catch-up fired on every deployment.

**High-frequency jobs triggered floods.** A job running every five minutes that missed a two-hour outage would satisfy the check. One catch-up is fine; the problem is that the check doesn't distinguish between "missed one run" and "server was down for eight hours."

### Issue #4 — Cron-aware one-interval detection

The fix replaces the time-delta heuristic with a schedule-aware check using [Cronos](https://github.com/HangfireIO/Cronos) (already embedded in `Hangfire.Core`; v1.1.0 adds an explicit `Cronos 0.8.4` reference to expose the public API):

1. Parse the job's cron expression into a `CronExpression`.
2. Find the first occurrence that should have fired after `LastRun`.
3. Fire a catch-up only if that missed slot exists **and** the next occurrence after it is still in the future.

This means the window is exactly one interval wide. A job that ran on schedule will not have a missed slot between its last run and its next due time. A job that genuinely missed one run will have exactly one slot in that window.

### Issue #5 — Hybrid lookback for infrequent jobs

The one-interval check solved the flood problem but introduced a new edge case: a daily or weekly job that genuinely missed a run during a multi-day outage would not catch up, because the next occurrence after the missed slot had already passed by the time the server came back up.

v1.1.0 implements a hybrid strategy:

- **Sub-daily jobs** (hourly, every N minutes): use the one-interval cron-aware check. These jobs run frequently enough that a stale catch-up after a long outage adds no value.
- **Daily+ jobs**: use a configurable absolute lookback window. If the job's last run falls within the lookback period and a run was missed, catch up once.

Two new config properties control this behaviour:

| Property | Default | Description |
|---|---|---|
| `StartupCatchUpEnabled` | `true` | Master switch. Set to `false` to disable all startup catch-up logic. |
| `MissedJobLookbackDays` | `30` | How far back to look for missed daily+ jobs. |

## The one breaking change

There is one breaking change: the `MisfireBehavior` config property has been renamed to `RefreshMisfireBehavior` to make its scope clearer (it governs what happens when the Hangfire refresh job itself misfires, not when a scheduled task misfires).

If you have a config patch that sets this property, update it before deploying:

```xml
<!-- before -->
<MisfireBehavior>FireOnce</MisfireBehavior>

<!-- after -->
<RefreshMisfireBehavior>FireOnce</RefreshMisfireBehavior>
```

The `FireAll` option has also been removed. Valid values are `FireOnce` (default) and `Ignore`. Re-running a sync job multiple times has no meaningful effect, so `FireAll` was misleading.

The full updated configuration reference:

```xml
<processor type="Scms.Foundation.Scheduling.Pipelines.PrecisionScheduler, Scms.Foundation">
  <StartupDelaySeconds>120</StartupDelaySeconds>
  <RefreshSchedule>*/2 * * * *</RefreshSchedule>
  <RefreshMisfireBehavior>FireOnce</RefreshMisfireBehavior>
  <StartupCatchUpEnabled>true</StartupCatchUpEnabled>
  <MissedJobLookbackDays>30</MissedJobLookbackDays>
</processor>
```

## Checking it actually worked

The integration test plan added in issue #8 covers what to check after deploying. At minimum:

1. Confirm `[PrecisionScheduler] Starting up precision scheduler.` appears in the Sitecore log on startup — if it doesn't, the processor didn't load.
2. Create a test schedule item with a cron expression (e.g. `*/1 * * * *`) and confirm `[PrecisionScheduler] Registering recurring job for ...` appears within two minutes.
3. Stop and restart the CM, confirm the job fires once on startup if it was due, and does not fire again immediately on the next restart.
4. Set the schedule field on a test item to an invalid value and confirm a WARN entry appears with the item path.

The [full test checklist is in the repository](https://github.com/michaellwest/PrecisionScheduler).

If you run into anything the test checklist doesn't cover, feedback is welcome.
