---
title: "Certz 0.4: A Certificate Management Utility"
created: 2026-03-04
description: "Certz is a cross-platform CLI for creating, inspecting, linting, and monitoring X.509 certificates — here's what shipped in 0.4."
tags: [certificates, dotnet, powershell]
draft: false
---

Certificate management on developer machines and build servers tends to involve a scattered mix of `openssl`, `certutil`, platform-specific GUI tools, and Stack Overflow snippets you adapt differently every time. I built [Certz](https://github.com/michaellwest/certz) to consolidate the operations I actually use into a single cross-platform CLI. Version 0.4 just shipped, and this post covers what it does and what's new.

## What it does

Certz is a single-binary CLI for working with X.509 certificates. It runs on Windows (x64), Linux (x64), and macOS (arm64/x64) with no runtime dependencies — download from [GitHub releases](https://github.com/michaellwest/certz/releases) and run.

The core commands:

- **create** — generate development certificates (`create dev`) or Certificate Authority certificates (`create ca`)
- **inspect** — examine certificates from files, URLs, or certificate stores
- **lint** — validate certificates against CA/Browser Forum requirements
- **convert** — transform between PEM, DER, and PFX formats
- **monitor** — track certificate expiration across multiple sources
- **trust** — add or remove certificates from the system trust store
- **store** — list certificates in a certificate store
- **renew** — extend certificate validity

## What's new in 0.4

### Comparing and identifying certificates

Two new commands for analyzing certificates you already have.

`certz diff` compares two certificates side-by-side, highlighting differences in subject, validity, SANs, key usage, and other fields. Useful for verifying renewals or confirming a converted certificate matches the original.

```bash
certz diff cert-old.pem cert-new.pem
```

`certz fingerprint` generates certificate fingerprints with configurable formatting. The `--separator` flag controls the delimiter between hex pairs, and `--no-separator` strips delimiters entirely for scripting.

```bash
certz fingerprint cert.pem
certz fingerprint cert.pem --separator ":"
certz fingerprint cert.pem --no-separator
```

### Linux trust store support

Previous versions managed trust stores on Windows only. Version 0.4 extends trust store operations to Debian/Ubuntu (via `update-ca-certificates`) and Red Hat-based distributions (via `update-ca-trust`). Adding a CA certificate to the system trust store on Linux now works the same way as Windows:

```bash
certz trust add my-ca.pem
```

Root permissions are required for system trust store modifications on Linux, same as Windows requires admin.

### Shell completion

PowerShell tab completion is now available for both PS5 and PS7. Install it once:

```powershell
certz completion --install
```

This registers completions for both `certz` and `certz.exe`, includes real-time typo correction, and is idempotent — running it again replaces the existing profile block rather than duplicating it.

### Creation enhancements

The `--eku` flag lets you specify Extended Key Usage OIDs explicitly when creating certificates. If you need a certificate that includes both server and client authentication:

```bash
certz create dev example.local --eku serverAuth --eku clientAuth
```

The interactive creation wizard (`--guided`) now prints the equivalent CLI command after completing the wizard. If you walk through the prompts to create a certificate, you get the one-liner you can paste into a script or CI pipeline to reproduce it.

### Operational flags

Two new global flags available across all commands:

- `--dry-run` — preview what a command would do without writing files or modifying trust stores. Useful when you're not sure what a `trust add` will touch.
- `--verbose` — diagnostic output for troubleshooting. When something doesn't behave as expected, this is the first thing to try.

### CI/CD improvements

Every release now ships a `checksums.txt` file containing SHA-256 hashes for all downloadable artifacts. Standard practice for security-sensitive tooling, but it wasn't there before.

Test results now output in [CTRF](https://ctrf.io/) (Common Test Results Format), which makes it straightforward to integrate Certz's test results into CI/CD dashboards.

### Polish

- Help screens on leaf commands now include usage examples, not just flag descriptions
- The root help screen has an ASCII art banner because every CLI tool needs one eventually
- Resolved a batch of usability issues ([#31](https://github.com/michaellwest/certz/issues/31)–[#38](https://github.com/michaellwest/certz/issues/38)) covering option naming and validation
- Removed deprecated v1 commands and dead code

## Getting started

Certz is available on [GitHub](https://github.com/michaellwest/certz). Download the [latest release](https://github.com/michaellwest/certz/releases) for your platform, and give it a try. Feedback and issue reports are welcome.
