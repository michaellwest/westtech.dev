---
title: "Windows Hosts Writer 2.0"
created: "2022-05-05"
description: "Today I'm pleased to announce the release of Windows Hosts Writer 2.0 !"
tags: ["docker"]
source: "https://michaellwest.blogspot.com/2022/05/windows-hosts-writer-20.html"
migrated: true
---

Today I'm pleased to announce the release of [Windows Hosts Writer 2.0](https://github.com/RAhnemann/windows-hosts-writer)! In this article we'll learn about what is new and how to get started. Also, a reminder about the pain of managing the hosts file.

![](/images/posts/windows-hosts-writer-20/SNAG-0839.png "Solve it with the hosts file")

  

  

There are many steps needed to get a website running locally. For traditional sites hosted with IIS you have to add application pools, websites, perhaps configure services accounts...the list goes on. One of the tasks that feel the most tedious is adding entries to the hosts file. If you are not familiar, this is an extension-less file found at **C:\\Windows\\System32\\drivers\\etc\\hosts** and contains IP-to-Hostname mappings. Each row will have an IP address such as **127.0.0.1** followed by the hostname such as **scms.dev.local**.

If you open the hosts file you may already see something like the following:

![](/images/posts/windows-hosts-writer-20/hosts-example.png "Hosts file example")

  

As you can see from the above image, there is not much going on. This file comes in handy when you want a fancy url to loop back to the local machine. So now you must be wondering how does **Windows Hosts Writer** (WHW) relate to this? When paired with **Docker** it can save a tremendous amount of time in managing the everchanging IP addresses.

A while back Rob [introduced](http://rockpapersitecore.com/2020/01/maintain-your-hosts-file-with-a-docker-container/) the Sitecore community to a neat tool distributed through its own **Docker** container. Check out his series of [articles](http://rockpapersitecore.com/category/docker/) detailing the improvements made over time.

Finally, what is so important about this new 2.0 version of **WHW**? I'm glad you asked before bailing out on this lame blog post. Below is a breakdown of all the goodies.

-   Support for .net 3.1 ends December 3, 2022 while 6.0 is the latest version released with LTS. We went ahead and upgraded before we forget.
-   Fixed an issue with the TERMINATION\_MAP feature. 🥇
-   Aliases that are space-delimited are treated like all the other host entries.
-   Consolidated the Dockerfile which enables contributors to debug locally with Visual Studio, build from docker-compose.yml, and ensure @RAhnemann can still do releases. 👍🏼
-   Encriched the readme with helpful details on getting started. Run docker compose up -d from the root directory to try it out.
-   Updated the referenced Docker.Dotnet assembly to address the dreaded exception Docker.DotNet.DockerApiException: Docker API responded with status code=BadRequest, response=400 Bad Request. This might have been revealed after upgrading Docker to 4.7.1.

If you want to get started, check out the [readme on GitHub](https://github.com/RAhnemann/windows-hosts-writer). The Docker images have been pushed to DockerHub [here](https://hub.docker.com/r/rahnemann/windows-hosts-writer).
