---
title: "Unicorn Serialization for SXA Projects Part 2"
created: "2020-08-14"
description: "In a previous article I shared how I configure Sitecore projects with Unicorn when developing sites for SXA."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2020/08/unicorn-serialization-for-sxa-projects.html"
migrated: true
---

[In a previous article](https://michaellwest.blogspot.com/2017/04/unicorn-serialization-for-sxa-projects.html) I shared how I configure Sitecore projects with Unicorn when developing sites for SXA. In this article I share some improvements that can be made to simplify the number of configuration files you have to manage.

At this point you may have heard that Sitecore 9+ includes a capability for altering configuration files using custom defined application settings. [Kamruz Jaman](https://twitter.com/jammykam) has written [a detailed article](https://jammykam.wordpress.com/2017/10/17/rules-based-configuration/) covering many aspects of the features.

Let's have a look at what can be added to your configurations to control them per environment.

Begin by starting with a structure similar to this:

  

  

The part that is new and most interesting is the namespace added called **environment**. For this to function we need the "Web.config" to define it.

  

This is going to tell Sitecore that we have a namespace we intend to use in our configuration patches and for this transformed Web.config the value is "Dev". I like to use "Dev", "Int", "Tst", "Prd" for the environment names.

  

Let's take a look at a more complete configuration for use with Unicorn.

  

You'll notice that the include statements have duplicates such as "Forms" and "Content". This is possible because the environment values will limit only one to appear at any given time.

  

I certainly hope you found this to be helpful. Happy 2020!
