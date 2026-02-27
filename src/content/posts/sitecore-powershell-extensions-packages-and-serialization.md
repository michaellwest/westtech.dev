---
title: "Sitecore PowerShell Extensions Packages and Serialization"
created: "2013-08-31"
updated: "2014-06-16"
description: "I'm at it again. Had fun today creating packages and serializing items with SPE."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2013/08/SPE-PackagesAndSerialization.html"
migrated: true
---

I'm at it again. Had fun today creating packages and serializing items with SPE.  
Demo Code:  

```ps

# Serialization
Get-Item -Path "master:\templates\spe\" | Serialize-Item -Recurse

# Packages
$name = "dinner"
$package = New-Package -Name $name

$source = Get-Item "master:\templates\spe" | New-ItemSource -Name "Dinner Plates" -InstallMode Overwrite -MergeMode Merge
$package.Sources.Add($source)

$package | Export-Package -Path "$name.xml"
$package | Export-Package -Path "$name.zip" -Zip

```
