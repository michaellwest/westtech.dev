---
title: "Sitecore PowerShell Extended with Pipelines"
created: "2014-10-22"
description: "Every once in a while I have what I think is a cool idea."
tags: ["powershell", "sitecore"]
source: "https://michaellwest.blogspot.com/2014/10/sitecore-powershell-extended-with-pipelines.html"
migrated: true
---

![](/images/posts/sitecore-powershell-extended-with-pipelines/SNAG-0113.png)

  
  
Every once in a while I have what I think is a cool idea. Then I have to tell someone.  

> [@adamnaj](https://twitter.com/adamnaj) [@mike\_i\_reynolds](https://twitter.com/mike_i_reynolds) Extended [#Sitecore](https://twitter.com/hashtag/Sitecore?src=hash) to run scripts during loggingin loggedin, logout. On logout the context user is anonymous. Why?  
> — Michael West (@MichaelWest101) [October 19, 2014](https://twitter.com/MichaelWest101/status/523841325859635200)

  

> [@MichaelWest101](https://twitter.com/MichaelWest101) [@mike\_i\_reynolds](https://twitter.com/mike_i_reynolds) This sounds like an absolutely awesome idea!  
> — Adam Najmanowicz (@adamnaj) [October 19, 2014](https://twitter.com/adamnaj/status/523897970044178432)

Thank you Adam for the encouragement. This took me a few days to finally write it all down. Hopefully those reading this will learn something, decide to share it, and point out areas of improvement. Feel free to comment or make suggestions. I expect to add this to a future release of [Sitecore PowerShell Extensions](http://goo.gl/G2ULkI) (SPE).  
  
User Story:  
As a spe user, I can create scripts to run during user logging in, successful login, and logout so that I can automate tasks that are tedious.  
  
Acceptance Criteria:  
  

-   The scripts must fit into one of the available pipelines provided by Sitecore.

-   loggingin
-   loggedin
-   logout

-   The example scripts used must be stolen.

  

> [@MichaelWest101](https://twitter.com/MichaelWest101) [@adamnaj](https://twitter.com/adamnaj) [@sitecorejohn](https://twitter.com/sitecorejohn) I stole from john. You stole from me. John will steal from you. ;)  
> — Mike Reynolds (@mike\_i\_reynolds) [October 19, 2014](https://twitter.com/mike_i_reynolds/status/523872884658552833)

Some concepts you will see in this article:  
  

-   Config include files
-   Pipelines
-   Configuration Factory with hint attribute and raw: prefix

First we begin with creating a new library project in Visual Studio. When we are complete with the example, we'll have a project that looks like this:

  

![](/images/posts/sitecore-powershell-extended-with-pipelines/SNAG-0112.png)

  

Second we need to reference Sitecore.Kernel and Cognifide.PowerShell libraries. You'll find the Cognifide.PowerShell library in the bin directory after installing SPE.

  

Third we will create our new pipeline processor which will execute our PowerShell scripts. Below is the skeleton of the class.

using Sitecore.Pipelines;

namespace Sitecore.SharedSource.Pipelines
{
    public abstract class PipelineProcessor<TPipelineArgs> where TPipelineArgs : PipelineArgs
    {
        protected void Process(TPipelineArgs args)
        {
        }
    }
}

  

We can go ahead and create our three pipelines to extend the PipelineProcessor. Below is the complete implementation of each pipeline.  
  

  

using Sitecore.Pipelines.LoggedIn;

namespace Sitecore.SharedSource.Pipelines.LoggedIn
{
    public class LoggedInScript : PipelineProcessor<LoggedInArgs> { }
}

  

using Sitecore.Pipelines.LoggingIn;

namespace Sitecore.SharedSource.Pipelines.LoggingIn
{
    public class LoggingInScript : PipelineProcessor<LoggingInArgs> { }
}

  

using Sitecore.Pipelines.Logout;

namespace Sitecore.SharedSource.Pipelines.Logout
{
    public class LogoutScript : PipelineProcessor<LogoutArgs> { }
}

  

Let's go ahead and setup our script libraries in Sitecore before we create the include config and finish out the implementation of running the scripts.  
  

![](/images/posts/sitecore-powershell-extended-with-pipelines/SNAG-0114.png)

  
Now that we have the three pipeline libraries, we can create the include config to map to those. I prefer this solution so I don't have to hard code the GUID for each in compiled code.  
  

<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <processors>
      <loggingin argsType="Sitecore.Pipelines.LoggingIn.LoggingInArgs">
        <!-- Pipeline to run scripts while the user is logging in. -->
        <processor patch:after="processor\[position()=last()\]" mode="on" type="Sitecore.Sharedsource.Pipelines.LoggingIn.LoggingInScript, Sitecore.SharedSource.PowerShell">
          <config hint="raw:Config">
            <!-- /sitecore/system/Modules/PowerShell/Script Library/Pipelines/LoggingIn -->
            <libraryId>{83C826B6-C478-43D9-92BD-E5589F50DA27}</libraryId>
          </config>
        </processor>
      </loggingin>      
      <loggedin argsType="Sitecore.Pipelines.LoggedIn.LoggedInArgs">
        <!-- Pipeline to run scripts after the user is logged in. -->
        <processor patch:after="processor\[position()=last()\]" mode="on" type="Sitecore.Sharedsource.Pipelines.LoggedIn.LoggedInScript, Sitecore.SharedSource.PowerShell">
          <config hint="raw:Config">
            <!-- /sitecore/system/Modules/PowerShell/Script Library/Pipelines/LoggedIn -->
            <libraryId>{D0226A69-F15D-4CBF-812C-BFE3F14936C5}</libraryId>
          </config>
        </processor>
      </loggedin>
      <logout argsType="Sitecore.Pipelines.Logout.LogoutArgs">
        <!-- Pipeline to run scripts when the user logs out. -->
        <processor  patch:after="\*\[@type='Sitecore.Pipelines.Logout.CheckModified, Sitecore.Kernel'\]" mode="on" type="Sitecore.Sharedsource.Pipelines.Logout.LogoutScript, Sitecore.SharedSource.PowerShell">
          <config hint="raw:Config">
            <!-- /sitecore/system/Modules/PowerShell/Script Library/Pipelines/Logout -->
            <libraryId>{EE098609-4CA4-4FEE-8A86-3AB410AB9C38}</libraryId>
          </config>
        </processor>
      </logout>
    </processors>
  </sitecore>
</configuration>

  
The pipeline is pretty standard. I did have to place the LogoutScript pipeline to be placed right after CheckModified, otherwise the username will be anonymous.  
  
Notice the config section inside the processor. I found an example [here](http://www.partechit.nl/en/blog/2014/09/configurable-pipeline-processors-and-event-handlers) by Partech which helped to setup the parameters in the config. John West has a nice [article](http://www.sitecore.net/Learn/Blogs/Technical-Blogs/John-West-Sitecore-Blog/Posts/2011/02/The-Sitecore-ASPNET-CMS-Configuration-Factory.aspx) explaining the different options.  
  
With that said, I'll show the remaining implementation of the PipelineProcessor. The code follows a few steps:  
  

1.  Read the libraryId configured for the specified pipeline. A static collection would create a problem in this example, so be sure to leave it as it is below.
2.  If the library item contains any scripts, then continue.
3.  For each script defined in the pipeline library create a new session and execute the script. The args parameter is passed as a session variable for use in the scripts.

  
  

    public abstract class PipelineProcessor<TPipelineArgs> where TPipelineArgs : PipelineArgs
    {
        protected PipelineProcessor()
        {
            Configuration = new Dictionary<string, string>();
        }

        protected void Process(TPipelineArgs args)
        {
            Assert.ArgumentNotNull(args, "args");

            Assert.IsNotNullOrEmpty(Configuration\["libraryId"\], "The configuration setting 'libraryId' must exist.");

            var libraryId = new ID(Configuration\["libraryId"\]);

            var db = Factory.GetDatabase("master");
            var libraryItem = db.GetItem(libraryId);
            if (!libraryItem.HasChildren) return;

            foreach (var scriptItem in libraryItem.Children.ToList())
            {
                using (var session = new ScriptSession(ApplicationNames.Default))
                {
                    var script = (scriptItem.Fields\[ScriptItemFieldNames.Script\] != null)
                        ? scriptItem.Fields\[ScriptItemFieldNames.Script\].Value
                        : String.Empty;
                    session.SetVariable("args", args);

                    try
                    {
                        session.ExecuteScriptPart(script, false);
                    }
                    catch (Exception ex)
                    {
                        Log.Error(ex.Message, this);
                    }
                }
            }
        }

        protected Dictionary<string, string> Configuration { get; private set; }

        public void Config(XmlNode node)
        {
            Configuration.Add(node.Name, node.InnerText);
        }
    }

  
Finally, create your scripts in the libraries and watch it in action. Each of my example scripts are adapted from other articles and are linked at the end of this post.  
  

![](/images/posts/sitecore-powershell-extended-with-pipelines/SNAG-0115.png)

  
  
That's pretty much it. If you really want to mess with your colleagues, write a script to send them a phony email every time they login and logout.  
  

References:

-   http://www.sitecore.net/Learn/Blogs/Technical-Blogs/John-West-Sitecore-Blog/Posts/2011/02/The-Sitecore-ASPNET-CMS-Configuration-Factory.aspx
-   http://www.partechit.nl/en/blog/2014/09/configurable-pipeline-processors-and-event-handlers
-   http://www.matthewkenny.com/2014/10/custom-sitecore-pipelines/
-   Some scripts you can use. The random desktop background is really useful.

-   http://www.sitecore.net/Learn/Blogs/Technical-Blogs/John-West-Sitecore-Blog/Posts/2012/12/Automatically-Show-the-Quick-Info-Section-in-the-Content-Editor-of-the-Sitecore-ASPNET-CMS.aspx
-   http://www.sitecore.net/Learn/Blogs/Technical-Blogs/John-West-Sitecore-Blog/Posts/2010/07/Randomize-Sitecore-Desktop-Background-Image.aspx
-   http://sitecorejunkie.com/2013/06/08/enforce-password-expiration-in-the-sitecore-cms/
-   http://sitecorejunkie.com/2013/09/24/unlock-sitecore-users-items-during-logout/
