---
title: "Replacement Task Scheduler for Sitecore"
date: 2022-08-27
description: "Sitecore's built-in task scheduler has some well-known limitations. Here's how we replaced it with Hangfire for more reliable background job scheduling."
tags: ["sitecore", "dotnet", "hangfire"]
draft: false
---

Today we look at replacing Sitecore's built-in task scheduler with something that actually does what you expect.

The out-of-the-box Task Scheduler in Sitecore has a few frustrating limitations:

- Tasks can't be reliably scheduled for a specific time
- If a task is missed during downtime, it runs immediately on restart — which is often the worst possible moment
- The scheduling format is non-standard and not well-documented
- There's no visibility into what ran, when, or whether it succeeded

We replaced it with **Hangfire**, a .NET background processing library that handles recurring jobs, retries, and a built-in dashboard.

## How it works

The implementation hooks into Sitecore's OWIN pipeline so Hangfire initializes at the right point in the startup sequence.

### Pipeline processor

We create a processor that inherits from `Sitecore.Owin.Pipelines.Initialize.InitializeProcessor` to get access to `IAppBuilder`, which is what Hangfire needs for registration:

```csharp
public class InitializeHangfire : InitializeProcessor
{
    public override void Process(InitializeArgs args)
    {
        GlobalConfiguration.Configuration.UseMemoryStorage();

        args.App.UseHangfireServer();
        args.App.UseHangfireDashboard("/hangfire");

        ScheduleJobs();
    }

    private void ScheduleJobs()
    {
        RecurringJob.AddOrUpdate<MyJobClass>(
            "my-job",
            job => job.Execute(),
            "30 4 * * *"  // 4:30 AM daily, standard cron
        );
    }
}
```

### Configuration patch

Disable the built-in Sitecore scheduler and register the new processor:

```xml
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <scheduling>
      <agent type="Sitecore.Tasks.DatabaseAgent" method="Run" interval="00:10:00">
        <patch:attribute name="interval">00:00:00</patch:attribute>
      </agent>
    </scheduling>
    <pipelines>
      <owin.initialize>
        <processor type="YourNamespace.InitializeHangfire, YourAssembly"
                   patch:after="processor[@type='Sitecore.Owin.Pipelines.Initialize.RegisterRoutes, Sitecore.Owin']" />
      </owin.initialize>
    </pipelines>
  </sitecore>
</configuration>
```

### NuGet dependencies

```
Hangfire.AspNet
Hangfire.Core
Hangfire.MemoryStorage
```

We used in-memory storage to keep it simple and avoid adding a Hangfire SQL schema to the database. For jobs that absolutely must survive a restart, you'd want to switch to `Hangfire.SqlServer`.

## Alternatives

**SiteCron** is a solid option if you want something purpose-built for Sitecore. We couldn't use it in this case due to environment constraints, but it would have been my first choice.

## Honest disclaimer

Hangfire worked well for the scheduling problem, but we eventually moved the heavier background work into a separate .NET 6 application using **Quartz.NET**. Keeping long-running jobs inside the Sitecore process has its own risks — application pool recycles, deployment restarts, and memory pressure all affect job reliability. A standalone worker is cleaner if your jobs are doing serious work.

Start with Hangfire in-process, but keep the separate service option in mind as your job complexity grows.
