---
title: "Sitecore Code Editor 1.6 Preview"
created: "2015-01-21"
description: "Developing on the Sitecore platform has been some of the most enjoyable time in my career."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2015/01/sitecore-code-editor-16-preview.html"
migrated: true
---

Developing on the [Sitecore](http://www.sitecore.net/) platform has been some of the most enjoyable time in my career. For me, the excitement of discovering new aspects of the platform and building features for a module that I'm going to just give away is well worth the late night investment. I hope those of you that use the module find it helpful. Enjoy!  
  
Today I would like to outline the changes included in v1.6 of the [Sitecore Code Editor Module](http://goo.gl/tj8F5O). Those of you that have never seen or heard of this module, it provides an improved text editing experience using the [Ace Code Editor plugin](http://ace.c9.io/). I'll outline some of the enhancements or fixes then go through each in greater detail.  
  
Changes:  
  

-   Added persistent user settings for the editor.
-   Added configurable height and width for the editor window.
-   Added scrolling to the content editor window.
-   Updated with new mimetypes.
-   Fixed issue with media blobs not appearing in module packages.
-   Fixed code template share setting.

The nice thing about this release is it was heavily influenced by community requests. You may have noticed while using the code editor on most computer screens the modal window was just not quite large enough. Now the module supports storing the modal window width, height. In addition, settings that effect the text include font size, font type, and theme.

  

![](/images/posts/sitecore-code-editor-16-preview/SNAG-0134.png)

  

  

The content window in the Content Editor now supports scrolling for large sets of text.

  

![](/images/posts/sitecore-code-editor-16-preview/SNAG-0131.png)

  

  
Mime types have been added for files with content for LESS, SCSS, Windows PowerShell, and others. These can be found in _**Sitecore.SharedSource.CodeEditor.config**_.

  

![](/images/posts/sitecore-code-editor-16-preview/SNAG-0132.png)

  

  

The Code Attachment field type was removed to correct an issue where media item blobs were not properly included in the packages. I figured out that I can add command buttons in the content editor in code rather than defining in the core database as a new field type. Thanks to John West for posting that article a few years ago :)  
  
I've reverted back to the original Attachment system type but changed the control.

  

![](/images/posts/sitecore-code-editor-16-preview/SNAG-0133.png)

  
Some cleanup is required, more specificly the Code Attachment field type.  
  
That's pretty much it. Happy coding!  
  
References:  

-   http://www.sitecore.net/Learn/Blogs/Technical-Blogs/John-West-Sitecore-Blog/Posts/2013/05/Add-Commands-to-Edit-Templates-and-Fields-in-the-Sitecore-ASPNET-CMS.aspx

// Mikey
