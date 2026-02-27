---
title: "Build a Location Finder search using SXA"
created: "2016-10-09"
updated: "2019-02-25"
description: "Recently I've been playing around with the new Sitecore Experience Accelerator (SXA) and wanted to share something that is possible without any coding."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2016/10/build-location-finder-search-using-sxa.html"
migrated: true
---

Recently I've been playing around with the new Sitecore Experience Accelerator (SXA) and wanted to share something that is possible without any coding.  
  
**Update 20190225:** Dawid reminded me about the use of _IPOI_ instead of _POI_ if you want pages to inherit the template for geospatial search support. I've updated the article to reference the _IPOI_ template. This makes sense because I have no plans on using the extra fields provided by _POI_.  
  
**Update 20180830:** Realized that in this example the search results are not linked to any actual page. Added details below to describe how one might do that.  
  
Here's a preview in case you don't want to read the rest of the post.  

  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0028.png)

  

Isn't the kitty cute? Moving on...

  

SXA is bundled with quite a number of search components. Let us see what is in use.

-   Location Finder - essentially a search box with label and button.
-   Search Results - just like it sounds.
-   Filter (Radius) - used to reduce the search results by geospatial comparison.
-   Map - a map using the Google Maps JavaScript API.

When you add search components to the page, they automatically interact with one another. In the event you want to have multiple searches on the same page, change the signature property on the components.

  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0029.png)

I have no need to make the search signature unique for this page so I will leave it empty.

  

Another interesting part about these components is the use of the **hash** parameters. In this example, I changed the distance filter to 500 miles and the data was automatically populated in the url.

  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0030.png)

  

In the above image, the hash query contains an entry for the **geolocation** (g), **order** (o), and **distance** (DistanceMi).

  

Let's have a look at each of the search components in greater detail.

  

### Location Finder

This control deals with accepting search criteria from the user in the form of a city, state, or zip code.

  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0032.png)

As you enter data in the field you'll see the Google Autocomplete feature activate. Selecting the city will immediately trigger the hash query to update with the new location which in turn runs a search.

  

As of version 1.1 there is no out of the box way to limit the results by country or city.

  

**Note:** Before adding this component to the page you'll need to create a few settings.

  

**Distance Facet**

I created a new _DistanceFacet_ item to specify that the filter will use the unit of _miles_. Add a new facet under _Settings -> Facets_.

  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0033.png)

  

**Location Filter**

Next I created a new _LocationFilter_ item to be used as the data source. This item makes use of the _DistanceFacet_. Go ahead and set the placeholder text, label text, and finally the button text. Add a new filter under _Data -> Search -> Location Filter_.  
  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0035.png)

  

### Search Results

This control is responsible for rendering the queried items. We will need an item to specify the search scope.

  

**Scope**

The _Scope_ item uses a Sitecore query to get the appropriate data. The query needs to return items that inherit from the _POI_ template which contains fields like _Latitude_ and _Longitude_. Add a new scope under _Settings -> Scopes_.

  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0036.png)

  

I used this query to get the job done. The default scope is the entire site so be sure to do this. Further down in this post you'll see how I created the _POI_ items returned by this query.

  

location:{BE88BF74-BBD1-4BB0-A4ED-1E34F477F985};+custom:\_templatename|poi

  
While you are there make sure that the Search Results component has a default data source for use when no results are found under _Data -> Search -> Search Results_.  
  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0037.png)

  
  
Edit the component properties to make use of the scope and default result.  
  

### Filter (Radius)

This control enhances the results by filtering our the specified radius (miles or kilometers).  
  
**Radius Filter**  
The _Radius Filter_ item specifies which distance facet to use. Add it under _Data -> Search -> Radius Filter_.  
  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0038.png)

**Radius Scheme**  
The _Radius Scheme_ item specifies which options are available for filtering.  
  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0039.png)

  
**Note:** I was not quite sure where to place the _Radius Scheme_ item because no insert option existed so I placed it under _Data -> Search -> Radius Filter_. I also didn't know the _Radius Scheme_ existed until I dug around to see what I needed to create. Looking forward to the detailed documentation for each of this features in the near future.  
  

### Map

This control renders the search results on a map with location markers. The search results need to have the _Latitude_ and _Longitude_ populated for this to work properly. Be sure to create a _Map_ item under _Data -> Maps_ before adding this control to the page.  
  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0040.png)

  
**POI Type**  
The POI Type item provides a way to customize the marker icon. For this demo I created a new _POI_ type under _Presentation -> POI Types_, which allowed me to specify the awesome SPE custom marker icon.  
  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0041.png)

  
**POI**  
The _POI_ item as mentioned before contains the _Latitude_ and _Longitude_ necessary for the spatial search to function. I used the _POI Group_ item to help organize the _POI_ items by state. Notice that the _Type_ field uses the custom _SPE POI_.  
  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0042.png)

Each of the cities are represented by the base _POI_ which comes with a title, description, and image field.  
  
**Note:** You can also make your pages inherit from the _IPOI_ template. Rather than your locations appearing below the POIs node they would exist in your content tree, somewhere underneath the Home item.  
  
For this to function, create a "Location" feature template which inherits from the _IPOI_ template. Then create a "Location Detail" project template which inherits from "Location". The scope created above then can be adjusted to narrow the results to the tree of location pages as seen below.

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0300.png)

  
  
**Rendering Variants**  
The creation of new _Rendering Variants_ for these controls is the last piece to making this work. The following should be added or updated to meet your visual needs.  
  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0043.png)

For the _POI_ rendering variant I set the **Default Variant** on the custom _SPE POI_. This should influence the presentation of the InfoWindow that appears on the map.  
  
For the _Search Results_ rendering variant I created a new **Location Variant** and applied it in the Experience Editor for the component.  
  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0044.png)

I styled the rendering variant to help position the title, description, latitude, longitude, and image into the beautiful structure seen above.  
  

### Update

After I rolled out a new website using the information in this article, I discovered that I need to use a \*VariantTemplate\* for the distance.  
  

![](/images/posts/build-a-location-finder-search-using-sxa/SNAG-0756.png)

  
Since the template is using NVelocity, you can add some additional checks so that the markup will be empty with the distance has no value.  
  

> #if ($geospatial && $geospatial.Distance) $geospatial.Distance miles #end

### Conclusion

That's pretty much all it takes to build a custom **Location Finder** on your website. The only code required was using SPE to siphon all of the geo data and images into Sitecore.  
**Additional Resources**  
If you haven't checked out Reinoud's post on [Partial Designs and Page Designs](http://reinoudvandalen.nl/blog/sitecore-experience-accelerator-partial-designs-and-page-designs/) I would highly recommend you do that today as it will give you some clue at how to build up the page in this article. Looks like there was even a refresh on the icons too!  
  
I've chosen to use the **Basic** provided with SXA rather than the **Wireframe** theme so all my images show up.
