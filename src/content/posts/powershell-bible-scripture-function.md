---
title: "PowerShell Bible Scripture Function"
created: "2013-07-24"
updated: "2014-06-16"
description: "I've been meaning to put this together for a while and just now got around to doing it."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/07/powershell-bible-scripture-function.html"
migrated: true
---

I've been meaning to put this together for a while and just now got around to doing it. Here's a short function that calls the Bible.org Api for Bible scriptures. One idea I had was to plug this into my profile so that I could replace the Microsoft log with a scripture.

```ps

 
function Get-BibleVerse {
    <#
        .SYNOPSIS
            Calls the bible.org api and returns the specified scriptures.

        .DESCRIPTION
            Calls the bible.org api to return the specified book-chapter-verse,
            random verse, or verse of the day.

        .PARAMETER Random
            Indicates the scripture returned should be random.

        .PARAMETER VerseOfTheDay
            Indicates the scripture returned should be the verse of the day.

        .PARAMETER Book
            Indicates the book to return, such as Matthew, Marke, Luke, or John.

        .EXAMPLE
            PS C:\> Get-BibleVerse -Random

        .EXAMPLE
            PS C:\> Get-BibleVerse -VerseOfTheDay -Type Json -Formatting Plain

        .EXAMPLE
            PS C:\> Get-BibleVerse -Book Ephesians -Chapter 5 -Verse 25 -Type Json

        .NOTES
            Michael West
            07.23.2013
            http://michaellwest.blogspot.com

        .LINK
            http://labs.bible.org/api_web_service
    #>
    [CmdletBinding(DefaultParameterSetName="Default")]
    param(
        [Parameter(ParameterSetName="Random")]
        [switch]$Random,

        [Parameter(ParameterSetName="Votd")]
        [switch]$VerseOfTheDay,

        [Parameter(ParameterSetName="Default")]
        [ValidateNotNullOrEmpty()]
        [string]$Book="Genesis",
        
        [Parameter(ParameterSetName="Default")]
        [ValidateScript({$_ -gt 0})]
        [int]$Chapter = 1,

        [Parameter(ParameterSetName="Default")]
        [ValidateScript({$_ -gt -1})]
        [int]$Verse=1,

        [ValidateSet("Json","Xml","Text")]
        [string]$Type="Text",

        [ValidateSet("Full","Para","Plain")]
        [string]$Formatting="Plain"
    )

    $url = "http://labs.bible.org/api/?passage="

    if($PSCmdlet.ParameterSetName -eq "Votd") {
        $url += "votd"
    } elseif ($PSCmdlet.ParameterSetName -eq "Random") {
        $url += "random"
    } else {
        $url += "$($Book)+$($Chapter)"
        if($Verse) {
            $url += ":$($Verse)"
        }
    }
    $url += "&type=$($Type)&formatting=$($Formatting)"
    $url = $url.ToLower()

    $result = Invoke-WebRequest -Uri $url
    if($result) {
        $result.Content
    }
}
 
```

Update 07.24.2013 Add this to your profile to get the verse of the day.

```ps

    $scripture = (Get-BibleVerse -VerseOfTheDay -Type Json | ConvertFrom-Json)[0]
    "$($scripture.bookname) $($scripture.chapter):$($scripture.verse) $($scripture.text)"
```
