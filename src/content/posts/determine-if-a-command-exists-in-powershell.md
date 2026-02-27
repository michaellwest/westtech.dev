---
title: "Determine If A Command Exists In PowerShell"
created: "2013-03-17"
updated: "2014-06-16"
description: "Ed Wilson \"The Scripting Guy\" posted a great article a while back on how to determine if a command exists here ."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/03/determine-if-command-exists-in.html"
migrated: true
---

Ed Wilson "The Scripting Guy" posted a great article a while back on how to determine if a command exists [here](http://blogs.technet.com/b/heyscriptingguy/archive/2013/02/19/use-a-powershell-function-to-see-if-a-command-exists.aspx). Here is another approach that I came up with that morning.

```ps

function Test-Command {
   param($Command)

   $found = $false
   $match = [Regex]::Match($Command, "(?<Verb>[a-z]{3,11})-(?<Noun>[a-z]{3,})", "IgnoreCase")
   if($match.Success) {
       if(Get-Command -Verb $match.Groups["Verb"] -Noun $match.Groups["Noun"]) {
           $found = $true
       }
   }

   $found
}
```

Here is a breakdown of the regular expression used.

-   The first group in the expression is for the verb, which is 3 to 11 characters long (consult the approved verb [list](http://blogs.msdn.com/b/powershell/archive/2009/07/15/final-approved-verb-list-for-windows-powershell-2-0.aspx)).
-   The second group in the expression is for the noun, which can be 3 or more characters long. I limit the acceptable text to only alphabetical characters and by adding the "IgnoreCase" option we can just use "a-z".

So what would an article be without a quick example.

PS C:\\> Test-Command -Command Get-Process
True
PS C:\\> Test-Command -Command Get-Proc\*
False

Finally, if you would like a shortcut which expects an exact match you can try this:

PS C:\\> \[bool\](Get-Command -Name Get-Process -ea 0)
True
