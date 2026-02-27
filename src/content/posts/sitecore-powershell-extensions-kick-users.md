---
title: "Sitecore PowerShell Extensions Kick Users"
created: "2013-09-03"
updated: "2014-06-16"
description: "Here's a quick way to kick users :) # Use the static class to get the list of sessions then for each session kick the user using the session id."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2013/09/SPE-KickUsers.html"
migrated: true
---

Here's a quick way to kick users :)

```ps

# Use the static class to get the list of sessions then for each session kick the user using the session id.
[Sitecore.Web.Authentication.DomainAccessGuard]::Sessions | 
    % { [Sitecore.Web.Authentication.DomainAccessGuard]::Kick($_.SessionId) }

```
