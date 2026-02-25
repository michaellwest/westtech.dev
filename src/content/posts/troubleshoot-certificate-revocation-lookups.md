---
title: "Troubleshoot Certificate Revocation Lookups"
created: 2023-01-31
description: "Intermittent SSL errors on outbound service calls traced back to blocked LetsEncrypt revocation check domains."
tags: ["security", "certificates", "networking"]
draft: false
---

In this article we investigate an intermittent SSL failure that had nothing to do with the certificate itself.

![LetsEncrypt Logo](/images/posts/troubleshoot-certificate-revocation-lookups/letsencrypt-logo.png)

## The error

A non-production environment started throwing errors when a custom contact form built on Sitecore MVC attempted to POST to an external service hosted by another team. The full exception logged in the Sitecore log files looked like this:

```
Exception: System.Security.Authentication.AuthenticationException
Message: The remote certificate is invalid according to the validation procedure.
Source: System
   at System.Net.Security.SslState.StartSendAuthResetSignal(ProtocolToken message, AsyncProtocolRequest asyncRequest, Exception exception)
   at System.Net.Security.SslState.CheckCompletionBeforeNextReceive(ProtocolToken message, AsyncProtocolRequest asyncRequest)
   at System.Net.Security.SslState.ProcessReceivedBlob(Byte[] buffer, Int32 count, AsyncProtocolRequest asyncRequest)
   ...
   at System.Net.TlsStream.Write(Byte[] buffer, Int32 offset, Int32 size)
   at System.Net.PooledStream.Write(Byte[] buffer, Int32 offset, Int32 size)
   at System.Net.ConnectStream.WriteHeaders(Boolean async)
```

Gist: [gist.github.com/michaellwest/71bcd53ab6291a2130b9d3648a2c9ad8](https://gist.github.com/michaellwest/71bcd53ab6291a2130b9d3648a2c9ad8)

The certificate on the target service was a LetsEncrypt certificate — valid, not expired, trusted by the OS. So what gives?

## What we found

After confirming the service URL was reachable and the LetsEncrypt root was present in the server's Trusted Root certificate store, we used the script below to export the certificate and run `certutil` against it:

```powershell
$webRequest = [Net.WebRequest]::Create("https://www.company.com")
try { $webRequest.GetResponse() } catch {}
$cert = $webRequest.ServicePoint.Certificate
$bytes = $cert.Export([Security.Cryptography.X509Certificates.X509ContentType]::Cert)
Set-Content -Value $bytes -Encoding Byte -Path "$pwd\company.cer"
certutil.exe -verify -urlfetch "$pwd\company.cer"
```

The output showed repeated attempts to reach domains under `lencr.org` — the domain LetsEncrypt uses for Online Certificate Status Protocol (OCSP) and CRL distribution point lookups. .NET validates the certificate chain on every outbound HTTPS call, which includes checking whether the certificate has been revoked.

If those revocation check domains are unreachable — blocked by a firewall, a restrictive egress policy, or a proxy with no rule covering them — .NET treats the check as a failure and the call dies.

![certutil output showing lencr.org access attempt](/images/posts/troubleshoot-certificate-revocation-lookups/snag-0221.png)

![certutil output showing lencr.org domain blocked](/images/posts/troubleshoot-certificate-revocation-lookups/snag-0220.png)

![certutil final error message](/images/posts/troubleshoot-certificate-revocation-lookups/snag-0222.png)

## The fix

The network and security teams added outbound firewall rules permitting traffic to the LetsEncrypt validation domains:

- `*.o.lencr.org`
- `*.i.lencr.org`
- `*.c.lencr.org`

After the rules were in place, the errors stopped.

## Takeaway

If you're seeing intermittent certificate validation failures on outbound calls to services using LetsEncrypt certificates, check your firewall egress rules before assuming the certificate is the problem. The certificate is probably fine — the revocation check just can't get out.
