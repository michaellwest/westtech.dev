---
title: "Troubleshoot Certificate Revocation Lookups"
date: 2023-01-31
description: "Intermittent SSL errors on outbound service calls traced back to blocked LetsEncrypt revocation check domains."
tags: ["security", "certificates", "networking"]
draft: false
---

In this article we investigate an intermittent SSL failure that had nothing to do with the certificate itself.

## The error

A non-production environment started throwing errors when a custom contact form built on Sitecore MVC attempted to POST to an external service hosted by another team. The error logged in the Sitecore log files was straightforward enough:

```
The remote certificate is invalid according to the validation procedure.
```

The certificate on the target service was a LetsEncrypt certificate — valid, not expired, trusted by the OS. So what gives?

## What we found

After confirming the service URL was reachable and the LetsEncrypt root was present in the server's Trusted Root certificate store, we ran `certutil` against the certificate to inspect it:

```powershell
certutil -verify -urlfetch .\service.cer
```

The output showed repeated attempts to reach domains under `lencr.org` — the domain LetsEncrypt uses for Online Certificate Status Protocol (OCSP) and CRL distribution point lookups. .NET validates the certificate chain on every outbound HTTPS call, which includes checking whether the certificate has been revoked.

If those revocation check domains are unreachable — blocked by a firewall, a restrictive egress policy, or a proxy with no rule covering them — .NET treats the check as a failure and the call dies.

## The fix

The network and security teams added outbound firewall rules permitting traffic to the LetsEncrypt validation domains:

- `*.o.lencr.org`
- `*.i.lencr.org`
- `*.c.lencr.org`

After the rules were in place, the errors stopped.

## Takeaway

If you're seeing intermittent certificate validation failures on outbound calls to services using LetsEncrypt certificates, check your firewall egress rules before assuming the certificate is the problem. The certificate is probably fine — the revocation check just can't get out.
