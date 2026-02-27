---
title: "Sitecore PowerShell Run Task On Demand"
created: "2014-10-09"
description: "Recently I needed to help a colleague run a scheduled task on-demand."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2014/10/sitecore-powershell-run-task-on-demand.html"
migrated: true
---

Recently I needed to help a colleague run a scheduled task on-demand. Immediately I thought to myself, [Sitecore PowerShell Extensions](http://goo.gl/G2ULkI) can do it! I was certain other developers had created a solution, but I needed something quick.  

  

[**Adam Najmanowicz** ‏@adamnaj](https://twitter.com/adamnaj) helped by providing one out-of-the-box way to accomplish the task. The short answer is to use the Task Manager. Have a look under Sitecore -> PowerShell Toolbox -> Task Manager

  

![](/images/posts/sitecore-powershell-run-task-on-demand/SNAG-0103.png)

  

You are then presented with a delightful screen which provides you with options like _Execute Now_ and _Edit Schedule_.

![](/images/posts/sitecore-powershell-run-task-on-demand/SNAG-0104.png)

  

  

[**Michael West** ‏@michaelwest101](https://twitter.com/michaelwest101) also had a good suggestion. Oh wait, that was me :)

  

This solution creates a context menu item that can be made visible when selecting an item with the Schedule template.

  

![](/images/posts/sitecore-powershell-run-task-on-demand/SNAG-0105.png)

  

What we'll do here is create a new PowerShell Script item called _Run Task_, set a rule on it to only appear for the Schedule template, and write some simple code to run the task:

  

$item = Get-Item -Path .
if($item) {
  $schedule = Get-TaskSchedule -Item $item
  Start-TaskSchedule -Schedule $schedule
}

  

![](/images/posts/sitecore-powershell-run-task-on-demand/SNAG-0106.png)

  

  

![](/images/posts/sitecore-powershell-run-task-on-demand/SNAG-0107.png)

  

  

You can also confirm that the scheduled task completed successfully by checking the Log Viewer.

  

[**John West** ‏@sitecorejohn](https://twitter.com/sitecorejohn) (coincidentally with the same last name) did provide a detailed [article](https://t.co/HVKhb60yDd) on an approach that does not the module.

[**Paul Martin** ‏@sitecorepm](https://twitter.com/sitecorepm) also provided details to a [module](http://t.co/IYjH8HpYQ9) that provides an alternative experience to the schedule editor.

  

I hope this helps someone.

  

// Michael
