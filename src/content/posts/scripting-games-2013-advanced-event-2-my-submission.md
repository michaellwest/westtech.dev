---
title: "Scripting Games 2013 Advanced Event 2 - My Submission"
created: "2013-05-07"
updated: "2013-05-09"
description: "If you have not already, I highly recommend you work on the events for the Scripting Games ."
tags: ["powershell"]
source: "https://michaellwest.blogspot.com/2013/05/scripting-games-2013-advanced-event-2.html"
migrated: true
---

If you have not already, I highly recommend you work on the events for the [Scripting Games](http://scriptinggames.org/). I feel like I'm learning so much within a few short days mainly due to the fact that I have very specific requirements outlined by the event, as well as knowing that tons of people will potentially see my submissions. Today I'll be talking about it during the Lunch-n-Learn I host at work, so seeing constructive and accurate criticism is welcomed (username michaellwest). Here is what I have [submitted](http://scriptinggames.org/entrylist.php?entryid=483), please let me know your thoughts on how I can improve the script.

-   The begin scriptblock contains a hashtable of settings to use for the function. The keys represent the Cim class name and the values represent the properties to return. You can use strings, hashtables, and scriptblocks.
-   Use CimSessionOption with the Dcom protocol to more reliably query Windows Server 2000-2008.
-   The nested foreach loops are not that great, however the keys and properties are few so the performance is still fine. Get-CimInstance is what takes a long time.

EDIT: I made an adjustment based on a post from Mike Robbins regarding the Physical memory.

```ps

function Get-ServerInventory {
    <#
        .SYNOPSIS
            Performs a hardware inventory on the specified server(s).
 
        .DESCRIPTION
            The values returned by the inventory process may be enhanced by adding to the settings hashtable in the begin scriptblock.
            The settings key is the class name. The settings values supported include string, hashtable, and scriptblock.
 
        .PARAMETER ComputerName
            Indicates the server(s) to perform a hardware inventory. The default value is localhost.
 
        .EXAMPLE
            Perform an inventory on localhost.
 
            PS C:\> Get-ServerInventory
 
            TotalPhysicalMemory : 21356912640
            ProcessorName       : Intel(R) Core(TM) i7-2600 CPU @ 3.40GHz
            Version             : 6.1.7601
            SerialNumber        : 00371-OEM-8992671-00008
            ComputerName        : WIN7DEV01
            Cores               : 4
            Sockets             : 1
 
        .EXAMPLE
            Perform an inventory on 1-N servers with an array or using Get-Content.
 
            PS C:\> "WIN2K01","WIN2K02","WIN2008R201" | Get-ServerInventory | Format-Table -AutoSize
 
            TotalPhysicalMemory ProcessorName                            Version  SerialNumber            ComputerName Cores Sockets
            ------------------- -------------                            -------  ------------            ------------ ----- -------
                     4294148096 Intel(R) Xeon(R) CPU E5-2680 0 @ 2.70GHz 5.2.3790 69712-640-5906017-45214 WIN2K01          1       1
                     2146861056 Intel(R) Xeon(R) CPU E5-2670 0 @ 2.60GHz 5.2.3790 69712-641-5611134-45717 WIN2K02          1       1
                     4294500352 Intel(R) Xeon(R) CPU E5-2680 0 @ 2.70GHz 6.1.7601 55041-266-0135507-84842 WIN2008R201      1       1
 
        .LINK            
            Windows Server 2003 incorrectly reports the number of physical multicore processors or hyperthreading-enabled processors. Apply the below hotfix to correct the reported issue. 
            http://support.microsoft.com/kb/932370
 
        .LINK
            Example on retrieving the CPU count. 
            http://www.sql-server-pro.com/physical-cpu-count.html
    #>
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline=$true)]
        [ValidateNotNullOrEmpty()]
        [string[]]$ComputerName=$env:COMPUTERNAME
    )
 
    begin {
        $settings = @{
                "Win32_OperatingSystem" = @("Version","SerialNumber")
                "Win32_ComputerSystem" = @({param($result,$output) $output["Capacity"] = $result | Measure-Object -Property Capacity -Sum | Select-Object -ExpandProperty Sum})
                "Win32_Processor" = @(@{n="ProcessorName";e={$_.Name}}, {
                            param($result,$output)
                            $processors = @($result)
                            if ($processors[0].NumberOfCores) {
                                $output["Cores"] = $processors.Count * $processors[0].NumberOfCores
                            } else {
                                $output["Cores"] = $processors.Count
                            }
                            $output["Sockets"] = @($processors | Where-Object {$_.SocketDesignation} | Select-Object -Unique).Count
                        })
        }
    }
 
    process {
        $sessions = $ComputerName | Select-Object @{n="ComputerName";e={$_}} | 
            New-CimSession -SessionOption (New-CimSessionOption -Protocol Dcom)
 
        foreach($session in $sessions) {
            $output = @{}
            foreach($key in $settings.Keys) {
                $result = Get-CimInstance -CimSession $session -ClassName $key
                $output["ComputerName"] = $result.PSComputerName
                foreach($property in $settings[$key]) {
                    if($property -is [string]) {
                        $output[$property] = $result.$property
                    } elseif ($property -is [scriptblock]) {
                        Invoke-Command -ScriptBlock $property -ArgumentList $result, $output
                    } elseif ($property -is [hashtable]) {
                        ($result | Select-Object -Property $property).PSObject.Properties | ForEach-Object {$output[$_.Name] = $_.Value }
                    }
                }
            }
 
            [PSCustomObject]$output
 
            Remove-CimSession -CimSession $session
        }
    }
}
```
