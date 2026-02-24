---
title: "Clean Orphaned Blob Records"
date: 2025-05-10
description: "Over 60% of a Sitecore database consumed by orphaned blob records — here's what we found and how we fixed it."
tags: ["sitecore", "database"]
draft: false
---

Today we explore some of the challenges with ignoring maintenance of your Sitecore installation.

Recently I found over 60% of the Sitecore master and web databases were consumed by orphaned blob records. This behavior seems to occur when you detach data from an existing media item or delete the media item entirely. The **Blobs** table holds onto these orphaned records until a separate cleanup process runs. There have been a few articles on this before, so I'll keep this focused on what I discovered along the way.

## The part you care about

**Database details before cleanup** — we ran this against Sitecore XM 10.2 and 10.4:

- The MDF file was approaching 60GB with over 90% used space
- Total blob records in the table: 127,300
- Total unused blob records: 104,466
- 59,353 distinct BlobId values

> Consult with Sitecore support before running any cleanup scripts against a production database.

**Database details after cleanup:**

- The MDF file now shows used space at 8% (4.7GB)
- Total blob records in the table: 22,867

**Total run time: 7 hours, 2 minutes, 23 seconds**

## What we used

One script that proved particularly useful was a simple row count query to monitor progress while the cleanup ran:

```sql
SELECT COUNT(*) AS TotalBlobRecords FROM [dbo].[Blobs]
```

To identify orphaned records — blobs with no corresponding item reference — the general approach is a `LEFT JOIN` between the `Blobs` table and the relevant field references in `SharedFields` and `VersionedFields`, then deleting rows where no match is found.

Run this in batches. Deleting 100k records in a single transaction on a live database is a bad time.

## Takeaway

If your Sitecore database is ballooning and you can't explain why, check the `Blobs` table. The numbers might surprise you. Regular maintenance tasks like the **Clean Up** agent in the Control Panel exist for a reason — make sure they're actually running on a schedule.
