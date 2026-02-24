<#
.SYNOPSIS
    Pastes an image from the Windows clipboard into the current post's image folder.

.DESCRIPTION
    Reads a bitmap image from the clipboard, asks for a short description,
    saves the file with a descriptive slugified name, and outputs the Markdown
    embed string ready to paste into your post.

    Run this script while writing a post. It will ask which post to target
    (defaults to the most recently modified post).

.EXAMPLE
    .\scripts\paste-image.ps1
#>

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$repoRoot  = Split-Path -Parent $PSScriptRoot
$postsDir  = Join-Path $repoRoot "src\content\posts"
$imagesDir = Join-Path $repoRoot "public\images\posts"

# ─── Helpers ────────────────────────────────────────────────────────────────

function ConvertTo-Slug([string]$text) {
    $slug = $text.ToLower()
    $slug = $slug -replace "[^a-z0-9\s-]", ""
    $slug = $slug -replace "\s+", "-"
    $slug = $slug -replace "-{2,}", "-"
    $slug = $slug.Trim("-")
    return $slug
}

# ─── Check clipboard ────────────────────────────────────────────────────────

$image = [System.Windows.Forms.Clipboard]::GetImage()
if ($null -eq $image) {
    Write-Error "No image found on the clipboard. Copy a screenshot first, then run this script."
    exit 1
}

Write-Host ""
Write-Host "  westtech.dev — Paste Image" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Image found on clipboard ($($image.Width)x$($image.Height) px)" -ForegroundColor DarkGray
Write-Host ""

# ─── Pick target post ───────────────────────────────────────────────────────

$posts = Get-ChildItem -Path $postsDir -Filter "*.md" |
         Sort-Object LastWriteTime -Descending

if ($posts.Count -eq 0) {
    Write-Error "No posts found in $postsDir"
    exit 1
}

Write-Host "  Recent posts:" -ForegroundColor White
for ($i = 0; $i -lt [Math]::Min($posts.Count, 8); $i++) {
    $marker = if ($i -eq 0) { " (default)" } else { "" }
    Write-Host "  [$i] $($posts[$i].BaseName)$marker" -ForegroundColor Gray
}
Write-Host ""

$choice = Read-Host "  Choose post number (Enter = 0)"
$idx = if ([string]::IsNullOrWhiteSpace($choice)) { 0 } else { [int]$choice }
if ($idx -lt 0 -or $idx -ge $posts.Count) { $idx = 0 }

$postSlug = $posts[$idx].BaseName
$imageFolder = Join-Path $imagesDir $postSlug

if (-not (Test-Path $imageFolder)) {
    New-Item -ItemType Directory -Path $imageFolder | Out-Null
}

# ─── Prompt for description ─────────────────────────────────────────────────

$description = Read-Host "  Short description (used as filename + alt text)"
if ([string]::IsNullOrWhiteSpace($description)) {
    $description = "screenshot"
}

$slug      = ConvertTo-Slug $description
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$fileName  = "$slug.png"
$filePath  = Join-Path $imageFolder $fileName

# Avoid collisions with a timestamp suffix
if (Test-Path $filePath) {
    $fileName = "$slug-$timestamp.png"
    $filePath = Join-Path $imageFolder $fileName
}

# ─── Save image ─────────────────────────────────────────────────────────────

$image.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
$image.Dispose()

# ─── Build Markdown embed ───────────────────────────────────────────────────

$mdPath   = "/images/posts/$postSlug/$fileName"
$mdEmbed  = "![$description]($mdPath)"

# ─── Output ─────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ✓ Saved to:" -ForegroundColor Green
Write-Host "    $filePath" -ForegroundColor White
Write-Host ""
Write-Host "  ✓ Markdown embed (copied to clipboard):" -ForegroundColor Green
Write-Host "    $mdEmbed" -ForegroundColor Yellow
Write-Host ""

# Copy the Markdown string to clipboard for easy pasting
[System.Windows.Forms.Clipboard]::SetText($mdEmbed)
