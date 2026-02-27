---
title: "Sitecore PowerShell Extensions Remoting v2"
created: "2015-07-13"
description: "Let me start off by saying that the work done by Himadri here is a great example at the flexibility of SPE ."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2015/07/sitecore-powershell-extensions-remoting.html"
migrated: true
---

Let me start off by saying that the work done by Himadri [here](https://himadritechblog.wordpress.com/2015/05/02/bulk-loading-images-in-sitecore-media-library-using-sitecore-powershell-extension-spe/) is a great example at the flexibility of [SPE](https://marketplace.sitecore.net/en/Modules/Sitecore_PowerShell_console.aspx). Not long ago Adam posted about [Remoting](http://blog.najmanowicz.com/2014/10/10/sitecore-powershell-extensions-remoting/) in SPE, it became clear that we needed to have a Windows PowerShell module that users can setup outside of Sitecore that would come with all the necessary commands to interact with [SPE](https://marketplace.sitecore.net/en/Modules/Sitecore_PowerShell_console.aspx). In our 3.1 [release](http://sitecorepowershell.gitbooks.io/sitecore-powershell-extensions/content/releases.html) we included the module, so feel free to grab that now.  
  
In this post I would like to show some recent enhancements made in 3.2 that will make interacting with [SPE](https://marketplace.sitecore.net/en/Modules/Sitecore_PowerShell_console.aspx) even better!  
  
The packaged Windows PowerShell module can be found on the marketplace listed as SPE Remoting. That is the preferred method for interacting with SPE outside of the Sitecore environment. If you wish to use the same code from within the browser, such as to interact with another instance of SPE, you'll find the commands under here:  

```ps
master:/system/Modules/PowerShell/Script Library/Platform/Functions/Remoting2
```

  
We've included all of the documentation below in our [book](http://sitecorepowershell.gitbooks.io/sitecore-powershell-extensions/content/remoting.html).  
When you execute the script or import the module you'll get the following commands:  

-   **New-ScriptSession** - This can be reused between calls to all the other commands.
-   **Invoke-RemoteScript** - Best option for performing any remote script execution.
-   **Send-MediaItem** - Remotely upload.
-   **Receive-MediaItem** - Remotely download.

Let's walk through a few examples at using the commands.  
  
Create a new session object that will contain a reference to the SPE session id and the web service proxy. Next we invoke a scriptblock on the server within the session.  
  

```powershell
# The following example remotely executes a script in Sitecore using a reusable session.

$session = New-ScriptSession -Username admin -Password b -ConnectionUri http://remotesitecore
Invoke-RemoteScript -Session $session -ScriptBlock { Get-User -id admin }

Name                     Domain       IsAdministrator IsAuthenticated
----                     ------       --------------- ---------------
sitecore\admin           sitecore     True            False
```

[View on GitHub Gist](https://gist.github.com/michaellwest/f1d8fce1656ec5bbfb7d)

If you would like to download images from the media library you can do something as simple as the following:  
  

```powershell
# The following downloads an item from the media library in the master db and dynamically detects the file extension.

$session = New-ScriptSession -Username admin -Password b -ConnectionUri http://remotesitecore
Receive-MediaItem -Session $session -Path "/sitecore/media library/Images/Icons/accuracy" -Destination C:\Images\ -Force
```

```powershell
# The following downloads all the items from the media library in the specified path.

$session = New-ScriptSession -Username admin -Password b -ConnectionUri http://remotesitecore
Invoke-RemoteScript -Session $session -ScriptBlock { 
    Get-ChildItem -Path "master:/sitecore/media library/Images/" | Select-Object -Expand ItemPath 
} | Receive-MediaItem -Session $session -Destination C:\Temp\Images\
```

[View on GitHub Gist](https://gist.github.com/michaellwest/6c150c1344e86533e61f)

If you would like to upload images from the filesystem to the media library you can do something like this:  

```powershell
# The following uploads a single image with a new name to the specified path in the media library in the master db.
    
$session = New-ScriptSession -Username admin -Password b -ConnectionUri http://remotesitecore
Send-MediaItem -Session $session -Path C:\Images\banner.jpg -Destination "/sitecore/media library/Images/banner.jpg"
```

```powershell
# The following uploads all of the images in a directory to the specified path in the media library in the master db.
            
$session = New-ScriptSession -Username admin -Password b -ConnectionUri http://remotesitecore
Get-ChildItem -Path C:\Images | Send-MediaItem -Session $session -Destination "/sitecore/media library/Images/"
```

[View on GitHub Gist](https://gist.github.com/michaellwest/7ab517810a50f2881985)
