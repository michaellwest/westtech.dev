<#
.SYNOPSIS
    Creates a new blog post for westtech.dev with proper frontmatter and image folder.

.DESCRIPTION
    Prompts for a title and tags, generates a slug and filename,
    creates the Markdown file with frontmatter, creates the matching
    image folder, and opens the file in VS Code.

.EXAMPLE
    .\scripts\new-post.ps1
#>

# Resolve the repo root (one level up from /scripts)
$repoRoot = Split-Path -Parent $PSScriptRoot
$postsDir = Join-Path $repoRoot "src\content\posts"
$imagesDir = Join-Path $repoRoot "public\images\posts"

# ─── Helpers ────────────────────────────────────────────────────────────────

function ConvertTo-Slug([string]$text) {
    $slug = $text.ToLower()
    $slug = $slug -replace "[^a-z0-9\s-]", ""   # remove special chars
    $slug = $slug -replace "\s+", "-"             # spaces to hyphens
    $slug = $slug -replace "-{2,}", "-"           # collapse multiple hyphens
    $slug = $slug.Trim("-")
    return $slug
}

# ─── Prompts ────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  westtech.dev — New Post" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

$title = Read-Host "  Post title"
if ([string]::IsNullOrWhiteSpace($title)) {
    Write-Error "Title cannot be empty."
    exit 1
}

$tagsInput = Read-Host "  Tags (comma-separated, e.g. sitecore, dotnet)"
$tags = ($tagsInput -split ",") | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ -ne "" }
$tagsYaml = ($tags | ForEach-Object { "`"$_`"" }) -join ", "

$description = Read-Host "  One-line description (for SEO / post cards)"
if ([string]::IsNullOrWhiteSpace($description)) {
    $description = "TODO: add a description."
}

# ─── Generate slug & paths ──────────────────────────────────────────────────

$today     = Get-Date -Format "yyyy-MM-dd"
$slug      = ConvertTo-Slug $title
$fileName  = "$slug.md"
$filePath  = Join-Path $postsDir $fileName
$imageDir  = Join-Path $imagesDir $slug

# ─── Collision check ────────────────────────────────────────────────────────

if (Test-Path $filePath) {
    Write-Warning "A post with slug '$slug' already exists: $filePath"
    $overwrite = Read-Host "  Overwrite? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "  Aborted." -ForegroundColor Yellow
        exit 0
    }
}

# ─── Write frontmatter ──────────────────────────────────────────────────────

$frontmatter = @"
---
title: "$title"
date: $today
description: "$description"
tags: [$tagsYaml]
draft: false
---

<!-- Begin writing here. Images live in /images/posts/$slug/ -->
"@

Set-Content -Path $filePath -Value $frontmatter -Encoding UTF8

# ─── Create image folder ────────────────────────────────────────────────────

if (-not (Test-Path $imageDir)) {
    New-Item -ItemType Directory -Path $imageDir | Out-Null
}

# Place a .gitkeep so the empty folder is tracked by git
$gitkeep = Join-Path $imageDir ".gitkeep"
if (-not (Test-Path $gitkeep)) {
    New-Item -ItemType File -Path $gitkeep | Out-Null
}

# ─── Summary ────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ✓ Post created:" -ForegroundColor Green
Write-Host "    $filePath" -ForegroundColor White
Write-Host "  ✓ Image folder:" -ForegroundColor Green
Write-Host "    $imageDir" -ForegroundColor White
Write-Host ""

# Open in VS Code if available
if (Get-Command code -ErrorAction SilentlyContinue) {
    code $filePath
} else {
    Write-Host "  Tip: open $fileName in your editor to start writing." -ForegroundColor DarkGray
}
