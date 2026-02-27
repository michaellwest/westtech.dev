---
title: "Sitecore Code Editor 1.5 Preview"
created: "2014-10-05"
description: "Recently I've spent some time on the Sitecore Code Editor Module to add Markdown support."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2014/10/sitecore-code-editor-15-preview.html"
migrated: true
---

Recently I've spent some time on the [Sitecore Code Editor Module](http://goo.gl/tj8F5O) to add [Markdown](http://daringfireball.net/projects/markdown/) support. Back in May I saw a nice article by [Dan Cruickshank](http://getfishtank.ca/blog/module-markdown-for-sitecore) where he integrated the [MarkdownDeep](http://www.toptensoftware.com/markdowndeep/) library into Sitecore module. I thought to myself, "If Dan can do it for his module, and I can it for my module!" So here you have it. An implementation of Markdown in the Code Editor module.  
  
There are a few aspects that must be considered when creating a custom field. First, how do you render text so that html doesn't break the content editor. Second, how do you render text so that html doesn't break the page editor.  
  
The magic for the page editor begins here in the GetCodeTextFieldValue pipeline:  

            if (Context.PageMode.IsPageEditorEditing)
            {
                // Encode so the page editor will render the html.
                // Replace with line breaks so the spacing is correct.
                args.Result.FirstPart = HtmlUtil.ReplaceNewLines(HttpUtility.HtmlEncode(args.Result.FirstPart));
                args.Result.LastPart = HtmlUtil.ReplaceNewLines(HttpUtility.HtmlEncode(args.Result.LastPart));
                return;
            }

  
The ReplaceNewLines method simply searches for all new line characters and converts to html breaks:  

        public static string ReplaceNewLines(string input)
        {
            if (String.IsNullOrEmpty(input)) return input;

            return Regex.Replace(input, @"(\\r\\n|\\n)", "<br />", RegexOptions.Compiled);
        }

  
In the event that you are not viewing in page editor mode, the code skips and runs the MarkdownRenderer:  

            var parameters = args.GetField().Source.ToDictionary(args.Parameters);
            if (!parameters.ContainsKey("mode") || !parameters\["mode"\].Is("markdown")) return;

            // Decode the html and then convert new lines to html breaks.
            args.Result.FirstPart = MarkdownRenderer.Render(args.Result.FirstPart, parameters);
            args.Result.LastPart = MarkdownRenderer.Render(args.Result.LastPart, parameters);

  
The content editor mode is handled very similar to page editor in the CodeText class (inherits from Sitecore.Web.UI.HtmlControls.Memo):  

        protected string RenderPreview()
        {
            // Renders the html for the field preview in the content editor.
            return String.Format("<div style='height: 100%; overflow: hidden;'>{0}</div>",
                HtmlUtil.ReplaceNewLines(HttpUtility.HtmlEncode(Value)));
        }

        protected override void DoRender(HtmlTextWriter output)
        {
            SetWidthAndHeightStyle();
            output.Write("<div {0}>{1}</div>", ControlAttributes, RenderPreview());
        }

  

As you can see by overriding the DoRender you have access to how the control is rendered. Below is a short video demoing the new functionality.

  

Have a look out on [Github](https://github.com/michaellwest/sitecore-codeeditor) for a more detailed look into the code that makes this module tick.  
  
// Michael
