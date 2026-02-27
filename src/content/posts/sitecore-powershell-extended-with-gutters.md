---
title: "Sitecore PowerShell Extended with Gutters"
created: "2014-11-01"
updated: "2015-05-17"
description: "Recently I challenged myself to find integrations with Sitecore PowerShell Extensions that have not yet been published."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2014/11/sitecore-powershell-extended-with-gutters.html"
migrated: true
---

Recently I challenged myself to find integrations with [Sitecore PowerShell Extensions](http://goo.gl/G2ULkI) that have not yet been published. I saw this cool [article](http://www.partechit.nl/en/blog/2013/03/display-item-publication-status-in-the-sitecore-gutter) by ParTechIT and knew it was something I had to try. Of course I have to tell someone when I get it figured out.  
  

> [@adamnaj](https://twitter.com/adamnaj) [@MichaelWest101](https://twitter.com/MichaelWest101) [@ParTechIT](https://twitter.com/ParTechIT) shit just got real!  
> — Mike Reynolds (@mike\_i\_reynolds) [November 1, 2014](https://twitter.com/mike_i_reynolds/status/528344549274714112)

  

After having already extended with [pipelines](http://michaellwest.blogspot.com/2014/10/sitecore-powershell-extended-with-pipelines.html) I didn't expect this to take very long. Hopefully those reading this will learn something, decide to share it, and point out areas of improvement. Feel free to comment or make suggestions. I expect to add this to a future release of [Sitecore PowerShell Extensions](http://goo.gl/G2ULkI) (SPE).  
  
User Story:  
As a spe user, I can create scripts to run when rendering gutters so that I don't have to compile the GutterRenderer.  
As a spe user, the script can be configured just like any other GutterRender, so that I don't have to further complicate the setup.  
  
Acceptance Criteria:  
  

-   The gutter rendering scripts must reside under the following path:

-   /sitecore/system/Modules/PowerShell/Script Library/Content Editor/Gutters

-   The GutterRenderer must be configured under the following path:

-   /sitecore/content/Applications/Content Editor/Gutters

-   The example GutterRenderer must be stolen.

Some concepts you will see in this article:

-   Creating a GutterRenderer using Windows PowerShell code in SPE.
-   Configuring a GutterRenderer in Sitecore

First we begin with creating a new class in our Sitecore.SharedSource.PowerShell library. The class to create in this example is called GutterStatusRenderer.

using System;
using Cognifide.PowerShell.PowerShellIntegrations.Host;
using Cognifide.PowerShell.PowerShellIntegrations.Settings;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Shell.Applications.ContentEditor.Gutters;

namespace Sitecore.SharedSource.Gutters
{
    // Inherit from the GutterRenderer in order to override the GetIconDescriptor.
    public class GutterStatusRenderer : GutterRenderer
    {
        // We override the GetIconDescriptor so a script can be called in it's place.
        protected override GutterIconDescriptor GetIconDescriptor(Item item)
        {
            // The scriptId parameter is configured when we create a new gutter
            // here /sitecore/content/Applications/Content Editor/Gutters
            if (!Parameters.ContainsKey("scriptId")) return null;

            var scriptId = new ID(Parameters\["scriptId"\]);

            var db = Factory.GetDatabase("master");
            var scriptItem = db.GetItem(scriptId);

            // If a script is configured but does not exist then return.
            if (scriptItem == null) return null;

            // Create a new session for running the script.
            using (var session = new ScriptSession(ApplicationNames.Default))
            {
                var script = (scriptItem.Fields\[ScriptItemFieldNames.Script\] != null)
                    ? scriptItem.Fields\[ScriptItemFieldNames.Script\].Value
                    : String.Empty;

                // We will need the item variable in the script.
                session.SetVariable("item", item);

                try
                {
                    // Any objects written to the pipeline in the script will be returned.
                    var output = session.ExecuteScriptPart(script, false);
                    foreach (var result in output)
                    {
                        if (result.GetType() == typeof (GutterIconDescriptor))
                        {
                            return (GutterIconDescriptor) result;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Log.Error(ex.Message, this);
                }
            }

            return null;
        }
    }
}

  
Second we need to create a new Gutter library and a Publication Status script. We'll come back to the content of the script later.  
  

![](/images/posts/sitecore-powershell-extended-with-gutters/SNAG-0117.png)

Third we need to create a new Gutter in the "core" database.

  

![](/images/posts/sitecore-powershell-extended-with-gutters/SNAG-0118.png)

  

If you recall from the source code above, the scriptId indicates which script to call for this GutterRenderer. This will allow you to use the same GutterStatusRenderer class for all your gutter needs.

  

Finally we need to write our script. You'll notice that it's almost exactly what was stolen from ParTechIT, in PowerShell form.

  

<#
    Adapted from:
    http://www.partechit.nl/en/blog/2013/03/display-item-publication-status-in-the-sitecore-gutter
#>

# The $item variable is populated in the GutterStatusRenderer class using session.SetVariable.
if(-not $item) {
    Write-Log "The item is null."
    return $null
}
$publishingTargetsFolderId = New-Object Sitecore.Data.ID "{D9E44555-02A6-407A-B4FC-96B9026CAADD}"
$targetDatabaseFieldId = New-Object Sitecore.Data.ID "{39ECFD90-55D2-49D8-B513-99D15573DE41}"

$existsInAll = $true
$existsInOne = $false

# Find the publishing targets item folder
$publishingTargetsFolder = \[Sitecore.Context\]::ContentDatabase.GetItem($publishingTargetsFolderId)
if ($publishingTargetsFolder -eq $null) {
    return $null
}

# Retrieve the publishing targets database names
# Check for item existance in publishing targets
foreach($publishingTargetDatabase in $publishingTargetsFolder.GetChildren()) {
    Write-Log "Checking the $($publishingTargetDatabase\[$targetDatabaseFieldId\]) for the existence of $($item.ID)"
    if(\[Sitecore.Data.Database\]::GetDatabase($publishingTargetDatabase\[$targetDatabaseFieldId\]).GetItem($item.ID)) {
        $existsInOne = $true
    } else {
        $existsInAll = $false
    }
}

# Return descriptor with tooltip and icon
$tooltip = \[Sitecore.Globalization.Translate\]::Text("This item has not yet been published")
$icon = "People/16x16/flag\_red.png"

if ($existsInAll) {
    $tooltip = \[Sitecore.Globalization.Translate\]::Text("This item has been published to all targets")
    $icon = "People/16x16/flag\_green.png"
    Write-Log "Exists in all"
} elseif ($existsInOne) {
    $tooltip = \[Sitecore.Globalization.Translate\]::Text("This item has been published to at least one target")
    $icon = "People/16x16/flag\_yellow.png"
    Write-Log "Exists in one"
}

$gutter = New-Object Sitecore.Shell.Applications.ContentEditor.Gutters.GutterIconDescriptor
$gutter.Icon = $icon
$gutter.Tooltip = $tooltip
$gutter.Click = \[String\]::Format("item:publish(id={0})", $item.ID)
$gutter

  
Here's the final result.  
  

![](/images/posts/sitecore-powershell-extended-with-gutters/2014-10-31_18-51-05.gif)

  

That's pretty much it. Happy coding!

  

References:  
  

-   http://www.partechit.nl/en/blog/2013/03/display-item-publication-status-in-the-sitecore-gutter
-   http://michaellwest.blogspot.com/2014/10/sitecore-powershell-extended-with-pipelines.html

// Mikey
