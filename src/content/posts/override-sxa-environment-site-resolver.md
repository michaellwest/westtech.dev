---
title: "Override SXA Environment Site Resolver"
created: "2018-11-05"
description: "In this very short post I demonstrate how to override the EnvironmentSiteResolver included with SXA to remove the use of fast queries."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2018/11/override-sxa-environment-site-resolver.html"
migrated: true
---

In this very short post I demonstrate how to override the EnvironmentSiteResolver included with SXA to remove the use of fast queries.  
  
This was tested on Sitecore 8.2.7 and SXA 1.7.0. Most of this is copied from the SXA library **Sitecore.XA.Foundation.Multisite**. I changed **ResolveAllSites** to call the local function **GetContentItemsOfTemplate** instead of the extension method. Then **GetContentItemsOfTemplate** calls the link database for items.  
  
Thank you to my friend Corey Smith for his help in cleaning up the copy/paste mess that was in my initial version.  
  

```
44644 13:45:34 WARN  [Unicorn] A Fast Query was performed and Unicorn had one or more configurations enabled that used Transparent Sync. Fast Query is not supported with Transparent Sync. Either stop using Fast Query (it's generally regarded as a bad idea in almost every circumstance), or disable Transparent Sync for all configurations.
44644 13:45:34 WARN  [Unicorn] The Fast Query was: //*[@@templateid = '{EDA823FC-BC7E-4EF6-B498-CD09EC6FDAEF}']
44644 13:45:34 WARN  [Unicorn] The call stack that made the Fast Query was:    at Unicorn.Data.DataProvider.UnicornSqlServerDataProvider.QueryFast(String query, CallContext context)
   at Sitecore.Data.DataProviders.DataProvider.SelectIDs(String query, CallContext context, DataProviderCollection providers)
   at Sitecore.Data.DataManager.SelectItems(String query, Boolean& processed)
   at Sitecore.Data.DataManager.SelectItems(String query)
   at Sitecore.Data.DefaultDatabase.SelectItems(String query)
   at Scms.Foundation.Multisite.SiteResolvers.ScmsEnvironmentSitesResolver.<GetContentItemsOfTemplate>d__4.MoveNext()
   at System.Collections.Generic.List`1..ctor(IEnumerable`1 collection)
   at System.Linq.Enumerable.ToList[TSource](IEnumerable`1 source)
   at Scms.Foundation.Multisite.SiteResolvers.ScmsEnvironmentSitesResolver.ResolveAllSites(Database database)
   at Sitecore.XA.Foundation.Multisite.Providers.SxaSiteProvider.GetSiteList()
   at Sitecore.XA.Foundation.Multisite.Providers.SxaSiteProvider.InitializeSites()
   at Sitecore.XA.Foundation.Multisite.Providers.SxaSiteProvider.GetSites()
   at System.Linq.Enumerable.<SelectManyIterator>d__17`2.MoveNext()
   at Sitecore.Sites.SiteCollection.AddRange(IEnumerable`1 sites)
   at Sitecore.Sites.SitecoreSiteProvider.GetSites()
   at Sitecore.Sites.DefaultSiteContextFactory.GetSites()
   at Sitecore.XA.Foundation.Multisite.SiteInfoResolver.get_Sites()
   at Sitecore.XA.Feature.Search.Pipelines.Initialize.InitializeRouting.Process(PipelineArgs args)
   at (Object , Object )
...
```

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Data.Managers;
using Sitecore.Data.Templates;
using Sitecore.Diagnostics;
using Sitecore.XA.Foundation.Multisite;
using Sitecore.XA.Foundation.Multisite.Comparers;
using Sitecore.XA.Foundation.Multisite.SiteResolvers;

namespace Scms.Foundation.Multisite.SiteResolvers
{
    public class ScmsEnvironmentSitesResolver : IEnvironmentSitesResolver
    {
        private readonly IEnvironmentSitesResolver _environmentSitesResolver;

        public ScmsEnvironmentSitesResolver(IEnvironmentSitesResolver environmentSitesResolver)
        {
            _environmentSitesResolver = environmentSitesResolver;
        }

        public IList<Item> ResolveAllSites(Database database)
        {
            var objList = (database != null ? GetContentItemsOfTemplate(database, Templates.SiteDefinition.ID).ToList() : null) ??
                new List<Item>();
            objList.Sort(new TreeOrderComparer());
            return objList;
        }

        public IList<Item> ResolveEnvironmentSites(List<Item> sites, string environment)
        {
            return _environmentSitesResolver.ResolveEnvironmentSites(sites, environment);
        }

        public string GetActiveEnvironment()
        {
            return _environmentSitesResolver.GetActiveEnvironment();
        }

        public IList<string> ResolveEnvironments(IEnumerable<Item> sites)
        {
            return _environmentSitesResolver.ResolveEnvironments(sites); ;
        }

        public static IEnumerable<Item> GetContentItemsOfTemplate(Database database, ID templateId)
        {
            if (database == null) yield break;

            var selectedTemplate = TemplateManager.GetTemplate(templateId, database);
            if (selectedTemplate == null) yield break;

            var descendants = selectedTemplate.GetDescendants();
            var templateArray = new Template[1]
            {
                selectedTemplate
            };

            var templates = descendants.Concat(templateArray);
            var watch = new System.Diagnostics.Stopwatch();
            watch.Start();
            var linkDb = Globals.LinkDatabase;
            foreach (var template in templates)
            {
                var templateItem = database.GetItem(template.ID);
                var items = linkDb.GetReferrers(templateItem)
                    .Select(link => link.GetSourceItem());
                foreach (var item in items.Where(item => item.Paths.IsContentItem)) yield return item;
            }

            watch.Stop();
            Log.Info($"Completed loading sites in {watch.ElapsedMilliseconds} ms.", typeof(ScmsEnvironmentSitesResolver));
        }
    }
}
```

```csharp
using Microsoft.Extensions.DependencyInjection;
using Scms.Foundation.Multisite.SiteResolvers;
using Sitecore.DependencyInjection;
using Sitecore.XA.Foundation.Multisite;
using Sitecore.XA.Foundation.Multisite.SiteResolvers;

namespace Scms.Foundation.Multisite.Pipelines.IoC
{
    public class RegisterServices : IServicesConfigurator
    {
        public void Configure(IServiceCollection serviceCollection)
        {
            serviceCollection.AddSingleton<IEnvironmentSitesResolver, ScmsEnvironmentSitesResolver>(sp =>
            {
                var innerResolver = new EnvironmentSitesResolver();
                return new ScmsEnvironmentSitesResolver(innerResolver);
            });
        }
    }
}
```

```xml
<?xml version="1.0" encoding="utf-8" ?>
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <services>
      <configurator type="Scms.Foundation.Multisite.Pipelines.IoC.RegisterServices, Scms.Foundation.Multisite"/>
      <register serviceType="Sitecore.XA.Foundation.Multisite.SiteResolvers.IEnvironmentSitesResolver, Sitecore.XA.Foundation.Multisite"
                implementationType="Sitecore.XA.Foundation.Multisite.SiteResolvers.EnvironmentSitesResolver, Sitecore.XA.Foundation.Multisite" lifetime="Singleton">
        <patch:delete />
      </register>
    </services>
  </sitecore>
</configuration>
```

[View on GitHub Gist](https://gist.github.com/michaellwest/d0970c471522a290b73ec83005066ef7)
