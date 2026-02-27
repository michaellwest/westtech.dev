---
title: "Report Duplicate AD Users By EmployeeID"
created: "2014-01-17"
updated: "2014-06-16"
description: "Note: The employeeID is formatted to 7 characters so that if you had numbers with leading 0s they would still be matched."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2014/01/report-duplicate-ad-users-by-employeeid.html"
migrated: true
---

Note: The employeeID is formatted to 7 characters so that if you had numbers with leading 0s they would still be matched.

```
# Get all the enabled users.
$users = Get-ADUser -Filter { Enabled -eq $true } -Properties EmployeeId
# Collect all the ids and format them to 7 characters.
$ids = @{}; $users | ForEach-Object { if($_.EmployeeId) { $ids[("{0:D7}" -f [int]$_.EmployeeId)] += 1 } }
$filteredUsers = $users | Where-Object { if($_.EmployeeId) { $ids[("{0:D7}" -f [int]$_.EmployeeId)] -gt 1 } }
$filteredUsers | Select-Object -Property SamAccountName, EmployeeId
$filteredUsers | Export-Csv -Path "C:\temp\DuplicateEmployeeId-$((Get-Date).ToString('yyyyMMddThhmmss')).csv" -NoTypeInformation
```

[View on GitHub Gist](https://gist.github.com/michaellwest/8477243)
