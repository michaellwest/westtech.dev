---
title: "Unicorn Serialization for SXA Projects"
created: "2017-04-16"
updated: "2020-05-11"
description: "Sitecore Experience Accelerator ( SXA ) is organized in a way that aligns with Sitecore's Helix design principles and conventions."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2017/04/unicorn-serialization-for-sxa-projects.html"
migrated: true
---

Sitecore Experience Accelerator ([SXA](https://doc.sitecore.net/sitecore_experience_accelerator)) is organized in a way that aligns with Sitecore's [Helix](http://helix.sitecore.net/) design principles and conventions. The following post describes how I structured a solution with Unicorn serialization to allow for low complexity management. You will also notice that in the CM the Marketers do not change Partial Designs/Page Designs/Rendering Variants.  
  
I'll try to explain as much as I can using pictures; everyone likes pictures.  
  
Update 20180717 : Made some minor updates to the post to clarify some questions from the community. Also updated the gists to follow more recent changes made with Unicorn 4.0.3 such as extending configs.  
  
Update 20180829 : Added details on excluding fields during the sync process; important if you want to have unique values per environment for the same item (see 01-Company.Serialization.All.config**)**. Also provided more detail around the **Site Grouping**.

  

Update 20200511 : Added more .gitignore entries to better exclude (include) items that belong in source control.  
  

### Organizational Structure

The following names will be used to organize code and serialized content.

-   Feature
-   Foundation
-   Project
-   Website - The is not formally Helix. I added it because it makes sense when organizing the code and configurations.

![](/images/posts/unicorn-serialization-for-sxa-projects/SNAG-0169.png)

  
  

Starting from the bottom I have a project using the naming convention **\[COMPANY\].Website**. This project contains code and configurations needed to bootstrap a website that would keep it in an operational state. Changes to **Sitecore.config** would appear as patch-configs in this project. This project can also include Sitecore Support config/dll references.

  

Let's have a look at this node expanded.

  

![](/images/posts/unicorn-serialization-for-sxa-projects/SNAG-0170.png)

  

  
**Example:**

The configuration **Company.Serialization.config** contains all of the root items necessary for Unicorn to work in the solution. I've sanitized the config example to use the generic name **Company**. If yaml files associated with this config have not yet been synced, the checkboxes on the Unicorn page will not appear.

  

  
Now let's have a quick look at some of the places where those items are in the Sitecore tree. The company name here is Concentra.  

![](/images/posts/unicorn-serialization-for-sxa-projects/SNAG-0171.png)

  

  
The configuration file is designed to create all of those root items. When a new developer joins, he/she will want to sync the **Company.Website** configuration first so all these root nodes appear.  
  
**Example:**  
The configuration **Company.Project.DotCom.Serialization.Dev.config** contains all of the descendant items that are project specific, such as site templates. This config contains the settings necessary for _TransparentSync_.  
  
When you create a new tenant and site with the SXA wizard (powered by Sitecore PowerShell Extensions!) you will want to use the structure **Tenant Folder > Tenant > Site** (i.e. **Concentra > DotCom > usa**). I like this pattern because you future-proof the structure to support multiple companies.  
You will want to use this configuration on your developer machine. Everything is tracked and transparently synced.  

![](/images/posts/unicorn-serialization-for-sxa-projects/SNAG-0172.png)

  
**Example:**  
The configuration **Company.Project.DotCom.Serialization.Cm.config** contains the same as before, but disables _TransparentSync_ and uses exclusions. You will want to use this configuration on Content Management environments, the primary reason is because the **Home** and **Data** trees should not be overwritten; Marketers will want to punch you if you do.  
  
Git Ignore  
You may find that some of this content you do not want to keep tracking in source control. Use ignore entries like the following to keep it from showing up in a commit.  
  

/app/src/\*\*/Serialization/\*\*/Concentra.Project.Intranet/Content/Intranet/corp/Home/
/app/src/\*\*/Serialization/\*\*/Concentra.Project.Intranet/Content/\[a-z0-9\]\*-\[a-z0-9\]\*-\[a-z0-9\]\*-\[a-z0-9\]\*-\[a-z0-9\]\*/
/app/src/\*\*/Serialization/\*\*/Concentra.Project.Intranet/Media/Intranet/corp/
/app/src/\*\*/Serialization/\*\*/Concentra.Project.Intranet/Media/\[a-z0-9\]\*-\[a-z0-9\]\*-\[a-z0-9\]\*-\[a-z0-9\]\*-\[a-z0-9\]\*/
/app/src/\*\*/Serialization/\*\*/Concentra.Project.Intranet/Content/Intranet/corp/Data/\*\*/\*
!/app/src/\*\*/Serialization/\*\*/Concentra.Project.Intranet/Content/Intranet/corp/Data/\*
!/app/src/\*\*/Serialization/\*\*/Concentra.Project.Intranet/Content/Intranet/corp/Data/Search/\*
/app/src/\*\*/Serialization/\*\*/Concentra.Project.Intranet/Content/Intranet/corp/Settings/\*\*/User Defined/\*

  
**Host Headers**  
Don't forget to update the host headers under **Tenant Folder > Tenant > Site > Settings > Site Grouping > company**.  
  

![](/images/posts/unicorn-serialization-for-sxa-projects/SNAG-0298.png)

  
In earlier versions the name of the Site Grouping item was used to distinguish the different sites; this could be seen in the log file when the caching is setup. You can now define the site name in a specific field. Host names can be grouped together, delimited by the "|" pipe character. You may see warnings in the SXA Site Manager report about conflicting host names, which for now I've ignored because things still work.  
  
You'll also want to consider the impact of grouping them together, because the Flags section will have settings enabled that you may want disabled for the CD. This would include the "Allow Debug" and "Enable Debugger" flags.  
  
Here are the default flags:  
  

![](/images/posts/unicorn-serialization-for-sxa-projects/SNAG-0299.png)

  

#### Putting it all together

So let's recap what we have.

-   Visual studio projects for **Website**, **Project**, **Foundation**, and **Feature**.
-   Unicorn serialization configurations that capture root nodes for the company (**Website**) and then other configurations for the tenant and site (**Project**). **Foundation** and **Feature** work the same way but have no information about the tenant/site.
-   Unicorn serialization configurations take into account what developers want to capture and own versus what should be deployed to other environments.
-   Unicorn files and configurations are removed before each deployment to ensure renamed or unused files are removed.
-   A base unicorn configuration is used to make yaml files appear in the Source Control folder on dev and in the Data folder on higher environments.

Here's a short video to add more detail.Thanks for watching!
