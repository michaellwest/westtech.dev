---
title: "Sitecore Generic Shortcodes"
created: "2013-09-11"
updated: "2014-06-16"
description: "I really enjoyed reading Sitecore Junkie's post about using Shortcodes in Sitecore."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2013/09/sitecore-generic-shortcodes.html"
migrated: true
---

I really enjoyed reading Sitecore Junkie's [post](http://sitecorejunkie.com/2013/09/07/shortcodes-in-sitecore-a-proof-of-concept/) about using Shortcodes in Sitecore. Here's an example of one I built for generic item shortcodes.

```csharp

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Sitecore;
using Sitecore.Data;

namespace Concentra.Web.Configuration.Pipelines.ExpandShortcodes
{
    /// <summary>
    /// Expands shortcodes with the following format:
    /// [item id=110D559F-DEA5-42EA-9C1C-8A5DF7E70EF9 fieldname="Title"]
    /// </summary>
    public class ExpandItemShortcodes : ExpandShortcodesProcessor
    {
        public override IEnumerable<Shortcode> GetShortcodes(string content)
        {
            if (String.IsNullOrWhiteSpace(content))
            {
                return new List<Shortcode>();
            }

            var shortcodes = new List<Shortcode>();
            var matches = Regex.Matches(content, @"\[item id=(?<id>.*) fieldname=(?<fieldname>.*)\]", 
                RegexOptions.Compiled | RegexOptions.IgnoreCase);

            foreach (var match in matches.OfType<Match>().Where(m => m.Success))
            {
                shortcodes.Add(new Shortcode
                               {
                                   Unexpanded = match.Value,
                                   Expanded = GetItem(
                                       match.Groups["id"].Value,
                                       match.Groups["fieldname"].Value)
                               }
                    );
            }

            return shortcodes;
        }

        public string GetItem(string id, string fieldName)
        {
            if (!String.IsNullOrEmpty(id) && ID.IsID(id))
            {
                var item = Context.Database.GetItem(ID.Parse(id));
                if (item != null)
                {
                    var name = fieldName.Replace("\"", String.Empty).Replace("'", String.Empty);
                    if (item.Fields.Any(field => field.Name == name))
                    {
                        return item.Fields[name].Value;
                    }
                }
            }

            return String.Empty;
        }
    }
}
```
