---
title: "PowerShell Revisited - Running Commands"
created: "2014-06-15"
updated: "2014-06-16"
description: "Running PowerShell Commands The command Get-Verb is an example of a cmdlet (pronounced \"command-let\")."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2014/06/powershell-revisited-running-commands.html"
migrated: true
---

**Running PowerShell Commands**

The command _**Get-Verb**_ is an example of a cmdlet (pronounced "command-let"). Cmdlets are structured verb-noun, where the noun is singular.

Below we will get a list of approved verbs in PowerShell, then format the results to fill the screen from left to right:

PS C:\\> Get-Verb | Format-Wide -AutoSize
Add           Clear         Close         Copy         Enter        Exit         Find         Format       Get
Hide          Join          Lock          Move         New          Open         Optimize     Pop          Push
Redo          Remove        Rename        Reset        Resize       Search       Select       Set          Show
Skip          Split         Step          Switch       Undo         Unlock       Watch        Backup       Checkpoint
Compare       Compress      Convert       ConvertFrom  ConvertTo    Dismount     Edit         Expand       Export
Group         Import        Initialize    Limit        Merge        Mount        Out          Publish      Restore
Save          Sync          Unpublish     Update       Approve      Assert       Complete     Confirm      Deny
Disable       Enable        Install       Invoke       Register     Request      Restart      Resume       Start
Stop          Submit        Suspend       Uninstall    Unregister   Wait         Debug        Measure      Ping
Repair        Resolve       Test          Trace        Connect      Disconnect   Read         Receive      Send
Write         Block         Grant         Protect      Revoke       Unblock      Unprotect    Use

Microsoft has provided a nice page on the verb naming rules which can be found [here](http://msdn.microsoft.com/en-us/library/ms714428\(v=vs.85\).aspx).

The commands you use in cmd.exe can also be used within PowerShell since they are either aliased, new functions, or the external executable is called.

-   _**dir**_ is an alias for **_Get-ChildItem_**
-   **_md_** is an alias for **_mkdir_** which is a function for **_New-Item_**
-   **_rmdir_** is an alias for _**Remove-Item**_

Some easy commands that just work:  

-   _**Get-Process**_
-   _**Get-Service**_
-   _**Get-Date**_
-   _**Get-HotFix**_
-   _**Get-History**_
-   _**Start-Transcript, Stop-Transcript**_
-   _**Get-ChildItem**_

Now you may be wondering why the names seem so generic. The idea is that if the names are consistent then you can easily discover new commands. In addition, some commands can be reused in multiple areas such as managing the registry and filesystem. Here is a good example with **_Get-PSDrive_**:  

PS C:\\> Get-PSDrive

Name           Used (GB)     Free (GB) Provider      Root                                               CurrentLocation
----           ---------     --------- --------      ----                                               ---------------
Alias                                  Alias
C                  81.37        151.42 FileSystem    C:\\
Cert                                   Certificate   \\
E                                      FileSystem    E:\\
Env                                    Environment
Function                               Function
HKCU                                   Registry      HKEY\_CURRENT\_USER
HKLM                                   Registry      HKEY\_LOCAL\_MACHINE
I                1112.16        305.87 FileSystem    \\\\chs-fs01\_users\\Users\\Michael.West
Variable                               Variable
WSMan                                  WSMan
Y                   8.88          3.12 FileSystem    \\\\chs\\data

PowerShell uses a variety of providers such as those for connecting to the file system and the registry. This design allows one to use for example, the **_Remove-Item_** command to delete a file or delete a registry key. Sweet!

PS C:\\> $item = New-Object -TypeName PSObject -Property @{Name="Michael";Height=73;}
PS C:\\> $item | Format-List

Height : 73
Name   : Michael

Here I created a new PSObject to contains some details about my name and height. Let's see the member information.

PS C:\\> $item | Get-Member

   TypeName: System.Management.Automation.PSCustomObject

Name        MemberType   Definition
----        ----------   ----------
Equals      Method       bool Equals(System.Object obj)
GetHashCode Method       int GetHashCode()
GetType     Method       type GetType()
ToString    Method       string ToString()
Height      NoteProperty System.Int32 Height=73
Name        NoteProperty System.String Name=Michael

As you can see, the TypeName is "System.Management.Automation.PSCustomObject" and the new properties "Name" and "Height" are listed. The object type will be relevant to whatever object is piped in to **_Get-Member_**.

  

**Get-PSDrive**

Gets the Windows PowerShell drives in the current session.

Example:

```ps

# Displays details about the local disk C.
Get-PSDrive C
```

> **Random fact:**
> 
> Try this: **_(Get-PSDrive)\[0\].Name_** _<# Returns the name of the first object. #>_
> 
> Try this: **_(Get-PSDrive)\[0\].GetType()_** _<# Returns the type of the first object. #>_

**Set-Location**

Sets the current working location to a specified location.

Example:

```ps
# Changes the location to the registry hive HKEY_LOCAL_MACHINE. The colon is required.
Set-Location HKLM:
```

  

PS C:\\> Set-Location HKLM:
PS HKLM:\\> Set-Location C:
PS C:\\> Set-Location Alias:
PS Alias:\\> dir | more

CommandType     Name                                               ModuleName
-----------     ----                                               ----------
Alias           % -> ForEach-Object
Alias           ? -> Where-Object
Alias           ac -> Add-Content
Alias           asnp -> Add-PSSnapin
Alias           cat -> Get-Content
Alias           cd -> Set-Location
Alias           chdir -> Set-Location
Alias           clc -> Clear-Content
Alias           clear -> Clear-Host
Alias           clhy -> Clear-History
Alias           cli -> Clear-Item

As you can see in the image above, I changed to the registry, then the C drive, then to Alias. In all of these locations, you can run the standard commands such as **_dir_**, **_ls_**, **_cd_** and so on. In the image you can also see that cd is an alias for **_Set-Location_**.

Below are some command aliases common in other environments.

**Command**

**Aliases**

Copy-Item

cpi, cp, copy

ForEach-Object

foreach, %

Get-ChildItem

dir, ls

Get-Command

gcm

Get-Content

gc, type, cat

Get-Help

help

Get-Location

gl, pwd

Move-Item

mi, mv, move

Rename-Item

rni, ren

Set-Location

cd, chdir

Where-Object

where, ?

Remove-Item

ri, rd, del, rm, rmdir

> **Random fact:**
> 
> To count the number of items return, use **_Measure-Object_**. Use additional switch parameters such as **_\-Sum_** and **_\-Average_**.
> 
> Try this: _**Get-Process | Measure-Object** <# Returns a table with the results of Measure-Object. #>_
> 
> Try this: _**(Get-Process | Measure-Object).Count** <# Returns the count value. #>_

**Get-Content**

Gets the content of the item at the specified location.

Example:

```ps
# Reads the entire contents of the file.
Get-Content -Path C:\log.txt
```

**Add-Content**

Adds content to the specified items, such as adding words to a file.

Example:

```ps
# Appends the text to the file log.txt.
Add-Content -Path C:\log.txt -Value "The quick brown fox jumps over the lazy dog."
```

**Out-File**

Sends output to a file.

Example:

```ps
# The first command takes a snapshot of all the running processes. 
# The list passed through pipeline to Out-File which is then written to log.txt.
Get-Process | Out-File -FilePath C:\log.txt
```

**Write-Host**

Writes customized output to a host. The information is not kept in the pipeline.

Example:

```ps
# The text is written to the console window.
Write-Host "This text is written to the host, such as the console window."
```

**Write-Output**

Sends the specified objects to the next command in the pipeline. If the command is the last command in the pipeline, the objects are displayed in the console.

Example:

```ps
# The snapshot of running processes is saved into the variable p. The variable p is then written to the console window.
$p = Get-Process; Write-Output -InputObject $p
```

**Write-Verbose**

The text is written to the verbose message stream. This is commonly used in PowerShell scripts.

Example:

```ps

# The text is written to the verbose stream. If the switch -Verbose is used, the text will be written to the console window.
Write-Verbose -Message "The quick brown fox jumps over the lazy dog."
```

  

**New-Item**  

Creates a new item. The item can be a new registry key, file, directory, etc. The type of item created depends on which provider you are connected to.

Example:

```ps
# A new file is created with the specified text.
New-Item -Path C:\ -Name log.txt -ItemType "file"
New-Item -Path C:\log.txt -ItemType "file" -Value "The quick brown fox jumps over the lazy dog."
```
