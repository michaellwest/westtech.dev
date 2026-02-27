---
title: "Get ValidateSet or Enum Options in PowerShell Command"
created: "2013-03-09"
updated: "2013-03-14"
description: "Edit: I renamed the function because I didn't really like the name."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/03/get-validateset-or-enum-options-in_9.html"
migrated: true
---

Edit: I renamed the function because I didn't really like the name.

  

I've seen a few articles on how to get the valid parameter values for a command, however I thought they were a bit messy. Take for example this:  

PS C:\\Users\\Michael> Set-ExecutionPolicy -ExecutionPolicy WrongValue
Set-ExecutionPolicy : Cannot bind parameter 'ExecutionPolicy'. Cannot convert value "WrongValue" to type
"Microsoft.PowerShell.ExecutionPolicy". Error: "Unable to match the identifier name WrongValue to a valid enumerator
name.  Specify one of the following enumerator names and try again: Unrestricted, RemoteSigned, AllSigned, Restricted,
Default, Bypass, Undefined"
At line:1 char:38
+ Set-ExecutionPolicy -ExecutionPolicy WrongValue
+                                      ~~~~~~~~~~
    + CategoryInfo          : InvalidArgument: (:) \[Set-ExecutionPolicy\], ParameterBindingException
    + FullyQualifiedErrorId : CannotConvertArgumentNoMessage,Microsoft.PowerShell.Commands.SetExecutionPolicyCommand

As you can see, you have to sift through the error message to get the valid values. On top of that, you can't do anything with the data because it's trapped in a long string of text. This morning I came up with this function to solve that problem for me.  

```ps

function Get-ParameterOption {
    param(
        $Command,
        $Parameter
    )

    $parameters = Get-Command -Name $Command | Select-Object -ExpandProperty Parameters
    
    $type = $parameters[$Parameter].ParameterType
    if($type.IsEnum) {
        [System.Enum]::GetNames($type)
    } else {
        $parameters[$Parameter].Attributes.ValidValues
    }
}

```

Here are some examples of using it. Please note that there really isn't any error checking, that will be in the next version :) This example is for Set-ExecutionPolicy:  

PS C:\\Users\\Michael> Get-ParameterOption -Command Set-ExecutionPolicy -Parameter ExecutionPolicy
Unrestricted
RemoteSigned
AllSigned
Restricted
Default
Bypass
Undefined

This example is for a custom function which uses the ValidateSet attribute.  

```ps

function Do-Something {
    param(
        [ValidateSet("Low","Medium","High")]
        [string]$Option
    )

    "Something happened"
}

```

PS C:\\Users\\Michael> Get-ParameterOption -CommandName Do-Something -Parameter Option
Low
Medium
High

PS C:\\> Get-ParameterOption -Command Get-Command -Parameter ErrorAction
SilentlyContinue
Stop
Continue
Inquire
Ignore

After I did a little more research, I guess Jeffrey Snover beat me to it.  
[Programmatic way to get valid string values for a parameter](http://blogs.msdn.com/b/powershell/archive/2006/05/10/594175.aspx)
