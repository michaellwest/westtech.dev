---
title: "Add Users to AD Group Using First Initial"
created: "2013-07-18"
updated: "2014-06-16"
description: "Today at work we had a need to add users to specific Active Directory groups based on the first letter of the first name."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/07/add-users-to-ad-group-using-first.html"
migrated: true
---

Today at work we had a need to add users to specific Active Directory groups based on the first letter of the first name. We'll be using a plain text file as an example for the list of Active Directory identities. Save the following text into a file called names.txt:

John.Doe
Jane.Doe
Jane.Smith

Then you will need to run this in the PowerShell ISE.

```ps

Import-Module ActiveDirectory

# Each row of the text file will be consider one object. The object being the Active Directory identity (SamAccountName).
$names = Get-Content c:\names.txt

# Set this to $false when you are ready to make the changes.
$whatIf = $true

foreach ($name in $names) {
    $user = Get-ADUser -Filter { SamAccountName -eq $name } -Properties MemberOf
    if($user) {
        # The groups object will contain a list of Active Directory groups by their distinguished name. 
        # (i.e. CN=GroupName_A-C,OU=Groups,OU=Company,DC=pri,DC=company,DC=com)
        $groups = $user | Select-Object -ExpandProperty MemberOf
        if(-not ($groups -like 'CN=GroupName_*')) {
            $groupName = ''
            switch -Regex($user.SamAccountName[0]) {
                # Match the first letter as a, b, or c.
                "[a-c]" { $groupName = 'GroupName_A-C' }
                # Match the first letter as d, e, f, or g.
                "[d-g]" { $groupName = 'GroupName_D-G' }
                "[h-k]" { $groupName = 'GroupName_H-K' }
                "[l-q]" { $groupName = 'GroupName_L-Q' }
                "[r-t]" { $groupName = 'GroupName_R-T' }
                "[u-z]" { $groupName = 'GroupName_U-Z' }
            }

            if($groupName) {
                "Adding $($user.SamAccountName) to the group $($groupName)"
                Add-ADGroupMember -Identity $groupName -Members $user.SamAccountName -WhatIf:$whatIf
            }
        } else {
            "Skipping $($user.SamAccountName) because they are already in the group $($groupName)"
        }
    } else {
        "$($name) does not exist"
    }
}
```
