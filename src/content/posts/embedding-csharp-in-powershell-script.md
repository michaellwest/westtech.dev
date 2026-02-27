---
title: "Embedding Csharp in PowerShell Script"
created: "2013-04-26"
updated: "2014-06-16"
description: "I wanted to use a \"using block\" found in C# to dispose of objects in PowerShell such as Streams or other object types that require the calling of Dispose."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/04/embedding-csharp-in-powershell-script.html"
migrated: true
---

I wanted to use a "using block" found in C# to dispose of objects in PowerShell such as Streams or other object types that require the calling of Dispose. After seeing different examples here is where I [stopped](http://weblogs.asp.net/adweigert/archive/2008/08/27/powershell-adding-the-using-statement.aspx). I made some minor tweaks.

1.  Begin by creating a class in C#. You can also save the code in a separate file such as Code.cs. See help Add-Type -Examples for additional examples. The class must also inherit from System.IDisposable, otherwise the using-block function will complain with something like 'using-block : Cannot process argument transformation on parameter 'InputObject'. Cannot convert the "Code" value of type "Code" to type "System.IDisposable".'
2.  Create your using block with the instantiation of a new object in parentheses.
3.  Finally, in the script block place your needed logic.

  

```ps

Add-Type @"
using System;

public class Code : IDisposable
{
    public Code()
    {
        Name = "Michael";
    }
    
    public string Name { get; set; }

    public bool IsDisposed { get; set; }
    public void Dispose() 
    {
        Dispose(true);
        GC.SuppressFinalize(this);      
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!IsDisposed)
        {
            IsDisposed = true;   
        }
    }
}
"@

function using-block {
    param (
        [System.IDisposable]$InputObject = $(throw "The parameter -inputObject is required."),
        [ScriptBlock]$ScriptBlock = $(throw "The parameter -scriptBlock is required.")
    )
    try { & $ScriptBlock }
    finally {
        if ($InputObject) {
            if ($InputObject.PSBase) {
                $InputObject.PSBase.Dispose()
            } else {
                $InputObject.Dispose()
            }
        }
    }
}

using-block($c = New-Object Code) {
    $name = $c.Name
    $name # Michael
    $c.IsDisposed # False
}
$name # Not in this scope so no value
$c.IsDisposed # True
```

This may not be the most elegant approach but it served it's purpose.
