---
title: "CSharp String to SQL Table"
created: "2013-06-27"
description: "I have a problem at work in which I need to convert a comma separated string into a SQL temp table."
tags: []
source: "https://michaellwest.blogspot.com/2013/06/csharp-string-to-sql-table.html"
migrated: true
---

I have a problem at work in which I need to convert a comma separated string into a SQL temp table. You can easily add this to a function.  

```sql
DECLARE @LoginNames VARCHAR(max)
SET @LoginNames = 'Michael,Rebecca'

-- Create a temp table with a single column called LoginName
DECLARE @temp AS TABLE (LoginName NVARCHAR(255))

IF ISNULL(@LoginNames, '') <> ''
BEGIN
    DECLARE @s NVARCHAR(max)
    WHILE LEN(@LoginNames) > 0
    BEGIN
        IF CHARINDEX(',', @LoginNames) > 0
        BEGIN
            SET @s = LTRIM(RTRIM(SUBSTRING(@LoginNames, 1, CHARINDEX(',', @LoginNames) - 1)))
            -- After parsing a single value from the list, insert into the temp table
     INSERT INTO @temp (LoginName) VALUES (@s)
            SET @LoginNames = SUBSTRING(@LoginNames, CHARINDEX(',', @LoginNames) + 1, LEN(@LoginNames))
        END ELSE
        BEGIN
            SET @s = LTRIM(RTRIM(@LoginNames))
            -- After parsing a single value from the list, insert into the temp table
     INSERT INTO @temp (LoginName) VALUES (@s)
            SET @LoginNames= ''
        END
    END
END

SELECT LoginName FROM @temp
```

  
Output:  

LoginName

Michael

Rebecca
