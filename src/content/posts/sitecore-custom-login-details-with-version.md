---
title: "Sitecore Custom Login Details With Version"
created: "2014-09-27"
description: "It sure has been a while since I last posted anything interesting...or anything at all!"
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2014/09/sitecore-custom-login-details-with-version.html"
migrated: true
---

It sure has been a while since I last posted anything interesting...or anything at all! I recently spoke with [+Michael Reynolds](https://plus.google.com/117459064641286363930) about blogging but rather than blog I decided to read all the tweets about the [Sitecore Symposium](http://www.sitecore.net/Events/SymposiumNA2014/Home.aspx) :(

Now it's time to pick it back up. What you will see in here isn't all that new, but it is however very useful. Also, at the bottom I have listed a few blogs I know of that cover the same topic. Two of which are far more interesting than mine so be sure to have a look.

Recently at work an issue came up where the QA team did not know if the test environment had the correct build applied ([TDS](https://www.hhogdev.com/products/team-development-for-sitecore/overview.aspx) package). I decided to use some old code from a version page I created for the same issue with an Asp.net applications.

The following is a list of files that we will create to make the magic happen.

- ReflectionUtil.cs : Generic reflection code to extract version details from the loaded assembly.
- ApplicationDetails.cs : Pipeline to extract version information.
- Sitecore.SharedSource.Version.config : Pipeline configuration

```csharp
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE.

using System.Text;
using Sitecore.SharedSource.Reflection;
using Sitecore.Pipelines.GetAboutInformation;

namespace Sitecore.SharedSource.Pipelines
{
    public class ApplicationDetails
    {
        public void Process(GetAboutInformationArgs args)
        {
            var text = new StringBuilder();
            text.Append("<span>Build</span></br><span>");
            text.Append(ReflectionUtil.GetExecutingAssemblyDetail(ReflectionUtil.AssemblyDetailType.Date));
            text.Append("</span></br><span>");
            text.Append(ReflectionUtil.GetExecutingAssemblyDetail(ReflectionUtil.AssemblyDetailType.Version));
            text.Append("</span>");
            args.LoginPageText = text.ToString();
        }
    }
}
```

```csharp
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE.

using System;
using System.IO;
using System.Reflection;

namespace Sitecore.SharedSource.Reflection
{
    public sealed class ReflectionUtil
    {
        /// <summary>
        /// Represents the type of detail to retrive from the assembly. The data is formatted and therefore will
        /// not appear exactly is seen through Microsoft Windows Explorer.
        /// </summary>
        public enum AssemblyDetailType
        {
            /// <summary>
            /// Indicates that no detail type is indicated.
            /// </summary>
            NotSpecified = 0,

            /// <summary>
            /// Indicates that the detail type is the name of the assembly.
            /// </summary>
            Name = 1,

            /// <summary>
            /// Indicates that the detail type is the version of the assembly.
            /// </summary>
            Version = 2,

            /// <summary>
            /// Indicates that the detail type is the date the assembly was compiled.
            /// </summary>
            Date = 3
        }

        #region Assembly

        /// <summary>
        /// Returns the details of the executing assembly specified by the <see cref="AssemblyDetailType"/>.
        /// </summary>
        public static string GetExecutingAssemblyDetail(AssemblyDetailType detail)
        {
            return AssemblyDetailHelper(detail, Assembly.GetExecutingAssembly());
        }

        /// <summary>
        /// Returns the details of the calling assembly specified by the <see cref="AssemblyDetailType"/>.
        /// </summary>
        /// <param name="detail">The type of information to extract from the assembly.</param>
        /// <returns></returns>
        public static string GetAssemblyDetail(AssemblyDetailType detail)
        {
            return AssemblyDetailHelper(detail, Assembly.GetCallingAssembly());
        }

        #region Helper

        private static string AssemblyDetailHelper(AssemblyDetailType detail, Assembly assembly)
        {
            switch (detail)
            {
                case AssemblyDetailType.Date:
                    return GetAssemblyDate(assembly);

                case AssemblyDetailType.Name:
                    return GetAssemblyName(assembly);

                case AssemblyDetailType.Version:
                    return GetAssemblyVersion(assembly);

                case AssemblyDetailType.NotSpecified:
                default:
                    return "No method implemented to return the requested details.";
            }
        }

        private static string GetAssemblyName(Assembly assembly)
        {
            var filepath = assembly.Location;
            var info = new FileInfo(filepath);
            var name = String.Format("Assembly: {0}", info.Name);
            return name;
        }

        private static string GetAssemblyVersion(Assembly assembly)
        {
            var version = assembly.GetName().Version;
            var versionMessage = String.Format("Version: {0}.{1}.{2}.{3}",
                                               version.Major, version.Minor, version.Build, version.MinorRevision);
            return versionMessage;
        }

        private static string GetAssemblyDate(Assembly assembly)
        {
            var date = RetrieveLinkerTimestamp(assembly);
            var dateMessage = String.Format("Date: {0}", date.ToString());
            return dateMessage;
        }

        private static DateTime RetrieveLinkerTimestamp(Assembly assembly)
        {
            var filePath = assembly.Location;
            const int cPeHeaderOffset = 60;
            const int cLinkerTimestampOffset = 8;
            var b = new byte[2048];
            Stream s = null;

            try
            {
                s = new FileStream(filePath, FileMode.Open, FileAccess.Read);
                s.Read(b, 0, 2048);
            }
            finally
            {
                if (s != null)
                {
                    s.Close();
                }
            }

            var i = BitConverter.ToInt32(b, cPeHeaderOffset);
            var secondsSince1970 = BitConverter.ToInt32(b, i + cLinkerTimestampOffset);
            var dt = new DateTime(1970, 1, 1, 0, 0, 0).AddSeconds(secondsSince1970);
            dt = dt.AddHours(TimeZone.CurrentTimeZone.GetUtcOffset(dt).Hours);
            return dt;
        }

        #endregion Helper

        #endregion Assembly
    }
}
```

```xml
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/">
  <sitecore>
    <pipelines>
      <getAboutInformation>
        <!-- Pipeline to render application version details on the login page. -->
        <processor type="Sitecore.SharedSource.Pipelines.ApplicationDetails, Sitecore.SharedSource.Version" />
      </getAboutInformation>
      <initialize>
    </pipelines>
  </sitecore>
</configuration>
```

[View on GitHub Gist](https://gist.github.com/michaellwest/63a417d35fa27ffff071)

The final results are clean and simple.

![](/images/posts/sitecore-custom-login-details-with-version/SNAG-0096.png)

The following is a list of other posts I found helpful.

- [ParTech](http://www.partechit.nl/en/blog/2014/08/displaying-info-on-the-sitecore-login-page)
- [SitecoreJunkie](http://sitecorejunkie.com/2013/05/18/display-content-management-server-information-in-the-sitecore-cms/)
- [Kayee](https://marketplace.sitecore.net/en/Modules/Sitecore_Partner_AboutInformation_Module.aspx)
