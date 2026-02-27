---
title: "Run with PowerShell Context Menu"
created: "2013-04-02"
updated: "2014-06-16"
description: "Today I was working on our automated build process at work, and found myself running a batch file in a console window that I wanted to remain open."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/04/run-with-powershell-context-menu.html"
migrated: true
---

Today I was working on our automated build process at work, and found myself running a batch file in a console window that I wanted to remain open. I setup a context menu item associated with .bat files which launches with PowerShell.  
Here are the steps:  

```ps

# We need to create our keys under HKEY_CLASSES_ROOT, which by default has not associated PSDrive.
New-PSDrive -Name HKCR -PSProvider Registry -Root HKEY_CLASSES_ROOT

# Set the current location to the new drive.
cd HKCR:

# Set the current location to the shell key for .bat files.
cd '.\batfile\shell'

# Create a new key called "Run with PowerShell"
New-Item -Path 'Run with PowerShell'

# Set the current location to the new key.
cd '.\Run with PowerShell'

# Create a new key called "command", which will contain the reference to PowerShell.
New-Item -Path 'command'
cd '.\command'

# Create a new "(default)" string with the command to execute PowerShell. The "%1" contains the path to the .bat file. 
New-ItemProperty -Path '.' -Name '(default)' -Value 'C:\WINDOWS\system32\WindowsPowerShell\v1.0\powershell.exe "-nologo" "-noexit" "-command" "& {%1}"'
```

  
Here is an example of the output:

PS C:\\> New-PSDrive -Name HKCR -PSProvider Registry -Root HKEY\_CLASSES\_ROOT

Name           Used (GB)     Free (GB) Provider      Root                  CurrentLocation
----           ---------     --------- --------      ----                  ---------------
HKCR                                   Registry      HKEY\_CLASSES\_ROOT

PS C:\\> cd HKCR:\\batfile\\shell
PS HKCR:\\batfile\\shell> New-Item -Path 'Run with PowerShell'

    Hive: HKEY\_CLASSES\_ROOT\\batfile\\shell

Name                           Property
----                           --------
Run with PowerShell

PS HKCR:\\batfile\\shell> cd '.\\Run with PowerShell'
PS HKCR:\\batfile\\shell\\Run with PowerShell> New-Item -Path 'command'

    Hive: HKEY\_CLASSES\_ROOT\\batfile\\shell\\Run with PowerShell

Name                           Property
----                           --------
command

PS HKCR:\\batfile\\shell\\Run with PowerShell> cd '.\\command'
PS HKCR:\\batfile\\shell\\Run with PowerShell\\command> New-ItemProperty -Path '.' -Name '(default)' -Value 'C:\\WINDOWS\\system32\\WindowsPowerShell\\v1.0\\powershell.exe "-nologo" "-noexit" "-command" "& {%1}"'

(default)    : C:\\WINDOWS\\SysWow64\\WindowsPowerShell\\v1.0\\powershell.exe "-nologo" "-noexit" "-command" "& {%1}"
PSPath       : Microsoft.PowerShell.Core\\Registry::HKEY\_CLASSES\_ROOT\\batfile\\shell\\Run with PowerShell\\command
PSParentPath : Microsoft.PowerShell.Core\\Registry::HKEY\_CLASSES\_ROOT\\batfile\\shell\\Run with PowerShell
PSChildName  : command
PSDrive      : HKCR
PSProvider   : Microsoft.PowerShell.Core\\Registry
