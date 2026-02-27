---
title: "Hedgehog TDS - Package Version"
created: "2013-11-26"
updated: "2014-06-16"
description: "I wanted to create TDS packages using the version from the project assembly version."
tags: ["sitecore"]
source: "https://michaellwest.blogspot.com/2013/11/hedgehog-tds-package-version.html"
migrated: true
---

I wanted to create TDS packages using the version from the project assembly version.  
Here's a piece of code that I finally figured out how to accomplish dynamically. Place at the bottom of your .scproj file.

```
  <Import Project="$(MSBuildExtensionsPath)\HedgehogDevelopment\SitecoreProject\v9.0\HedgehogDevelopment.SitecoreProject.targets" />
  <ItemGroup>
    <AssembliesPath Include="..\SomethingAwesome.Web\bin\SomethingAwesome.Web.dll" />
  </ItemGroup>
  <Target Name="BeforeSitecoreBuild">
    <GetAssemblyIdentity AssemblyFiles="@(AssembliesPath)">
      <Output TaskParameter="Assemblies" ItemName="AssemblyVersion" />
    </GetAssemblyIdentity>
    <CreateProperty Value="%(AssemblyVersion.Version)">
      <Output TaskParameter="Value" PropertyName="PackageVersion" />
    </CreateProperty>
  </Target>
```

[View on GitHub Gist](https://gist.github.com/michaellwest/7665723)
