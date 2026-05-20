---
title: "Five Certificate Headaches in a Month"
created: 2026-05-06
description: "A stray space in a SAN, a PFX password I could not verify, an incomplete chain on a live URL, a load balancer disagreeing with its IIS origin, and Sitecore Identity Server unable to read its own private key — and the Certz commands that replaced the OpenSSL contortions."
tags: [certificates, security, powershell]
draft: false
---

Five different certificate problems in the last month, across five different services. Each one used to be a multi-tool, multi-tab, copy-into-textarea ritual. This post is the short version of how each one looked, and the [Certz](/certz-0-4-certificate-management-utility) commands that replaced the OpenSSL contortions.

## A space in the SAN

Someone produced a certificate with a stray whitespace character in a `dnsName` Subject Alternative Name. The cert generated, the cert installed, and most TLS clients did not complain immediately — which is the worst possible failure mode, because it means the bad cert ships and surfaces somewhere downstream where the diagnosis is messy. RFC 5280 is clear that `dnsName` is an `IA5String` and the CA/Browser Forum requirements (BR-019) explicitly forbid whitespace, but if your generation tool does not validate the SAN before signing, you can ship one without noticing.

```powershell
certz lint cert.pfx --password $env:CERT_PASS --severity error
```

The lint output flags the offending SAN by name and points at BR-019. If your CI pipeline runs `lint` against every PFX it produces, this never escapes the build.

## A PFX I could not verify

A vendor sent over a `.pfx` and a password. Before pushing it through the deploy pipeline I wanted to confirm the password was actually correct — and that the file was a PFX at all, and not, for example, a DER cert someone renamed.

The recipe used to be loading it in PowerShell:

```powershell
[X509Certificate2]::new("vendor.pfx", "ProvidedPass")
```

Which works, but throws a generic `CryptographicException` on a wrong password and gives you nothing to look at if the file is not actually a PFX. The faster check:

```powershell
certz inspect vendor.pfx --password ProvidedPass
```

Right password, you get a panel with subject, issuer, validity, SANs, and the key algorithm. Wrong password, you get a one-line error. Wrong format, you get a one-line error. Same command for all three diagnostics, which means there is no decision tree about *which* tool to reach for.

## An incomplete chain on a live URL

A routine TLS rotation went out on a Friday afternoon. Cert valid, CN and SANs correct, browsers in my profile happy. The synthetic monitor disagreed:

```
TLS handshake failed: certificate unknown
```

In the past this is where I would `openssl s_client -connect`, squint at the chain, and walk a base64 blob through `openssl x509 -text -noout`. Instead:

```powershell
certz inspect https://api.example.com --chain
```

Subject, issuer, SANs, validity dates, and a chain tree — with one yellow line near the bottom:

```
Chain validation: incomplete chain (intermediate not presented)
```

The CA had rotated the intermediate. The deploy script's bundle step silently dropped the new one because it was looking for the old filename. Five minutes of fixing the bundle, push, restart, recover. The fix was not the interesting part — the diagnosis taking one command instead of fifteen was.

## Load balancer vs IIS

We had a service fronted by a load balancer that terminated TLS with a public cert, and an IIS server behind it that also presented a cert — the LB-to-IIS hop ran TLS, not plaintext. After a partial rotation we were not sure if both ends had been updated. Browsers only see the LB; the IIS cert is invisible from the outside.

I used to run `certz inspect` against each URL and eyeball the thumbprints. `diff` does the same thing in one command and accepts URLs directly:

```powershell
certz diff https://service.example.com https://iis-internal:443
```

The output is a four-column table — Property, Left, Right, Status — with the changed fields highlighted. In my case the LB had been rotated and the IIS server had not. Subject and SANs matched (same cert template), but Serial Number, Thumbprint, and Valid From all flagged as `changed`. Exit code 1 because they differed, which means the same command works as a CI gate after a rotation.

## Identity Server cannot read its own key

A Sitecore XM Identity Server on Windows IIS stopped issuing tokens. The Identity Server logs were a stream of:

```
CryptographicException: Keyset does not exist
```

The signing cert was right there in `LocalMachine\My`. The thumbprint matched IdentityServer configuration. Inspecting the cert confirmed it was loaded correctly and the private key was present:

```powershell
certz inspect <thumbprint> --store My --location LocalMachine
```

Subject right, validity right, `HasPrivateKey: true`. So the cert was fine. The runtime identity was the problem — the IIS app pool account (`IIS AppPool\<app-pool-name>` for that instance) did not have read access to the private key file that lived under `C:\ProgramData\Microsoft\Crypto\Keys`. The cert blob is in the registry; the key material is on the filesystem with its own ACL, and "in the store" does not imply "readable by the running process." Most Sitecore installer scripts grant the right ACL on first install, but a host rebuild or a manual cert reimport skips that step and the failure does not surface until tokens are requested.

The fix today is still a `certlm.msc` -> Manage Private Keys click-fest, or `icacls` against the right file under `Crypto\Keys` (CNG) or `Crypto\RSA\MachineKeys` (legacy CSP) once you resolve the key file path. There is no clean one-liner yet.

> **Coming soon:** I have [#69](https://github.com/michaellwest/certz/issues/69) open in Certz to add a `certz grant` command so this lives in the deploy script next to `certz trust add`, instead of in a runbook. If this failure mode is recurring for you too, watch that issue or chime in.

The diagnosis is still fast even without the grant command: one `certz inspect` confirms the cert is good, which collapses the problem space to "ACL on the key file." From there it is mechanical.

## The one that used to take a morning

The headaches above were small. The reason I started building Certz in the first place was a different kind of pain: the recurring half-day ritual of standing up the development certificate stack for a Sitecore XM topology on Windows IIS.

The constraints stack on top of each other:

- A local development CA, trusted by the Windows host
- A leaf cert covering four or five hostnames at once — `cm.local`, `cd.local`, `id.local`, `xconnect.local`, sometimes regional variants beyond that
- The leaf cert must be **RSA**, not ECDSA, or Sitecore Identity Server crashes at startup with a `NullReferenceException` (I [wrote that one up](/identity-server-ecdsa-certificate-pitfall) separately because the failure mode is invisible until JWKS is hit)
- The PFX must use **legacy 3DES** encryption, because the .NET Framework runtime under Sitecore XM 10.x cannot load a PFX produced with the modern AES-256 default
- The leaf has to land in `LocalMachine\My` so IIS bindings can reference it, and the CA has to be trusted in `Root` so browsers and `dotnet sitecore login` do not complain
- The IIS app pool account needs read access on the private key after import — the same ACL story from a few headaches ago

The old version of this ritual was somewhere between ten and fifteen lines of PowerShell — `New-SelfSignedCertificate` with a `-DnsName` array, an `Export-PfxCertificate` to write the PFX, `Import-PfxCertificate` to drop it into `LocalMachine\My`, a separate trust step into `Root`, then the IIS bindings and the ACL grant. Every flag has a reason; every flag is also a thing you can typo at 11 PM the night before a customer demo. I have done that.

The Certz version of the cert-generation step is two commands:

```powershell
# 1. Create and trust a local development CA
certz create ca --name "Local Dev CA" --trust

# 2. Create a multi-SAN leaf cert signed by that CA, with the constraints
#    Sitecore XM needs (RSA, legacy 3DES PFX), and trust it on the host
certz create dev cm.local `
    --san cd.local --san id.local --san xconnect.local `
    --key-type RSA --pfx-encryption legacy `
    --issuer-cert ca.pfx --issuer-password $env:CA_PASS `
    --trust
```

Configuring the IIS bindings and granting the app pool ACL on the private key are still separate steps — the IIS bindings are mechanical with the IIS PowerShell module, and the ACL grant is the same `certlm.msc` shuffle covered earlier (and is what [#69](https://github.com/michaellwest/certz/issues/69) is going to fix). But the cert *generation* part — which used to sprawl across a custom script and was where most of the morning went — collapses into the two commands above. The leaf cert is regenerated whenever validity expires or the topology changes, which with the [398-day CA/Browser Forum limit](https://cabforum.org/working-groups/server/baseline-requirements/) happens more often than you would think.

The first time I ran this end-to-end and had a working Sitecore XM cert ready to import into IIS in under five minutes, I deleted a `setup-dev-cert.ps1` script that had been growing organically since around 2018. It was 220 lines.

## Takeaway

None of the small ones were exotic. The space in a SAN, the unverified PFX password, the incomplete chain on a live URL, the LB-vs-origin comparison, the Identity Server private-key ACL — all of them are the kind of thing you will see if you operate enough services for long enough. What changed is the time-to-diagnosis. The tool you reach for first determines whether "what is going on with this certificate?" is fifteen minutes or fifteen seconds. And when several constraints stack up at once — the Sitecore stack being the obvious example — the difference is more like a morning versus five minutes.

If you are doing certificate work on a developer machine or a build server and you have not picked up [Certz](https://github.com/michaellwest/certz) yet, give it a try. Feedback and issue reports are welcome.
