---
title: "Disable PowerShell Remoting"
created: "2013-03-23"
updated: "2014-06-16"
description: "Here are a few quick steps to \"undo\" the default changes performed by Enable-PSRemoting."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/03/disable-powershell-remoting.html"
migrated: true
---

Here are a few quick steps to "undo" the default changes performed by Enable-PSRemoting.

PS C:\\> Disable-PSRemoting -Force
WARNING: Disabling the session configurations does not undo all the changes made by the Enable-PSRemoting or Enable-PSSessionConfiguration cmdlet. You might have to manua
lly undo the changes by following these steps:
    1. Stop and disable the WinRM service.
    2. Delete the listener that accepts requests on any IP address.
    3. Disable the firewall exceptions for WS-Management communications.
    4. Restore the value of the LocalAccountTokenFilterPolicy to 0, which restricts remote access to members of the Administrators group on the computer.
PS C:\\> winrm delete winrm/config/listener?address=\*+transport=HTTP
PS C:\\> Stop-Service winrm
PS C:\\> Set-Service -Name winrm -StartupType Disabled
PS C:\\> Set-ItemProperty -Path HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System -Name LocalAccountTokenFilterPolicy -Value 0 -Type DWord
