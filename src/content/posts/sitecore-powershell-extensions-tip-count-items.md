---
title: "Sitecore PowerShell Extensions Tip - Count Items"
created: "2015-04-11"
updated: "2015-05-17"
description: "Today I needed a quick report to find out the number of \"pages\" on our site."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2015/04/sitecore-powershell-extensions-tip-count-items.html"
migrated: true
---

Today I needed a quick report to find out the number of "pages" on our site. I came up with a quick estimate using the [Sitecore PowerShell Extensions](http://goo.gl/G2ULkI) module.  
  

```powershell
# List of template ids to exclude from the count.
$templateIds = @(
    "{29FD19B5-6F81-4829-B725-9C4279DA13CE}",
    "{C3C9ED41-B476-49A9-B50C-FF8901665EA0}",
    "{5A905A62-4898-44CE-96BA-EB3432BAAD91}"
)

@(Get-Item -Path master:\content\home) + @(Get-ChildItem -Path master:\content\home -Recurse) |
    Where-Object { $templateIds -notcontains $_.TemplateId } |
    Select-Object -Property Name, TemplateId |
    Measure-Object
```

[View on GitHub Gist](https://gist.github.com/michaellwest/8f4cdf4dc0da0f9d9d46)

I hope this encourages you to spend a little more time in SPE.  
  
// michael
