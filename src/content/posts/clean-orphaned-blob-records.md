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

Full scripts are in this gist: [gist.github.com/michaellwest/9a9a7b78ac4f1a3463fe3d59ad5455f2](https://gist.github.com/michaellwest/9a9a7b78ac4f1a3463fe3d59ad5455f2)

**CountBlobsTotal.sql** — faster than `SELECT COUNT(1)` on a large table because it reads partition statistics instead of scanning rows:

```sql
/* Count all the rows in the Blobs table.
   Considerably faster than SELECT COUNT(1) FROM [Blobs] */
SELECT
   Total_Rows= SUM(st.row_count)
FROM
   sys.dm_db_partition_stats st
WHERE
    object_name(object_id) = 'Blobs' AND (index_id < 2)
```

**CountUnusedBlobs.sql** — identifies orphaned records by cross-referencing the `Blobs` table against every field table that can reference a blob. Checks both braced and unbraced GUID formats:

```sql
/* Returns the count of unused blobs both in total and a unique list. */
WITH [ExistingBlobs] ([BlobId]) AS (
    SELECT [Blobs].[BlobId] FROM [Blobs]
    JOIN [SharedFields] ON '{' + CONVERT(NVARCHAR(MAX), [Blobs].[BlobId]) + '}' = [SharedFields].[Value]
    UNION
    SELECT [Blobs].[BlobId] FROM [Blobs]
    JOIN [SharedFields] ON CONVERT(NVARCHAR(MAX), [Blobs].[BlobId]) = [SharedFields].[Value]
    UNION
    SELECT [Blobs].[BlobId] FROM [Blobs]
    JOIN [VersionedFields] ON '{' + CONVERT(NVARCHAR(MAX), [Blobs].[BlobId]) + '}' = [VersionedFields].[Value]
    UNION
    SELECT [Blobs].[BlobId] FROM [Blobs]
    JOIN [VersionedFields] ON CONVERT(NVARCHAR(MAX), [Blobs].[BlobId]) = [VersionedFields].[Value]
    UNION
    SELECT [Blobs].[BlobId] FROM [Blobs]
    JOIN [UnversionedFields] ON '{' + CONVERT(NVARCHAR(MAX), [Blobs].[BlobId]) + '}' = [UnversionedFields].[Value]
    UNION
    SELECT [Blobs].[BlobId] FROM [Blobs]
    JOIN [UnversionedFields] ON CONVERT(NVARCHAR(MAX), [Blobs].[BlobId]) = [UnversionedFields].[Value]
    UNION
    SELECT [Blobs].[BlobId] FROM [Blobs]
    JOIN [ArchivedFields] ON '{' + CONVERT(NVARCHAR(MAX), [Blobs].[BlobId]) + '}' = [ArchivedFields].[Value]
    UNION
    SELECT [Blobs].[BlobId] FROM [Blobs]
    JOIN [ArchivedFields] ON CONVERT(NVARCHAR(MAX), [Blobs].[BlobId]) = [ArchivedFields].[Value]
)
SELECT
  COUNT([Blobs].[BlobId]) AS [UnusedCount],
  COUNT(DISTINCT [Blobs].[BlobId]) AS [UnusedDistinctCount]
FROM [Blobs]
LEFT JOIN [ExistingBlobs] ON [Blobs].[BlobId] = [ExistingBlobs].[BlobId]
WHERE [ExistingBlobs].[BlobId] IS NULL
```

**CleanUnusedBlobs.sql** — the actual deletion script. It uses the same CTE to identify orphans, loads them into a temp table, then deletes in batches of 1,000 with a loop cap of 10,000 iterations. Each batch is its own transaction. Full script in the gist above — review it before you run it.

## Takeaway

If your Sitecore database is ballooning and you can't explain why, check the `Blobs` table. The numbers might surprise you. Regular maintenance tasks like the **Clean Up** agent in the Control Panel exist for a reason — make sure they're actually running on a schedule.
