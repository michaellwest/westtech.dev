---
title: "Secure Docker Websites for Sitecore"
created: "2020-01-03"
updated: "2020-01-06"
description: "In this article Michael shares how to configure Sitecore running on Docker locally with HTTPS."
tags: ["sitecore", "docker"]
source: "https://michaellwest.blogspot.com/2020/01/secure-docker-websites-for-sitecore.html"
migrated: true
---

In this article Michael shares how to configure Sitecore running on Docker locally with HTTPS. A sample repository is provided to help you get started.  
  
If you don't care to read this article and just want the source code then [check out this link right here](https://github.com/michaellwest/docker-https). There you can see how to get thing setup.  
  

[![](https://i.pinimg.com/originals/f5/5e/80/f55e8059ea945abfd6804b887dd4a0af.gif)](https://i.pinimg.com/originals/f5/5e/80/f55e8059ea945abfd6804b887dd4a0af.gif)

  

#### The Background

  
There comes a time when every developer is going to need Sitecore running over HTTPS. If you have been following the progress the Sitecore Demo Team is making with Docker you'll see that getting started is going to be far less complex for everyone. If you have not yet already seen the [GitHub repository](https://github.com/Sitecore/docker-images) feel free to do that once you've finished reading this post.  
  
There are a few articles written recent to this post around getting started with Docker running Sitecore. **You may find that some eventually are outdated because the Sitecore Demo Team is moving at such a fast pace the instructions in the articles go stale.** Nevertheless the articles provide valuable insight into what you need to do for things to run smoothly. I trust that you will take the time to (if not already) to familiarize yourself with Docker. For those that have worked with Sitecore for any amount of time, surely you will appreciate the simplicity Docker brings.  
  
**Note:** At the time of this article SIF is no longer used for the Sitecore Docker images. I'm very thankful for this because it makes setup much easier to follow on how things work.  
  
**Recommended articles:**  
  

-   [Sitecore Docker for Dummies](https://intothecloud.blog/2019/09/14/Sitecore-Docker-for-Dummies/) - This 3-part series is actually the nudge I needed to get started. Mark Cassidy does such a fantastic job covering the basics. No time is wasted on unnecessary tasks, like setting up a Docker Hub account. If you install Docker through Chocolatey no account is needed.
-   [Yet Another Sitecore Docker Series](http://rockpapersitecore.com/2019/10/yet-another-sitecore-docker-series/) - This 9-part series goes into a bit more detail about how the build of images and running containers come together. Rob Ahnemann is very clear about how things work and at times provide a bit of comic relief.
-   [Maintain Your Hosts File with a Docker Container](http://rockpapersitecore.com/2020/01/maintain-your-hosts-file-with-a-docker-container/) - This helps make the management of hosts entries painless. Thanks Rob! Thank you Hosts Writer!
-   [Sitecore Docker and HTTPS with Traefik](https://github.com/pbering/sitecore-docker-https-example) - At the writing of this I've not tested this approach but if [Per Manniche Bering](https://twitter.com/pbering) says try it then I recommend you do.

![](/images/posts/secure-docker-websites-for-sitecore/3l27f2.jpg)

  

  

For those wondering about Sitecore supporting Docker, there is a [question and answer on Sitecore Stack Exchange](https://sitecore.stackexchange.com/questions/22187/does-sitecore-have-support-for-sitecore-products-in-containers) which provides more detail.

  

#### The Setup

  

The following steps should help you get things rolling and troubleshoot:

1.  Clone the following repository : [https://github.com/michaellwest/docker-https.git](https://github.com/michaellwest/docker-https.git)
2.  Open the file docker-compose.yml to have a look at what is going on. This compose file assumes you have images built and available on your machine for Sitecore 9.3 XM.
3.  Open the file .env to ensure they match what is used for your built images. You can try to copy the .env file from the Sitecore repository if things don't work right. An example path would be [https://github.com/Sitecore/docker-images/blob/master/windows/tests/9.3.x/.env](https://github.com/Sitecore/docker-images/blob/master/windows/tests/9.3.x/.env).
4.  Open the folder Startup and with an elevated PowerShell console run the createcert.ps1. By default the script creates a Self-Signed Certificate using the DNS "\*.dev.local" then installs locally. Files will be generated in the same directory to be used by the running container (pfx and txt files should now exist).
5.  The file startup.ps1 will be used by the running container to install the certificate and configure the HTTPS bindings.
6.  Run docker-compose up.
7.  Navigate to https://docker-https.dev.local/sitecore.

If everything is setup properly you'll end up with a console full of log messages and finally the login screen to Sitecore.  
  

#### The Magic

  

I made this video to help walk you through the different parts with a tad bit of colorful commentary.  
  

  
  

**\- I hope you have a wonderful 2020!**
