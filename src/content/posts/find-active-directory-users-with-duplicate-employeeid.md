---
title: "Find Active Directory Users with Duplicate EmployeeId"
created: "2013-08-23"
updated: "2019-01-03"
description: "Today I needed to create a report of all Active Directory users with duplicate EmployeeId."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/08/ADUsersWithDuplicateEmployeeId.html"
migrated: true
---

Today I needed to create a report of all Active Directory users with duplicate EmployeeId. The first thing I thought to try was using the -Unique parameter. Let's see all the commands that support it.  

PS C:\\> Get-Command -ParameterName Unique

CommandType     Name                                               ModuleName
-----------     ----                                               ----------
Cmdlet          Select-Object                                      Microsoft.PowerShell.Utility
Cmdlet          Sort-Object                                        Microsoft.PowerShell.Utility

  
This is great! I see two commands that will filter and return unique values. Let's see each in action.  

PS C:\\> 1,1,1,2,3,3 | Select-Object -Unique
1
2
3

  
Well what I really want to see is that 1 and 3 are returned for each instance. When talking in terms of Active Directory users, the EmployeeId will be duplicated but not the user, so this really isn't going to work.  
In this example Sort-Object will work basically the same but also sort the list for us.  

PS C:\\> 3,3,2,1,1,1 | Sort-Object -Unique
1
2
3

  
Another option is to go through all the users and tally up each occurrence of the EmployeeId and then filter them out.  

PS C:\\> $values = 1,1,1,2,3,3
PS C:\\> $ids = @{}; $values | ForEach-Object { $ids\[$\_\] += 1 }
PS C:\\> $filteredValues = $values | Where-Object { $ids\[$\_\] -eq 1 }
PS C:\\> $filteredValues
2

  
Since we want the duplicates returned we can change the -eq to -gt like the following:  

PS C:\\> $filteredValues = $values | Where-Object { $ids\[$\_\] -gt 1 }
PS C:\\> $filteredValues
1
1
1
3
3

  
Still with me? The performance gain is from using the hashtable $ids; really good for creating a quick lookup table. So now that we know how to find the duplicates, let's try that in AD. I added a little error checking to make sure that the user actually has a value in the EmployeeId field (hashtables will also freakout with empty keys).  

PS C:\\> $users = Get-ADUser -Filter { Enabled -eq $true } -Properties EmployeeId
PS C:\\> $ids = @{}; $users | ForEach-Object { if($\_.EmployeeId) { $ids\[$\_.EmployeeId\] += 1 } }
PS C:\\> $filteredUsers = $users | Where-Object { if($\_.EmployeeId) { $ids\[$\_.EmployeeId\] -gt 1 } }
PS C:\\> $filteredUsers | Select-Object -Property SamAccountName, EmployeeId
SamAccountName    EmployeeId
--------------    ----------
Michael.L.West    1234567
Michael.West      1234567

  
Finally, you can pipe the last line to Export-Csv to create your report.  
  
Here is the above example in a form that uses the hashtable and one that users Group-Object (which might be a little faster).  

### Use Group-Object

$users = Get-ADUser -Filter { Enabled -eq $true } -Properties EmployeeId

# Group by comparing the EmployeeId field
$grouped = $users | 
    Where-Object { \[string\]::IsNullOrEmpty($\_.EmployeeId) } | 
    Group-Object -Property EmployeeId | 
    Where-Object { $\_.Count -gt 1 }
$filteredUsers = $grouped | ForEach-Object { $\_ | Select-Object -ExpandProperty Group }
$filteredUsers | Select-Object -Property SamAccountName, EmployeeId

### Use Lookup Table

$users = Get-ADUser -Filter { Enabled -eq $true } -Properties EmployeeId

# Increment a lookup table with the count
$idLookup = $users | ForEach-Object { $idLookup = @{} } { if($\_.EmployeeId) { $idLookup\[$\_.EmployeeId\] += 1 } } { $idLookup }
$filteredUsers = $users | Where-Object { if($\_.EmployeeId) { $idLookup\[$\_.EmployeeId\] -gt 1 } }
$filteredUsers | Select-Object -Property SamAccountName, EmployeeId
