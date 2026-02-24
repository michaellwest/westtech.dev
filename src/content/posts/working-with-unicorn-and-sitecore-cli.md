---
title: "Working with Unicorn and Sitecore CLI"
date: 2023-01-16
description: "Running Unicorn and Sitecore CLI side-by-side during a staged migration surfaces some subtle compatibility problems worth knowing about."
tags: ["sitecore", "serialization", "unicorn", "sitecore-cli"]
draft: false
---

Today we explore what happens when you try to run Unicorn and Sitecore CLI at the same time during a staged migration.

Our team can't make a complete switch from Unicorn to Sitecore CLI all at once. The goal was to incrementally adopt the IAR (Items as Resources) plugin to speed up deployments — a folder of 40,000 Unicorn items can take upwards of 30 minutes to zip, clean, extract, and sync on destination servers. Deployment nights were exhausting. We wanted something better.

What we didn't anticipate were the compatibility issues when the two tools share the same items.

## Problem 1: YAML compatibility

When Sitecore CLI serializes items that Unicorn previously owned, certain fields disappear from the YAML output.

**Missing database names.** Unicorn includes the database name in serialized fields. Sitecore CLI omits it. When Unicorn tries to sync those CLI-serialized files, it may fail or behave unexpectedly because it can't determine which database the field belongs to.

**Multilist field delimiters.** Unicorn represents Multilist fields with a specific type identifier and pipe-delimited values. Sitecore CLI drops the type identifier, which means Unicorn syncs the field without the proper delimiter format.

The workaround is tedious: track which fields are affected and manually restore the missing values after CLI serialization.

## Problem 2: Language versions

**The `__Revision` field.** Most Unicorn installations exclude system fields like `__Revision` from serialization. This causes a problem with the Sitecore Publishing Service — when `__Revision` is absent from a serialized item, the publishing service may incorrectly delete the item during a publish. SXA and SPE now include `__Revision` in their IAR files for exactly this reason.

**Empty language versions.** Some Unicorn-generated files have language version sections with no fields listed. When combined with an `excludedFields` list in `sitecore.json`, those items end up with no fields at all under a given language — effectively losing the language version entirely.

The fix for both: update `Unicorn.config` to serialize `__Revision`, then reserialize all your content. It's not a quick task on a large solution, but it prevents subtle data loss during publish.

## How to fix it: reserialize with SPE

Once you've updated `Unicorn.config` to include `__Revision`, you need to reserialize the affected items. This SPE script processes a list of content paths and calls `Export-UnicornItem` on each one:

```powershell
$lines = @"
/sitecore/content/home
"@

$paths = $lines.Split([Environment]::NewLine, [StringSplitOptions]::RemoveEmptyEntries)

foreach ($path in $paths) {
    Get-Item -Path ($path.Replace("/sitecore", "master:")) | Export-UnicornItem
}
```

Gist: [gist.github.com/michaellwest/203d113e48470b6ebec781871dd25e7c](https://gist.github.com/michaellwest/203d113e48470b6ebec781871dd25e7c)

Add your affected paths to the here-string and run it from the SPE console. For 40,000 items this takes a while — run it off-hours.

## How to find the damage

An SPE report works well for identifying items that have language versions in the content tree but no fields in their serialized representation. Query against your serialized root paths and flag anything where a language version section exists but contains no field entries.

## Takeaway

Using Unicorn and Sitecore CLI together is possible but requires careful attention to what each tool includes and excludes in its YAML output. Before you start a phased migration, audit the fields both tools write and make sure the overlap is intentional.
