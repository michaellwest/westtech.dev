---
title: "Sitecore PowerShell Extensions Mixing C# and PowerShell"
created: "2013-09-07"
updated: "2014-06-16"
description: "$code = @\" using System; namespace AwesomeNamespace { public enum AwesomeActivityType { Nothing, Sleeping, Eating, UsingSPE } public class AwesomeClass { public"
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2013/09/sitecore-powershell-extensions-mixing-c.html"
migrated: true
---

```ps

$code = @"
using System;

namespace AwesomeNamespace {
    public enum AwesomeActivityType {
        Nothing,
        Sleeping,
        Eating,
        UsingSPE
    }
    public class AwesomeClass {
        public string DoSomethingAwesome(AwesomeActivityType activity) {
            return String.Format("Your awesome activity is {0}. That's awesome!", activity);
        }
        
        public static string DoSomethingAwesomeAnytime(){
            return "There, their, the're";
        }
    }
}
"@
Add-Type $code

$awesome = New-Object AwesomeNamespace.AwesomeClass
$awesome.DoSomethingAwesome([AwesomeNamespace.AwesomeActivityType]::UsingSPE)
[AwesomeNamespace.AwesomeClass]::DoSomethingAwesomeAnytime()
```
