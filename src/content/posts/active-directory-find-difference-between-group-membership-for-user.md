---
title: "Active Directory - Find Difference Between Group Membership For User"
created: "2013-07-25"
updated: "2014-06-16"
description: "While getting access transferred from one user to another, you may need to know how the group memberships are different between two users."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/07/active-directory-find-difference.html"
migrated: true
---

While getting access transferred from one user to another, you may need to know how the group memberships are different between two users.

```ps

Import-Module ActiveDirectory

$leaving = Get-ADUser -Identity John.Doe -Properties memberof | select -expand memberof
$promoted = Get-ADUser -Identity Michael.West -Properties memberof | select -expand memberof

Compare-Object -ReferenceObject $promoted -DifferenceObject $leaving
```
