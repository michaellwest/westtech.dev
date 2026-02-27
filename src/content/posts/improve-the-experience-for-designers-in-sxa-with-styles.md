---
title: "Improve the Experience for Designers in SXA with Styles"
created: "2017-11-18"
description: "Recently I saw a nice article by Barend Emmerzaal proposing a way to improve the Experience Editor when using SXA ."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2017/11/improve-experience-for-designers-in-sxa.html"
migrated: true
---

Recently I saw a nice article by Barend Emmerzaal proposing a way to [improve the Experience Editor when using SXA](https://www.linkedin.com/pulse/download-improve-sitecore-sxa-editor-experience-barend-emmerzaal/). The article reminded me of an improvement the team and I made when rolling out a website on SXA. The problem I wanted to solve revolved around the search components and their default behavior.  
  

#### Overview

Here's a brief overview of a few scenarios I may be able to address for you in this article:  
  

-   The **Search Results** component displays results automatically. _How do you hide the results when a user has not yet performed an explicit search, such as with an address using the **Location Finder** component (**Location Aware**) or free text with **Search Box** component (**Query Aware**)?_
-   The **Rich Text** component can be used to display a message to the user until an explicit search is performed. _How do you hide the message after a search is performed?_
-   The component is hidden when the page loads for the user, but the Designer needs to see it in the Experience Editor. _How do you signal to the user which components are **Search \[Query|Location\] Aware**?_

The approach I've taken requires a few steps:

  

1.  Add SXA-supported styles to components that should be hidden/shown when certain conditions are met.
2.  Add JavaScript to toggle visibility for components that should be shown/hidden after specific conditions are met.

**Note:** Screenshots are taken from an instance of Sitecore running [XA.Reference](https://github.com/alan-null/XA.Reference).

  

#### Final Result

Let's have a look at the final results in the Experience Editor. If you are still interested afterwards, keep on reading.  
  

![](/images/posts/improve-the-experience-for-designers-in-sxa-with-styles/SNAG-0320.png)

Example with hidden Search Results

  

  

The **Search Results** component is currently hidden in the left column. Here's how that looks in the Experience Editor. The component is part of a Partial Design, which explains why no other component is seen.

  

![](/images/posts/improve-the-experience-for-designers-in-sxa-with-styles/SNAG-0319.png)

Style "Show If Query" indicated on Search Result component

![](/images/posts/improve-the-experience-for-designers-in-sxa-with-styles/SNAG-0323.png)

Search Box visible on Page

  
  
The "Show If Query" indicates that a style is applied to show the **Search Result** component when a user-provided query exists.

  

#### Getting Started

Begin by adding the stylesheet and script linked below into your theme. To keep things simple I've added the items in the Basic(2) theme; you could however separate between Editing Theme and Basic(2).

  
Next I've added two styles to the component, the first to make it query-aware, and the second to show when a query has been entered.

  

![](/images/posts/improve-the-experience-for-designers-in-sxa-with-styles/SNAG-0321.png)

Styles added using SXA selector

  
You can make these new styles available by navigating to the **_Presentation->Styles_** section under your sit and using the appropriate insert options.

  

![](/images/posts/improve-the-experience-for-designers-in-sxa-with-styles/SNAG-0322.png)

Style value matches Stylesheet

  
So how does this all work together? Let me explain:  
  

1.  The style "search-query-aware" tells the JavaScript that it should monitor components with the class whenever the query hash changes.
2.  The style "search-query-show" tells the JavaScript that the component should be hidden on page load but made visible when the query hash is not empty.
3.  The style "search-query-true" is added and "search-query-false" is removed when the query hash is not empty. Reverse this when "search-query-hide" is used.

Now let's have a look at this in action.

  

![](/images/posts/improve-the-experience-for-designers-in-sxa-with-styles/2017-11-17_21-41-15.gif)

  

  

All the sample code can be found here:

  

```css
.search-results.no-query:not(.show-empty-query)>*,.search-results-count.no-query:not(.show-empty-query)>*,.page-selector.no-query:not(.show-empty-query)>* {
    height: 0;
    overflow: hidden;
}

.search-query-show,.search-query-hide {
    display: none!important;
}

.search-query-true.search-query-show,.search-query-true .search-query-show {
    display: block!important;
}

.search-query-false.search-query-hide,.search-query-false .search-query-hide {
    display: block!important;
}

.search-location-show,.search-location-hide {
    display: none!important;
}

.search-location-true.search-location-show,.search-location-true .search-location-show {
    display: block!important;
}

.search-location-false.search-location-hide,.search-location-false .search-location-hide {
    display: block!important;
}

.search-other-show,.search-other-hide {
    display: none!important;
}

.search-other-true.search-other-show,.search-other-true .search-other-show {
    display: block!important;
}

.search-other-false.search-other-hide,.search-other-false .search-other-hide {
    display: block!important;
}

body.on-page-editor .row {
    outline: 2px solid rgba(128,166,206,0.4);
}

body.on-page-editor .columns {
    outline: 2px solid rgba(28,58,108,0.25);
}

body.on-page-editor .component {
    outline: 2px solid rgba(247,124,33,0.4);
}

body.on-page-editor .component.row-splitter {
    outline: none;
}

body.on-page-editor .component.video {
    min-width: 320px;
    min-height: 240px;
    width: 100%;
}

body.on-page-editor .zg-height-fix {
    height: auto!important;
}

body.on-page-editor .scEmptyPlaceholder {
    position: relative!important;
}

body.preview .sc-breadcrumb-item-path {
    height: auto!important;
    border: 1px solid transparent;
}

body.preview .sc-breadcrumb-item-rectangle img {
    height: 16px!important;
}

body.on-page-editor .container:before,body.on-page-editor .search-query-aware:before,body.on-page-editor .search-location-aware:before,body.on-page-editor .search-other-aware:before,body.on-page-editor .search-query-show:before,body.on-page-editor .search-query-hide:before,body.on-page-editor .search-location-show:before,body.on-page-editor .search-location-hide:before,body.on-page-editor .search-other-show:before,body.on-page-editor .search-other-hide:before,body.on-page-editor .component-hidden:before {
    pointer-events: none;
    display: block;
    font-size: 1rem;
    line-height: 1;
    font-weight: 700;
    padding: .25rem;
    color: #b02925;
    background: #f77c21;
    text-align: center;
    opacity: .5;
}

body.on-page-editor .container:before {
    content: "Container Drop Content Below";
    font-size: 1.5rem;
}

body.on-page-editor .search-query-aware {
    display: block!important;
}

body.on-page-editor .search-query-aware:before {
    content: "Search Query Aware";
    font-size: 1.5rem;
}

body.on-page-editor .search-location-aware {
    display: block!important;
}

body.on-page-editor .search-location-aware:before {
    content: "Search Location Aware";
    font-size: 1.5rem;
}

body.on-page-editor .search-other-aware {
    display: block!important;
}

body.on-page-editor .search-other-aware:before {
    content: "Search Other Aware";
    font-size: 1.5rem;
}

body.on-page-editor .search-query-show {
    display: block!important;
}

body.on-page-editor .search-query-show:before {
    content: "Show if Query";
    font-size: 1.5rem;
}

body.on-page-editor .search-query-hide {
    display: block!important;
}

body.on-page-editor .search-query-hide:before {
    content: "Hide if Query";
    font-size: 1.5rem;
}

body.on-page-editor .search-location-show {
    display: block!important;
}

body.on-page-editor .search-location-show:before {
    content: "Show if Location";
    font-size: 1.5rem;
}

body.on-page-editor .search-location-hide {
    display: block!important;
}

body.on-page-editor .search-location-hide:before {
    content: "Hide if Location";
    font-size: 1.5rem;
}

body.on-page-editor .search-other-show {
    display: block!important;
}

body.on-page-editor .search-other-show:before {
    content: "Show if Search Other";
    font-size: 1.5rem;
}

body.on-page-editor .search-other-hide {
    display: block!important;
}

body.on-page-editor .search-other-hide:before {
    content: "Hide if Search Other";
    font-size: 1.5rem;
}

body.on-page-editor .component-hidden {
    display: block!important;
}

body.on-page-editor .component-hidden:before {
    content: "Hidden from Display";
    font-size: 1.5rem;
}
```

```javascript
XA.component.search.queryAware = (function($, document) {
    'use strict';
    function hashChanged(hash) {
        var hasQuery = false;
        var hasLocation = false;
        var hasOther = false;
        Object.keys(hash).forEach(function(key, index) {
            if (key == 'q' || key.indexOf('_q') == key.length - 2) {
                if (hash[key] && hash[key] != '') {
                    hasQuery = true;
                }
            }
            if (key == 'g' || key.indexOf('_g') == key.length - 2) {
                if (hash[key] && hash[key] != '') {
                    hasLocation = true;
                }
            }
            if (key != 'g' && key != 'q' && key != 'o' && key.indexOf('_g') == -1 && key.indexOf('_q') == -1 && key.indexOf('_o') == -1) {
                if (hash[key] && hash[key] != '') {
                    hasOther = true;
                }
            }
            if (hasLocation && hasQuery && hasOther) {
                return;
            }
        });
        $('.search-query-aware').addClass('search-query-' + hasQuery);
        $('.search-query-aware').removeClass('search-query-' + !hasQuery);
        $('.search-location-aware').addClass('search-location-' + hasLocation);
        $('.search-location-aware').removeClass('search-location-' + !hasLocation);
        $('.search-other-aware').addClass('search-other-' + hasOther);
        $('.search-other-aware').removeClass('search-other-' + !hasOther);
    }
    function init() {
        XA.component.search.vent.on('hashChanged', hashChanged);
        var hashObj = XA.component.search.query.parseHashParameters(window.location.hash);
        hashChanged(hashObj);
    }
    ;var api = {};
    api.init = function() {
        init();
    }
    ;
    return api;
}(jQuery, document));
XA.register("company-search-queryAware", XA.component.search.queryAware);

```

[View on GitHub Gist](https://gist.github.com/michaellwest/24532142d3564c289aefd834cb3916db)
