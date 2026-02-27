---
title: "Custom Rendering Variant Token Tool for SXA"
created: "2017-04-22"
description: "Sitecore Experience Accelerator ( SXA ) provides a great way to alter how components render using a feature called Rendering Variant ."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2017/04/custom-rendering-variant-token-tool-for-sxa.html"
migrated: true
---

Sitecore Experience Accelerator ([SXA](https://doc.sitecore.net/sitecore_experience_accelerator)) provides a great way to alter how components render using a feature called **_Rendering Variant_**. The following post describes how I developed a new **_Rendering Variant_** tool that implements **_NVelocity_** templates. I found a way to extend a feature built into the great SXA.  
  
For those that have not yet worked with **_NVelocity_**, it's essentially a mechanism for converting tokens into other text. This is often used in Sitecore standard values where you use _$name_ to populate the title field.  
  
**UPDATE:** SXA comes with some tools that you can take advantage of right now called **_$dateTool_** and **_$numberTool_**. Read more about them [here](https://doc.sitecore.net/sitecore_experience_accelerator/setting_up_and_configuring/configuring/the_sxa_pipelines) and [here](https://doc.sitecore.net/sitecore_experience_accelerator/10/building_the_layout/renderings/create_a_rendering_variant).  
  

#### Problem Statement

Marketing would like to have the page Url output in the website global search results.  
  
  

![](/images/posts/custom-rendering-variant-token-tool-for-sxa/SNAG-0178.png)

As you can see above, the rendering shows a title, description, and url. Unfortunately I was not able to figure out how to do this OOTB with SXA. Fortunately it took very little effort to write code for this.  

#### Setup

There are a few steps you need to take in order for this to work.

1.  Have a need for it. Duh.
2.  Setup a Visual Studio project, something like _Company.Foundation.Variants_.
3.  Reference the SXA library **_Sitecore.XA.Foundation.Variants.Abstractions.dll, Sitecore.Kernel.dll, and Sitecore.NVelocity.dll_**.
4.  Add a new class to define the tool, such as **Company.Foundation.Variants.NVelocityExtensions.LinkTool**.
5.  Add a new class to register the tool, such as **Company.Foundation.Variants.Pipelines.GetVelocityTemplateRenderers.AddTemplateRenderers**.
6.  Patch the new pipeline in to **_getVelocityTemplateRenderers_**.

Here's a little snippet to get you started.

```csharp
using Company.Foundation.Variants.NVelocityExtensions;
using Sitecore.XA.Foundation.Variants.Abstractions.Pipelines.GetVelocityTemplateRenderers;

namespace Company.Foundation.Variants.Pipelines.GetVelocityTemplateRenderers
{
    public class AddTemplateRenderers : IGetTemplateRenderersPipelineProcessor
    {
        public void Process(GetTemplateRenderersPipelineArgs args)
        {
            args.Context.Put("linkTool", new LinkTool());
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
        <processor type="Company.Foundation.Variants.Pipelines.GetVelocityTemplateRenderers.AddTemplateRenderers, Company.Foundation.Variants" patch:after="processor[@type='Sitecore.XA.Foundation.Variants.Abstractions.Pipelines.GetVelocityTemplateRenderers.InitializeVelocityContext, Sitecore.XA.Foundation.Variants.Abstractions'] />
      </getVelocityTemplateRenderers>
    </pipelines>
  </sitecore>
</configuration>
```

```csharp
using Sitecore.Data.Items;
using Sitecore.Links;

namespace Company.Foundation.Variants.NVelocityExtensions
{
    public class LinkTool
    {
        public static string GetItemLink(Item item, bool includeServerUrl = false)
        {
            var options = UrlOptions.DefaultOptions.Clone() as UrlOptions;

            if (includeServerUrl)
            {
                options.AlwaysIncludeServerUrl = true;
            }

            return LinkManager.GetItemUrl(item, options);
        }
    }
}
```

[View on GitHub Gist](https://gist.github.com/michaellwest/029fd3e7353ab5b88b0605fbf31c2fbf)

  

#### Usage

In the _Rendering Variant_ configured for search results, add a _VariantTemplate_ item. The template field should then contain something like the following:

  

<a href="$linkTool.GetItemLink($item)">$linkTool.GetItemLink($item,true)</a>

  

Here is the html set within the **_VariantTemplate_**.  

  

![](/images/posts/custom-rendering-variant-token-tool-for-sxa/SNAG-0179.png)

  

That's pretty much all there is to setting it up. Hope you find this feature as helpful as I did!
