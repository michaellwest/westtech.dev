---
title: "SXA Fake Navigation Link"
created: "2018-02-07"
updated: "2020-09-26"
description: "If you have worked on any website navigation, you may have encountered a scenario where you need to represent a link in the menu, such as to the Home page."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2018/02/sxa-fake-navigation-link.html"
migrated: true
---

If you have worked on any website navigation, you may have encountered a scenario where you need to represent a link in the menu, such as to the **Home** page. In the following post I'll describe how I created a link to a page, without there actually being a page.  
  

![](/images/posts/sxa-fake-navigation-link/SNAG-0129.png)

As you can see in the above example, the **Home** page is represented as a sibling to the **About** and **Locations** pages.  
  

![](/images/posts/sxa-fake-navigation-link/SNAG-0130.png)

  
I created an item in the tree to represent the Home page, but without all of the overhead of a full page.  
  

### Out of the box

Let's have a look at what comes out of the box, and why I decided to do something different.  
  
While working with SXA you'll see that there is a Navigation component which allows you to specify a few properties to simplify the setup.  
  

![](/images/posts/sxa-fake-navigation-link/SNAG-0131.png)

The option to include the root page should work for you in most scenarios. When the markup is generated, you however do not see the Home page on the same level. Let me show the differences in markup.  
  
Here is an example with the root page included and the structure flattened. Notice that the real **Home** page is at _**level0**_, and my fake **Home** page is at **_level0_** but nested under a **_ul li_**.  
  

![](/images/posts/sxa-fake-navigation-link/SNAG-0132.png)

  
As you would expect, if you don't flatten the structure the level classes change but the markup is the same.  
  

![](/images/posts/sxa-fake-navigation-link/SNAG-0133.png)

  
By creating the fake **Home** item you are able to eliminate the **_level0_** and thus simplify the markup. Notice that the levels begin with **_level1_**.  
  

![](/images/posts/sxa-fake-navigation-link/SNAG-0134.png)

  
  
  
  

### Custom Template

Getting started is really pretty straightforward.  
  

1.  Create a new template called "Navigation Link".
2.  Add a few properties to the item.
3.  Inherit from "\_Navigable".
4.  Add template to the Insert Options for other pages.
5.  Don't forget to set the source field on custom templates:

1.  Image field -> query:$siteMedia
2.  General Link field -> query:$home
3.  Rich Text -> /sitecore/system/Settings/Html Editor Profiles/Rich Text XA

![](/images/posts/sxa-fake-navigation-link/SNAG-0135.png)

  

When using the names I depict in the screenshot, the default rendering variants will work automatically. If you create a custom rendering variant for the Navigation component, be sure to put the proper field name in the link target field like the following:

  

![](/images/posts/sxa-fake-navigation-link/image.png)

  
  

  

Have fun with this!

  

\- Michael
