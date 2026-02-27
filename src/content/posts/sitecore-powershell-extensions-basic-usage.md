---
title: "Sitecore PowerShell Extensions Basic Usage"
created: "2013-08-23"
updated: "2014-06-16"
description: "Basic run through on using the Console and ISE from within Sitecore."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2013/08/sitecore-powershell-extensions-basic.html"
migrated: true
---

Basic run through on using the Console and ISE from within Sitecore.  

```ps

# Get details on how to use the Get-Item command
Get-Help Get-Item
# Get the list of items under home and filter by creator
Get-ChildItem master:\content\home | Where-Object { $_."__Created By" -eq "sitecore\admin" }
# Get the list of Sitecore PowerShell Extension commands
Get-Command | Where-Object {$_.Implementingtype.FullName -match "Cognifide.PowerShell"} | 
    Select-Object -Property Name | Format-Table
```
