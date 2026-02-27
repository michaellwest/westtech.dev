---
title: "PowerShell : Downloading with BITS"
created: "2012-06-02"
description: "PowerShell : Downloading with BITS (Background Intelligent Transfer Service) The background: Recently I have been learning PowerShell."
tags: ["bits", "powershell"]
source: "https://michaellwest.blogspot.com/2012/06/powershell-downloading-with-bits.html"
migrated: true
---

## **PowerShell : Downloading with BITS****(Background Intelligent Transfer Service)**

  
The background:  
Recently I have been learning PowerShell. I thought to myself "Doesn't it make sense for a Software Engineer to research technologies that would make my job easier, better, more efficient?" My goal is to learn PowerShell and teach others at work how to use it, there by making all of our jobs better.  
  
The meat:  
PowerShell has a module called BitsTransfer. Here are a few steps to get you started.

![](/images/posts/powershell-downloading-with-bits/Screenshot+-+6_1_2012+,+6_32_52+PM.png)

  
I'm sure many of you have heard of BITS. Microsoft uses it to download their updates. It automatically throttles down based on your internet traffic. Using PowerShell to manage BITS is great because you can transfer files not only from a Url but even a file system.  
  
Here is what I tried today.  
  

![](/images/posts/powershell-downloading-with-bits/Screenshot+-+6_1_2012+,+7_21_16+PM.png)

  
Two simple steps.  
  

1.  Begin a transfer with Start-BitsTransfer. This cmdlet returns a job so if you want to maintain a reference to it simply assign the results to a variable. Each job is of type "Microsoft.BackgroundIntelligentTransfer.Management.BitsJob".
2.  Complete the transfer with Complete-BitsTransfer, which accepts an array of jobs.

I chose to use the asynchronous switch because I didn't want it to hold up the console.

  

One great feature about BITS is it can be resumed after reboots.
