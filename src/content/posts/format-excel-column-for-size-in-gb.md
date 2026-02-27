---
title: "Format Excel Column for Size in GB"
created: "2014-02-05"
description: "Today I was doing some reporting on file sizes and saw that I had columns with data in bytes."
tags: []
source: "https://michaellwest.blogspot.com/2014/02/format-excel-column-for-size-in-gb.html"
migrated: true
---

Today I was doing some reporting on file sizes and saw that I had columns with data in bytes. When you are looking at the length in gigabytes it can get kinda crazy.  
Here's a simple trick:  
Format the column with a custom setting and paste this in the format  
`[<500000]#,##0" B ";[<500000000]#,##0,," MB";#,##0,,," GB"`  
  
Original article [here](http://excel-answers.com/microsoft/Excel/34882622/using-comma-to-scale-large-numbers.aspx)
