---
title: "Hotfix Wiped Out My Roles"
created: 2022-11-29
description: "A Sitecore 10.2.1 cumulative hotfix changed how federated authentication handles roles at sign-in — and took our users' permissions with it."
tags: ["sitecore", "authentication", "identity"]
draft: false
---

In this article we will see how the Default Identity Provider used with Identity Server learned a new behavior with role management when resolving users on sign in. This impacts Sitecore 10.2 when the cumulative hotfix 10.2.1 is installed.

## Back story

Here is how things played out for us. After we upgraded to Sitecore XM 10.2 we started to experience an issue on startup (typically after the application pool recycled) related to a concurrency issue when loading the IAR files. Specifically an `ArgumentNullException` is bubbled up to the `Sitecore.Data.DataProviders.CompositeDataProvider` which causes Sitecore to really struggle. Recycling the application pool once more generally resolves the issue. After opening a support ticket we learned the issue was recently resolved by a cumulative hotfix outlined in [KB1001823](https://support.sitecore.com/kb?id=kb_article_view&sysparm_article=KB1001823). Problem solved!

Unfortunately the hotfix revealed another issue which relates to how user membership is managed during the signin process. We found this during a deployment and users started to complain about not being able to do anything more than login.

## What changed

There exists a `SignInProcessor` which resolves the user, either by accessing the existing user or creating a new one. The hotfix includes a change to the internal code for this processor. Sitecore Support provided some additional details as to why things changed:

> The correct behavior for Federated Authentication is to allow the Identity Provider to control the user roles. The original implementation did not adhere to this and as such you could override the roles assigned to users from within Sitecore.

We are using ADFS and have things configured to require users to be in the Active Directory role "Sitecore-Users". We implemented a `Sitecore.Owin.Authentication.Services.Transformation` to override the claim roles and specifically only add `Sitecore\Sitecore Client Users`. After the user performs an initial login, an Administrator can then assign roles from within Sitecore. This is super helpful as our corporate process for managing access is more tedious/slower than doing so in the Sitecore User/Role Manager.

## The fix

Gist: [gist.github.com/michaellwest/0a3e8aa2e86e149887eefd19a85aa83f](https://gist.github.com/michaellwest/0a3e8aa2e86e149887eefd19a85aa83f)

After a few minutes of poking around I narrowed the issue down to `Sitecore.Owin.Authentication.Pipelines.CookieAuthentication.SignIn.ResolveUser` where the new implementation wrecks our current process. Below is the implementation extracted from the original 10.2 version:

```csharp
using Microsoft.AspNet.Identity;
using Sitecore.Diagnostics;
using Sitecore.Owin.Authentication.Extensions;
using Sitecore.Owin.Authentication.Pipelines.CookieAuthentication.SignIn;
using Sitecore.Owin.Authentication.Services;
using Sitecore.Security.Accounts;
using System.Security.Claims;

namespace Scms.Feature.Security.Pipelines.CookieAuthentication.SignIn
{
    public class ResolveUser : SignInProcessor
    {
        protected ApplicationUserFactory ApplicationUserFactory { get; }
        protected UserFactory UserFactory { get; }

        public ResolveUser(ApplicationUserFactory applicationUserFactory, UserFactory userFactory)
        {
            Assert.ArgumentNotNull(applicationUserFactory, "applicationUserFactory");
            Assert.ArgumentNotNull(userFactory, "userFactory");
            this.ApplicationUserFactory = applicationUserFactory;
            this.UserFactory = userFactory;
        }

        public override void Process(SignInArgs args)
        {
            string name;
            Assert.ArgumentNotNull(args, "args");
            ClaimsIdentity identity = args.Context.Identity;
            if (identity != null)
            {
                name = identity.Name;
            }
            else
            {
                name = null;
            }
            string str = name;
            if (!string.IsNullOrEmpty(str) && args.Context.OwinContext.GetUserManager().FindByName(str) != null)
            {
                User user = this.UserFactory.CreateUser(new ClaimsPrincipal(args.Context.Identity));
                args.User = this.ApplicationUserFactory.CreateUser(user);
            }
            if (args.User == null)
            {
                args.Success = false;
                args.AbortPipeline();
            }
        }
    }
}
```

Wire it up with a config patch that swaps out the hotfix processor for this one:

```xml
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/"
               xmlns:set="http://www.sitecore.net/xmlconfig/set/"
               xmlns:role="http://www.sitecore.net/xmlconfig/role/">
  <sitecore role:require="Standalone or ContentManagement">
    <pipelines>
      <owin.cookieAuthentication.signIn>
        <processor
          patch:instead="processor[@type='Sitecore.Owin.Authentication.Pipelines.CookieAuthentication.SignIn.ResolveUser, Sitecore.Owin.Authentication']"
          type="Scms.Feature.Security.Pipelines.CookieAuthentication.SignIn.ResolveUser, Scms.Feature"
          resolve="true" />
      </owin.cookieAuthentication.signIn>
    </pipelines>
  </sitecore>
</configuration>
```

If you are on Sitecore XM 10.3 or later, a configuration setting is available that restores the original behavior without any assembly work:

```xml
<setting name="Owin.Authentication.ClearRolesWhenSignIn" value="false" />
```

## Takeaway

Read the release notes on cumulative hotfixes. Changes to authentication pipelines have a way of silently altering behavior in ways that only show up once real users try to do real things. Test sign-in flows — not just the login screen, but actual role-gated actions — after any identity-related hotfix.

## References

- [Sitecore Stack Exchange — Configure default roles using Identity Server with ADFS](https://sitecore.stackexchange.com/questions/31725/how-to-configure-default-roles-when-using-identity-server-integrated-with-adfs-o)
- [Sitecore KB1001823](https://support.sitecore.com/kb?id=kb_article_view&sysparm_article=KB1001823)
