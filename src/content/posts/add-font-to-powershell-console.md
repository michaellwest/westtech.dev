---
title: "Add Font to PowerShell Console"
created: "2013-03-15"
updated: "2014-06-16"
description: "I saw an article about Adobe's release of a new font called Source Code Pro which was designed in part to help reduce the confusion between certain characters."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/03/add-font-to-powershell-console.html"
migrated: true
---

I saw an article about Adobe's release of a new font called [Source Code Pro](http://blogs.adobe.com/typblography/2012/09/source-code-pro.html) which was designed in part to help reduce the confusion between certain characters. I thought I would give it a try. After copying the .ttf files to C:\\Windows\\Fonts, I realized that the font needed to be added in the registry, so here are some steps to get you going.

Change the provider to the registry HKLM: which will get you to HKEY\_LOCAL\_MACHINE. Navigate to the Console key, then list the properties for TrueTypeFont. Note: I removed some of the extra entries returned by Get-ItemProperty for clarity.

PS C:\\> cd HKLM:
PS HKLM:\\> cd '.\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Console'
PS HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Console> Get-ItemProperty -Path TrueTypeFont

0            : Lucida Console
00           : Consolas
PSPath       : Microsoft.PowerShell.Core\\Registry::HKEY\_LOCAL\_MACHINE\\SOFTWARE\\Microsoft\\Windows
               NT\\CurrentVersion\\Console\\TrueTypeFont
PSParentPath : Microsoft.PowerShell.Core\\Registry::HKEY\_LOCAL\_MACHINE\\SOFTWARE\\Microsoft\\Windows
               NT\\CurrentVersion\\Console
PSChildName  : TrueTypeFont
PSDrive      : HKLM
PSProvider   : Microsoft.PowerShell.Core\\Registry

Add the new string value. Here I see that 0 and 00 are already used, so we're going to use 000. Then verify the new string exists.

PS HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Console> Set-ItemProperty -Path TrueTypeFont -Name 000 -Value 'Source Code Pro'
PS HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Console> Get-ItemProperty -Path TrueTypeFont

0            : Lucida Console
00           : Consolas
000          : Source Code Pro
PSPath       : Microsoft.PowerShell.Core\\Registry::HKEY\_LOCAL\_MACHINE\\SOFTWARE\\Microsoft\\Windows
               NT\\CurrentVersion\\Console\\TrueTypeFont
PSParentPath : Microsoft.PowerShell.Core\\Registry::HKEY\_LOCAL\_MACHINE\\SOFTWARE\\Microsoft\\Windows
               NT\\CurrentVersion\\Console
PSChildName  : TrueTypeFont
PSDrive      : HKLM
PSProvider   : Microsoft.PowerShell.Core\\Registry

Let's try and programmatically set the new font in the console. Create a new PSDrive for the HKEY\_USERS hive. Change to the HKU: drive. Change to the SID for the current user. Set the Console property for FaceName to the new font.

PS C:\\> New-PSDrive HKU Registry HKEY\_USERS

Name           Used (GB)     Free (GB) Provider      Root                                               CurrentLocation
----           ---------     --------- --------      ----                                               ---------------
HKU                                    Registry      HKEY\_USERS

PS C:\\> cd HKU:
PS HKU:\\> cd (New-Object System.Security.Principal.NTAccount($env:USERNAME)).Translate(\[System.Security.Principal.SecurityIdentifier\]).Value
PS HKU:\\S-1-5-21-3501008845-2378336731-207489776-1001>
PS HKU:\\S-1-5-21-3501008845-2378336731-207489776-1001> Set-ItemProperty -Path Console -Name FaceName -Value 'Source Code Pro'

Now you just need to restart your console and you're good to go!
