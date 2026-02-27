---
title: "Sitecore PowerShell Extensions - System Maintenance"
created: "2015-05-17"
description: "Here recently I was thinking about how I could perform some of the system maintenance tasks that you would have to manually run from the Sitecore Control Panel."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2015/05/sitecore-powershell-extensions-system-maintenance.html"
migrated: true
---

Here recently I was thinking about how I could perform some of the system maintenance tasks that you would have to manually run from the Sitecore Control Panel. I decided to add these scripts to the System Maintenance script module in the [Sitecore PowerShell Extensions](http://goo.gl/G2ULkI) module.

```powershell
<#
    .SYNOPSIS
        Runs a clean up for each database.
        
    .NOTES
        Michael West
#>

foreach($database in Get-Database) {
    if(!$database.ReadOnly) {
        Write-Log "Cleaning up the $($database) database."
        $time = Measure-Command {
            $database.CleanupDatabase()
        }
        Write-Log "Completed cleaning up the $($database) database in $($time.TotalSeconds) seconds."
    }
}
```

```powershell
<#
    .SYNOPSIS
        Runs a clean up for each link database.
        
    .NOTES
        Michael West
#>

foreach($database in Get-Database) {
    if(!$database.ReadOnly) {
        Write-Log "Rebuilding the $($database) link database."
        $time = Measure-Command {
            [Sitecore.Globals]::LinkDatabase.Rebuild($database)
        }
        Write-Log "Completed rebuilding the $($database) link database in $($time.TotalSeconds) seconds."
    }
}
```

```powershell
<#
    .SYNOPSIS
        Rebuilds all the content search indexes.
        
    .NOTES
        Michael West
#>

foreach($index in [Sitecore.ContentSearch.ContentSearchManager]::Indexes) {
    Write-Log "Rebuilding the $($index.Name) search index."
    $time = Measure-Command {
        $index.Rebuild()
    }
    Write-Log "Completed rebuilding the $($index.Name) search index in $($time.TotalSeconds) seconds."
}
```

```powershell
<#
    .SYNOPSIS
        Rebuilds the search indexes.
        
    .NOTES
        Michael West
#>

foreach($index in [Sitecore.Search.SearchManager]::Indexes) {
    Write-Log "Rebuilding the search index $($index.Name)"
    $time = Measure-Command {
        $index.Rebuild()
    }
    Write-Log "Completed rebuilding the search index $($index.Name) in $($time.TotalSeconds) seconds."
}
```

[View on GitHub Gist](https://gist.github.com/michaellwest/0cb33b2068a72c3e7823)

I hope this encourages you to spend a little more time in SPE.  
  
// michael
