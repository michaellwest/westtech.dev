---
title: "Identity Server ECDSA Certificate Pitfall"
created: 2026-03-12
description: "Sitecore Identity Server crashes with a NullReferenceException when configured with an ECDSA certificate — the fix is generating RSA keys instead."
tags: [sitecore, certificates, identity, docker, security]
draft: false
---

If your Sitecore Identity Server container is crashing at startup with a `NullReferenceException` and the JWKS endpoint returns a 500, check what type of key your development certificate was generated with. There's a good chance it's ECDSA, and Identity Server needs RSA.

## The error

Running Sitecore XM 10.4 in Docker with Identity Server 7 (`sitecore-id7:10.4-ltsc2022`), the ID container starts and immediately logs a fatal exception:

```
Duende.IdentityServer.Hosting.IdentityServerMiddleware [Fatal]
Unhandled exception: "Object reference not set to an instance of an object."
```

Hitting the JWKS endpoint directly (`/.well-known/openid-configuration/jwks`) returns a 500 Internal Server Error. This also breaks `dotnet sitecore login` for the Sitecore CLI, since it depends on that endpoint for token validation. The error message gives you nothing to work with.

## Why this is easy to miss

The confusing part is that everything else looks fine. The certificate is loaded into the container via `CertificateRawData`. Traefik terminates TLS with the same certificate and serves the site over HTTPS without complaint. The CM and ID containers start, the login page renders, and the browser shows a valid certificate in the address bar.

The failure only surfaces when Identity Server tries to build its JSON Web Key Set (JWKS) response — a step that happens internally, well after the certificate has been accepted for TLS.

## The root cause

Modern certificate tools — [Certz](/certz-0-4-certificate-management-utility), mkcert, and others — default to generating ECDSA (Elliptic Curve) keys. This makes sense: ECC keys are smaller, faster, and perfectly fine for TLS. Most of the time you never notice or care about the key type.

The problem is that Duende IdentityServer calls `X509Certificate2.GetRSAPrivateKey()` internally when it builds the JWKS response for JWT token signing. On an ECC certificate, that method returns `null`. No guard clause, no helpful error message — just a `NullReferenceException` that surfaces as a generic fatal crash.

## How to diagnose

If you suspect this is your problem, check the certificate's key algorithm. In PowerShell:

```powershell
$cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(".\cert.pfx", "password")
$cert.PublicKey.Oid.FriendlyName
```

If the output is `ECC` (or `ECDSA_P256`, etc.), that's the problem. You need it to say `RSA`.

## The fix

Generate the shared development certificate with an RSA key. If you're using Certz:

```bash
certz create dev id.local cm.local --key-type RSA --pfx-encryption legacy
```

Two flags matter here:

- **`--key-type RSA`** — forces an RSA key pair instead of the default ECDSA
- **`--pfx-encryption legacy`** — uses 3DES encryption for the PFX file, which is required for .NET Framework 4.x consumers. Sitecore Identity Server in the 10.x line runs on .NET Framework, and the modern AES-256 PFX encryption that .NET 6+ defaults to will fail to load on Framework runtimes.

A single RSA certificate works for both Traefik TLS termination and Identity Server JWT signing. No need for separate certificates.

## Takeaway

If your Identity Server is crashing with a `NullReferenceException` on startup and the JWKS endpoint is returning 500s, check the key type on your development certificate before digging deeper. The fix is a one-flag change at cert generation time.
