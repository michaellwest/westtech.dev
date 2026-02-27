---
title: "Sitecore PowerShell Extensions Tip - Delete Unused Media Items"
created: "2014-10-25"
description: "Sitecore PowerShell Extensions Delete unused media items older than 30 days."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2014/10/sitecore-powershell-extensions-tip.html"
migrated: true
---

[Sitecore PowerShell Extensions](http://goo.gl/G2ULkI)  

  

Delete unused media items older than 30 days.

  

  

```powershell
<#
    .SYNOPSIS
        Moves items to the recycle bin which are more than 30 days old and have no references.
    
    .NOTES
        Michael West
#>

filter Skip-MissingReference {
    $linkDb = [Sitecore.Globals]::LinkDatabase
    if($linkDb.GetReferrerCount($_) -eq 0) {
        $_
    }
}

$date = [datetime]::Today.AddDays(-30)

$items = Get-ChildItem -Path "master:\sitecore\media library" -Recurse | 
    Where-Object { $_.TemplateID -ne [Sitecore.TemplateIDs]::MediaFolder } |
    Where-Object { $_.__Owner -ne "sitecore\admin" -and $_.__Updated -lt $date } |
    Skip-MissingReference

if($items) {
    Write-Log "Removing $($items.Length) item(s) older than 30 days."
    $items | Remove-Item
}
```

[View on GitHub Gist](https://gist.github.com/michaellwest/1db258e206beea164e5b)
