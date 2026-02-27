---
title: "Sitecore PowerShell Extensions Tip 2 - Set Random Wallpaper"
created: "2014-10-26"
description: "As of late I've spent more time using Sitecore PowerShell Extensions .Today I decided to change the wallpaper with a random image from the media library."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2014/10/sitecore-powershell-extensions-tip-2.html"
migrated: true
---

As of late I've spent more time using [Sitecore PowerShell Extensions](http://goo.gl/G2ULkI).Today I decided to change the wallpaper with a random image from the media library.  

  

\# Get all the first level items in the images folder.
$items = Get-ChildItem -Path "master:\\media library\\images\\"
# Select an item at random.
$item = $items\[(Get-Random -Maximum ($items.length - 1))\]
$url = \[Sitecore.Resources.Media.MediaManager\]::GetMediaUrl($item)

# Get the user in need of a refreshed wallpaper.
$user = Get-User -Identity "sitecore\\admin" -Authenticated
$user.Profile.SetCustomProperty("Wallpaper", $url)
$user.Profile.Save();

  
I hope this encourages you to spend a little more time in SPE.
