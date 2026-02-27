---
title: "Donut Caching with Custom SXA Components"
created: "2019-05-16"
description: "In this article Michael shares how to make your custom components, built for SXA, support the donut caching feature."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2019/05/donut-caching-with-custom-sxa-components.html"
migrated: true
---

In this article Michael shares how to make your custom components, built for SXA, support the donut caching feature.  
  
Today we discovered that one of the forms on our site would simply refresh as you hit the submit button. Further investigation revealed that this component was added to the Sitecore cache. Whenever we cleared the cache the component worked as expected, once. Oh no!  
  
The fantastical SXA module supports donut caching which is made visible through a checkbox on the rendering parameters.  
  

![](/images/posts/donut-caching-with-custom-sxa-components/SNAG-0404.png)

Donut caching setting on the Page List component

This setting is added on the rendering parameters template. Not sure which rendering parameter template is used? You can check it out on the component defined under Layouts.  
  

![](/images/posts/donut-caching-with-custom-sxa-components/SNAG-0405.png)

  
  
If you navigate to that item you'll see under the template inheritance a base template for caching.  
  

![](/images/posts/donut-caching-with-custom-sxa-components/SNAG-0406.png)

  
If you wish to add support for this capability just add the template to your custom rendering parameters template.  
  

![](/images/posts/donut-caching-with-custom-sxa-components/SNAG-0407.png)

  
At the time of this article, the template ID is {6DA8A00F-473E-487D-BEFE-6834350D5B67} and can be easily added in the **Raw values** mode of the Content Editor.  
  
**Note:** When cloning components you will probably use the rendering parameters template included with the original component, in which case you don't even have to do anything special.  
  
If you enjoy using SXA and what to share your appreciation to the team or have questions be sure to check out the #sxa channel on [Sitecore Chat](https://sitecore.chat/).
