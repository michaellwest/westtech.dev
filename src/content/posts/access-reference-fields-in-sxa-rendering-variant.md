---
title: "Access Reference Fields in SXA Rendering Variant"
created: "2018-02-07"
updated: "2018-09-14"
description: "In this article I demonstrate how to create an NVelocity tool to access properties from a Sitecore ReferenceField ."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2018/02/access-reference-fields-in-sxa.html"
migrated: true
---

In this article I demonstrate how to create an NVelocity tool to access properties from a Sitecore **ReferenceField**.  
  
As a followup to my post on [building a custom tool in SXA](https://michaellwest.blogspot.com/2017/04/custom-rendering-variant-token-tool-for-sxa.html), I wanted to share a new discovery which makes greater use of NVelocity.  
  
If you have used Rendering Variants in SXA you may have come across the token _**$item**_. With this token you are able to access data on the page item. Rather than have the page contain all of the data, why not make use of a **ReferenceField** such as a **droptree** and get the data from that item.  
  
**Update 20180914:** I started thinking about blogging a new article to discuss the use of Google Static Maps, but then remembered that this article shows the use of that! Once consideration to make is that the images could be lazy-loaded using some simple JavaScript if you wish to reduce hits against your API quota. In the Summer of 2018 Google started charging, so reducing this could help your company save some big bucks!  
  

### Location Page with Reference to POI

SXA provides a way to store Points of Interest (POI) and link to a page. In the following example, you can see that the **My Location POI** allows for a link to a page. I personally don't like relying on this direction of reference because I expect the page to either inherit from POI or reference a POI.

  

![](/images/posts/access-reference-fields-in-sxa-rendering-variant/SNAG-0137.png)

  

In my solution, I create a new field on the page called "POI" and link back to the POI. As you see below, the new field points back to the global data directory so the user can pick from an existing list of POIs.

  

![](/images/posts/access-reference-fields-in-sxa-rendering-variant/SNAG-0138.png)

  

I would imagine an automated process mapping the POI to a page, but that's a problem to solve for another day.

  

![](/images/posts/access-reference-fields-in-sxa-rendering-variant/SNAG-0139.png)

  

### Build the Tool

Getting back to the item tool, we need to create a new method for accessing a reference field.

  

Create a tool called **$itemFieldTool** and then use it in the rendering variant.

  

```csharp
using Westco.Foundation.Variants.NVelocityExtensions;
using Sitecore.XA.Foundation.Variants.Abstractions.Pipelines.GetVelocityTemplateRenderers;

namespace Westco.Foundation.Variants.Pipelines.GetVelocityTemplateRenderers
{
    public class AddTemplateRenderers : IGetTemplateRenderersPipelineProcessor
    {
        public void Process(GetTemplateRenderersPipelineArgs args)
        {
            args.Context.Put("itemFieldTool", new ItemFieldTool());
        }
    }
}
```

```csharp
using System;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace Westco.Foundation.Variants.NVelocityExtensions
{
    public class ItemFieldTool
    {
        public static Item GetItemReferenceItem(Item item, string fieldName)
        {
            ReferenceField field = item.Fields[fieldName];

            return field?.TargetItem;
        }
    }
}
```

```xml
<?xml version="1.0" encoding="utf-8" ?>
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <pipelines>
      <getVelocityTemplateRenderers>
        <processor type="Westco.Foundation.Variants.Pipelines.GetVelocityTemplateRenderers.AddTemplateRenderers, Westco.Foundation.Variants" />
      </getVelocityTemplateRenderers>
    </pipelines>
  </sitecore>
</configuration>
```

```html
#set($refItem = $itemFieldTool.GetItemReferenceItem($item, "POI"))
<img data-latlong="$refItem.Latitude|$refItem.Longitude" src="https://maps.googleapis.com/maps/api/staticmap?zoom=15&size=640x450&maptype=street&markers=icon:$mediaTool.GetPoiMediaItem($refItem, "Type")|$refItem.Latitude,$refItem.Longitude" />
```

[View on GitHub Gist](https://gist.github.com/michaellwest/06edab17dafa2e0a79310cf995caa9eb)

### Use the Tool

In my use case, I needed to show a Google Static map on the page. Here is the rendering variant I setup.  
  

![](/images/posts/access-reference-fields-in-sxa-rendering-variant/SNAG-0140.png)

  

The Map **VariantTemplate** contains the data from the gist. In the below example we have a Google Static Map getting loaded; you may want to lazy-load to reduce hits against your quota. Consider creating another tool ($mapTool) to return the MapsProvider key from SXA.  
  

![](/images/posts/access-reference-fields-in-sxa-rendering-variant/SNAG-0141.png)

  

![](/images/posts/access-reference-fields-in-sxa-rendering-variant/SNAG-0142.png)

  
The part that I found really cool was that you can create a new variable called **_$refItem_** and it would appear in the same context as **_$item_**.  
  
This is where the fun part is in the gist:  
  
**#set($refItem = $itemFieldTool.GetItemReferenceItem($item, "POI"))**  
I hope this helps you build something super awesome. If you use it please share a link in the comments so others can celebrate your success.  
  
\- Michael
