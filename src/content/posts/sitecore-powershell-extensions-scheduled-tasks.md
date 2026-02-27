---
title: "Sitecore PowerShell Extensions - Scheduled Tasks"
created: "2013-11-23"
updated: "2014-06-16"
description: "Decided to try out using gists."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2013/11/SPE-ScheduledTasks.html"
migrated: true
---

Decided to try out using gists.

```
function Get-LockedChildItem {
    <#
        .SYNOPSIS
            Gets the locked item at the specified location.
            
        .PARAMETER Path
            Specifies a path to search for locked items. The default location is the current directory (.).
            
        .PARAMETER LockedBy
            Specifies the the owner account locked on the item.
            
        .PARAMETER Unlock
            Indicates the locked items should be unlocked.
            
        .PARAMETER Recurse
            Specifies all the child items at the specified path should be included in the search.
            
        .EXAMPLE
            PS master:\> Get-LockedChildItem
            
            Returns all locked child items at the current path.
            
        .EXAMPLE
            PS master:\> Get-LockedChildItem -LockedBy 'sitecore\admin'
            
            Returns all locked child items at the current path for the specified user.
            
        .EXAMPLE
            PS master:\> Get-LockedChildItem -LockedBy $me -Unlock -Recurse
            
            Returns all locked child items at the current path and below for the specified user. The items are also unlocked.
    #>
    [CmdletBinding()]
    param(
        [ValidateNotNullOrEmpty()]
        [string]$Path = ".",
        
        [string]$LockedBy,
        
        [timespan]$IdleTime=[timespan]::Zero,
        
        [switch]$Unlock,
        
        [switch]$Recurse
    )
    
    filter Locked {
        
        $skip = $false
        
        if($_.Locking -and $_.Locking.IsLocked()) {
            $lockField = [Sitecore.Data.Fields.LockField]$_.Fields[[Sitecore.FieldIDs]::Lock]
            if($lockField) {
                $owner = $lockField.Owner
                if($LockedBy) {
                    if($owner -ne $LockedBy) {
                        Write-Verbose "Skipping locked item $($_.Paths.Path) with different owner."
                        $skip = $true
                    }
                }
                
                if($IdleTime -gt [timespan]::Zero) {
                    $matched = [Sitecore.Web.Authentication.DomainAccessGuard]::Sessions | Where-Object { $_.UserName -eq $owner }
                    if($matched -and $matched.LastRequest.Add($IdleTime) -gt [datetime]::Now) {
                        $user = [Sitecore.Security.Accounts.User]::FromName($owner, $false)
                        if($user -and $user.IsAdministrator) {
                            Write-Verbose "Skipping locked item $($_.Paths.Path) owned by administrator."
                            $skip = $true
                        }
                    }
                } 
                
                if(!$skip) {
                    if($Unlock) {
                        Write-Log "Unlocking item $($_.Paths.Path) which exceeded the specified idle time - locked by $($owner)"
                        $_.Editing.BeginEdit() | Out-Null
                        $_.Locking.Unlock() | Out-Null
                        $_.Editing.EndEdit() | Out-Null
                    }
                
                    $_
                }
            }
        }
    }
    
    Get-ChildItem -Path $Path -Recurse:$Recurse | Locked -Verbose:$Verbose
}
```

[View on GitHub Gist](https://gist.github.com/michaellwest/7619225)
