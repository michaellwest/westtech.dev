---
title: "Sitecore PowerShell Extensions Unlock Items"
created: "2013-09-04"
updated: "2014-06-16"
description: "Below is an example of how to unlock all items under the Content tree."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2013/09/SPE-UnlockItems.html"
migrated: true
---

Below is an example of how to unlock all items under the Content tree.  

```ps

 
# Find all the items under content recursively, then only return the properties you want. Here we only want items that are locked.
gci master:\content -rec | where { $_.Locking.IsLocked() } | 
    select Name, Id, @{n="IsLocked";e={$_.Locking.IsLocked()}}
 
```

  
The following aliases or shortened commands were used:

-   gci = Get-ChildItem
-   where = Where-Object
-   select = Select-Object

Note: To autosize the table pipe the output to the following command: **ft -auto**  

```ps

 
# Unlock all the items.
gci master:\content -rec | where { $_.Locking.IsLocked() } | % { $_.Locking.Unlock() }
 
```
