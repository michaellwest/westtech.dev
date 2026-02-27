---
title: "Sitecore PowerShell Extensions Creating Functions"
created: "2013-08-24"
updated: "2014-06-16"
description: "Creating a function. Code below."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2013/08/SPE-CreatingFunctions.html"
migrated: true
---

Creating a function. Code below.  
  

```ps

function Clear-SCArchive {
    <#
        .SYNOPSIS
             Clears entries from the archive. Defaults to a 30 retention period for the recyclebin.
             
        .EXAMPLE
            Remove all items 30 days or older.
            
            PS master:\> Clear-SCArchive
            
        .NOTES
            Michael West
            michaellwest.blogspot.com
            @MichaelWest101

            about_Comment_Based_Help
            about_Comparison_Operators
            about_Functions_Advanced
            about_Functions_Advanced_Parameters
            about_Functions_CmdletBindingAttribute
    #>
    [CmdletBinding()]
    param(
        [ValidateNotNullOrEmpty()]
        [string]$Name = "recyclebin",
        
        [int]$Days = 30
    )
    
    $expired = [datetime]::Now.AddDays(-1 * [Math]::Abs($Days))
    
    foreach($archive in Get-Archive -Name $Name) {
        $entries = $archive.GetEntries(0, $archive.GetEntryCount())
        foreach($entry in $entries){
            if($entry.ArchiveLocalDate -le $expired) {
                Write-Log "Removing item: $($entry.ArchivalId)"
                $archive.RemoveEntries($entry.ArchivalId)
            } else {
                Write-Verbose "Skipping $($entry.Name) on date $($entry.ArchiveLocalDate)"
            }
        }
    }
}
```
