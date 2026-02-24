---
title: "Hotfix Wiped Out My Roles"
date: 2022-11-29
description: "A Sitecore 10.2.1 cumulative hotfix changed how federated authentication handles roles at sign-in — and took our users' permissions with it."
tags: ["sitecore", "authentication", "identity"]
draft: false
---

Today we look at a hotfix that fixed one problem and quietly introduced another.

## The setup

After upgrading to Sitecore XM 10.2, our team ran into concurrency issues when loading IAR files during startup. The errors were `ArgumentNullException` exceptions in the logs and the fix was a cumulative hotfix from Sitecore. We applied it, the startup errors went away, and we moved on.

Then our users started reporting they could log in but couldn't actually do anything.

## What changed

The hotfix modified the `SignInProcessor` that runs during authentication. Specifically, it changed how user roles are handled when a user signs in through the Default Identity Provider.

According to Sitecore Support, the new behavior enforces federated authentication principles: the Identity Provider (IdP) is treated as the authority for role assignments. Any roles assigned to a user inside Sitecore — through the User Manager or Roles in Roles — are cleared at sign-in to let the IdP's claims take precedence.

For teams using ADFS with a custom `Transformation` that only grants `Sitecore\Sitecore Client Users`, and then manually assigns additional roles per user inside Sitecore, this behavior completely breaks the access model. Users sign in, all their Sitecore-assigned roles are stripped, and they're left with only what the IdP claims say — which in our case wasn't much.

## The fix

The problematic component is `Sitecore.Owin.Authentication.Pipelines.CookieAuthentication.SignIn.ResolveUser`. We extracted the original 10.2 version and replaced the hotfix version, which restored normal behavior.

For Sitecore 10.3 and later, Sitecore added a configuration setting specifically for this scenario:

```xml
<setting name="Owin.Authentication.ClearRolesWhenSignIn" value="false" />
```

Set that to `false` and you're done. No assembly surgery required.

## Takeaway

Read the release notes on cumulative hotfixes. Changes to authentication pipelines have a way of silently altering behavior in ways that only show up once real users try to do real things. Test sign-in flows — not just the login screen, but actual role-gated actions — after any identity-related hotfix.
