---
title: "Move Workstation To New OU With PowerShell"
created: "2015-02-26"
description: "Question came up at work today on how to move a workstation in Active Directory from one OU to another."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2015/02/move-workstation-to-new-ou-with-powershell.html"
migrated: true
---

Question came up at work today on how to move a workstation in Active Directory from one OU to another. Here's what I came up with.  
  
I hope this helps someone!  
  

Import-Module ActiveDirectory

$computers = "PC1","PC2" # Optionally use Get-Content -Path C:\\computers.txt
$computers | ForEach-Object { 
        $computer = "$($\_)$"; Get-ADComputer -Filter { SamAccountName -eq $computer } | 
        Move-ADObject -TargetPath "OU=Retired Workstations,OU=Company,DC=company,DC=corp"
    }

  
// michael
