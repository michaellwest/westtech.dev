---
title: "Sitecore Integrated with Ace Code Editor"
created: "2013-09-22"
updated: "2014-06-16"
description: "Check out my latest video showing you how to configure the EditHtml dialog with the Ace Code Editor!"
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2013/09/sitecore-integrated-with-ace-code-editor.html"
migrated: true
---

Check out my latest video showing you how to configure the EditHtml dialog with the Ace Code Editor!  

```javascript

(function($){
	$('head').append("<style>div[id$=RibbonPanel],textarea[id$=Html] { display: none; } #CodeEditor { width: 100%; height: 100%; } </style>");

	$(function() {
		var html = $('textarea[id$=Html]');
		var ce = $("<div id='CodeEditor' />");
        html.after(ce);

        var codeeditor = ace.edit(ce[0]);
        codeeditor.setTheme("ace/theme/monokai");
        codeeditor.session.setMode("ace/mode/html");
        codeeditor.setShowPrintMargin(false);

        codeeditor.session.setValue(html.val().trim());
        codeeditor.session.on('change', function () {
                html.val(codeeditor.session.getValue());
        });

        ace.config.loadModule("ace/ext/emmet", function () {
            ace.require("ace/lib/net").loadScript("/Scripts/ace/emmet-core/emmet.js", function () {
                codeeditor.setOption("enableEmmet", true);
            });

            codeeditor.setOptions({
                enableSnippets: true,
                enableBasicAutocompletion: true
            });              
        });

        ace.config.loadModule("ace/ext/language_tools", function (module) {
            codeeditor.setOptions({
                enableSnippets: true,
                enableBasicAutocompletion: true
            });
        });
	});
}(jQuery));
```

  
Links:

-   http://ace.c9.io
-   https://github.com/ajaxorg/ace-builds/
-   http://michaellwest.blogspot.com
