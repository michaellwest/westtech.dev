---
title: "SXA Theme Upgrade Tip using SPE"
created: "2018-02-01"
description: "In some recent conversations on Sitecore Slack Chat I needed to determine why a component script in SXA was not working as desired (broke)."
tags: ["powershell", "sitecore", "sxa"]
source: "https://michaellwest.blogspot.com/2018/02/sxa-theme-upgrade-tip-using-spe.html"
migrated: true
---

In some recent conversations on [Sitecore Slack Chat](https://siteco.re/sitecoreslack) I needed to determine why a component script in SXA was not working as desired (broke). I decided to write a short PowerShell script in SPE to speed up the troubleshooting.  
  
The following script is designed to compare two script directories under the specified themes and determines which ones have different file sizes.  
  

```powershell
# Get tenant theme
# Tenant Theme - change this to your desired ID
$siteTheme = Get-Item -Path "master:" -ID "{A8665181-7D76-4EEE-B5A3-923FD0671205}"
# Basic 2 Theme
$basicTheme = Get-Item -Path "master:" -ID "{B43D07BD-61D5-448F-9323-8B6ACAD4F3C4}"
# Compare scripts for matching name
$siteScripts = $siteTheme.Children["scripts"].Children | Select-Object -Property Name,ID
$siteScriptsLookup = $siteScripts | ForEach-Object { $lookup = @{} } { $lookup[$_.Name] = $_.ID } { $lookup }
$basicScripts = $basicTheme.Children["scripts"].Children | Select-Object -Property Name,ID
$basicScriptsLookup = $basicScripts | ForEach-Object { $lookup = @{} } { $lookup[$_.Name] = $_.ID } { $lookup }
# Report when script is different file size

$matchingScripts = Compare-Object -ReferenceObject $siteScripts -DifferenceObject $basicScripts -Property Name -IncludeEqual |
    Where-Object { $_.SideIndicator -eq "==" } | Select-Object -Expand Name
foreach($matchingScript in $matchingScripts) {
    $siteScript = Get-Item -Path "master:" -ID $siteScriptsLookup[$matchingScript]
    $basicScript = Get-Item -Path "master:" -ID $basicScriptsLookup[$matchingScript]

    if($siteScript.Size -ne $basicScript.Size) {
        Write-Host "Version mismatch of $($matchingScript)"
    }
}
```

[View on GitHub Gist](https://gist.github.com/michaellwest/babe14646ba4f261004e394ce93c9b5b)

Let's have a look at the sample output:  
  

![](/images/posts/sxa-theme-upgrade-tip-using-spe/SNAG-0119.png)

  
With this information you are hours ahead of where you would have been trying to figure out why the "component-carousel" works on my machine but not in production!  
  
Cheers!  
  
Michael
