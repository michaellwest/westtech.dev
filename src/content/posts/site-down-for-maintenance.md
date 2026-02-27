---
title: "Site Down for Maintenance"
created: "2014-01-21"
description: "Here is something that I've been trying to setup as part of our deployment process."
tags: []
source: "https://michaellwest.blogspot.com/2014/01/site-down-for-maintenance.html"
migrated: true
---

Here is something that I've been trying to setup as part of our deployment process. The goal is to provide users with a site maintenance page during the deployment. We do not require 100% up-time so this solution should meet our needs. I found additional details [here](http://blog.kurtschindler.net/more-app_offline-htm-woes/) which work pretty nice.  
  

### Steps:

1.  Copy App\_Offline.htm.disabled to the website directory and move to App\_Offline.htm
2.  Copy the application’s Web.config to Web.config.backup and move Web.config.disabled to Web.config, replacing the original
3.  Test that the offline page is rendered
4.  Deploy file system changes
5.  Move Web.config.backup to Web.config, replacing the temporary file
6.  Delete App\_Offline.htm

  

```disabled
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Down for Maintenance</title>
</head>
<body>
    <div>&nbsp;</div>
    <div id="wrapper">
        <div id="page">
            <div id="content">
                <div class="box">
                    <h2>This website is down for maintenance</h2>
                    <p>
                        We&#39;re currently undergoing scheduled maintenance. We will come back very shortly. Please check back in fifteen minutes. Thank you for your patience.
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>

```

```disabled
<?xml version="1.0" encoding="utf-8" ?>
<configuration>
    <system.web>
        <httpRuntime waitChangeNotification="300" maxWaitChangeNotification="300"/>
    </system.web>
    <system.webServer>
        <modules runAllManagedModulesForAllRequests="true" />
    </system.webServer>
</configuration>
```

[View on GitHub Gist](https://gist.github.com/michaellwest/8543863)
