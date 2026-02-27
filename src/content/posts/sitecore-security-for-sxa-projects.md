---
title: "Sitecore Security for SXA Projects"
created: "2018-12-27"
description: "Every new website requires some level of security configuration before launch."
tags: ["sitecore", "powershell"]
source: "https://michaellwest.blogspot.com/2018/12/sitecore-security-for-sxa-projects.html"
migrated: true
---

Every new website requires some level of security configuration before launch. In this article we see one possible solution to applying security to sites built with the Sitecore Experience Accelerator (SXA).  
  
Please note that the following scripts were written before the SXA module included scripts to manage security. I encourage you to evaluate those included out-of-the-box.  
  

### Role Configuration

Let's have a look at how the security will be setup for each tenant.

-   Each tenant will be organized by the company name. Companies have their own domain.
-   At least three of the six roles exist for all tenants (Admin, Editor, Developer). Each role inherits from a Base role (Sitecore Client Authoring, Sitecore Client Users) so they can login and manage content.

![](/images/posts/sitecore-security-for-sxa-projects/2018-12-27_10-52-49.png)

Tenant roles mapped to Sitecore roles

Running the script will present the user with a dialog like the following:

  

![](/images/posts/sitecore-security-for-sxa-projects/2018-12-27_11-03-48.png)

Dialog before security settings are applied

The dialog lists all of the available SXA tenants as well as any additional domains configured using the switching provider. This can be very helpful when using the Active Directory module because those users are not in the same domain as the tenant.

  

![](/images/posts/sitecore-security-for-sxa-projects/2018-12-27_11-45-54.png)

Show ribbon button using rules

  

### Script Highlights

  

Let's walkthrough what changes are applied by the script.

  

![](/images/posts/sitecore-security-for-sxa-projects/2018-12-27_11-09-16.png)

Results output after completion

-   **Site** - Admin role granted access to help cleanup after users.
-   **Home** \- Base role granted access to manage content.
-   **Overlay** \- Admin role allowed to manage overlay content.
-   **Data** \- Base role granted access to manage grandchildren. Prevents users from deleting global folders.
-   **Media** \- Base role granted access to manage available media library folders.
-   **Media Library** - Base role granted access to manage media for this site.
-   **Presentation** \- Developer role granted access to manage Rendering Variants, Partial Designs, etc.
-   **Theme** \- Developer role granted access to manage media for this theme.
-   **Data Templates** - Developer role granted access to manage data templates.
-   **Publishing Targets** - Editor role granted access to publish to any target.
-   **Languages** \- Everyone role granted access to read/write to all languages. This includes the tenant domain and additional domains selected.
-   **System Settings** - Developer role granted access to manage Modules, Settings, Tasks, and Workflows.

This will of course not cover the granularity that your company requires, but should provide you with a framework for crafting a tool for your own needs.

  

Hope this inspires you to build something great and share with the community.  
  

### The Scripts

  

```powershell
$allowItemProps = @{
    PropagationType = [Sitecore.Security.AccessControl.PropagationType]::Entity
    SecurityPermission = [Sitecore.Security.AccessControl.SecurityPermission]::AllowAccess
}

$allowDescendantsProps = @{
    PropagationType = [Sitecore.Security.AccessControl.PropagationType]::Descendants
    SecurityPermission = [Sitecore.Security.AccessControl.SecurityPermission]::AllowAccess
}

function New-AccessRuleList {
    [CmdletBinding()]
    [OutputType("System.Collections.Generic.List[Sitecore.Security.AccessControl.AccessRule]")]
    param(
        [string]$Identity,
        [string[]]$AccessRule,
        [Sitecore.Security.AccessControl.PropagationType]$PropagationType,
        [Sitecore.Security.AccessControl.SecurityPermission]$SecurityPermission
    )
    
    $list = New-Object "System.Collections.Generic.List[Sitecore.Security.AccessControl.AccessRule]"
    foreach($rule in $accessrule) {
        $list.Add((New-ItemAcl -Identity $Identity -AccessRight $rule -PropagationType $PropagationType -SecurityPermission $SecurityPermission))
    }

    @(,$list)
}
```

```powershell
Import-Function -Name New-AccessRuleList

function Setup-SystemSecurity {
    Write-Host "[System Settings Security]" -Foreground Yellow

    $realEveryone = "\Everyone"
    $virtualDataItem = Get-Item -Path "master:" -ID "{9700DC24-8969-4638-ACC3-34D54335829E}"
    Write-Information "[A] $($virtualDataItem.ItemPath)"
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $realEveryone -AccessRule item:create @allowItemProps))
    $virtualDataItem | Add-ItemAcl -AccessRules $accessRules
    
    $developerRole = "sitecore\Developer"
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $developerRole -AccessRule item:create,item:write,item:rename,item:delete @allowDescendantsProps)) 
    
    $modulesItem = Get-Item -Path "master:" -ID "{08477468-D438-43D4-9D6A-6D84A611971C}"
    Write-Information "[A] $($modulesItem.ItemPath)"
    $modulesItem | Add-ItemAcl -AccessRules $accessRules
    
    $settingsItem = Get-Item -Path "master:" -ID "{087E1EA5-6280-4575-9E70-85B588DB91B2}"
    Write-Information "[A] $($settingsItem.ItemPath)"
    $settingsItem | Add-ItemAcl -AccessRules $accessRules
    
    $tasksItem = Get-Item -Path "master:" -ID "{EF58CA2C-3E59-44E0-82C1-97FF9B98535F}"
    Write-Information "[A] $($tasksItem.ItemPath)"
    $tasksItem | Add-ItemAcl -AccessRules $accessRules
    
    $workflowItem = Get-Item -Path "master:" -ID "{05592656-56D7-4D85-AACF-30919EE494F9}"
    Write-Information "[A] $($workflowItem.ItemPath)"
    $workflowItem | Add-ItemAcl -AccessRules $accessRules
}
```

```powershell
Import-Function -Name New-AccessRuleList

function Setup-PublishingTargetSecurity {
    param(
        [ValidateNotNullOrEmpty()]
        [string]$Role
    )
    Write-Host "[System Publishing Target Security]" -Foreground Yellow

    $targets = Get-ChildItem -Path "master:" -ID "{D9E44555-02A6-407A-B4FC-96B9026CAADD}"
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $Role -AccessRule item:write @allowItemProps))
    $targets | Add-ItemAcl -AccessRules $accessRules
}
```

```powershell
Import-Function -Name New-AccessRuleList

function Setup-LanguageSecurity {
    param(
        [ValidateNotNullOrEmpty()]
        [string]$Domain
    )
    
    $roleEveryone = "$($domain)\Everyone"
    
    Write-Host "[Language Security]" -ForegroundColor Yellow
    $languageItem = Get-Item -Path "master:\system\languages"
    Write-Information "[A] $($languageItem.ItemPath) - $($domain)"
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $roleEveryone -AccessRule language:read,language:write @allowItemProps))
    $accessRules.AddRange((New-AccessRuleList -Identity $roleEveryone -AccessRule language:read,language:write @allowDescendantsProps))
    $languageItem | Add-ItemAcl -AccessRules $accessRules
}
```

```powershell
Import-Function -Name New-AccessRuleList

function Setup-TenantSecurity {
    [CmdletBinding()]
    param(
        [ValidateNotNullOrEmpty()]
        [string]$Company,
        [ValidateNotNullOrEmpty()]
        [string]$Tenant,
        [ValidateNotNullOrEmpty()]
        [string]$Site
    )
    
    $tenantPath = "master:\content\$($Company)\$($Tenant)"
    $tenantMediaPath = $tenantPath = "master:\media library\project\$($Company)\$($Tenant)"
    $sitePath = "master:\content\$($Company)\$($Tenant)\$($Site)"
    $siteMediaPath = "master:\media library\project\$($Company)\$($Tenant)\$($Site)"

    $domainName = $Company.ToLower()
    $roleBase = "$($domainName)\Base"
    $roleAdmin = "$($domainName)\Admin"
    $roleAuthor = "$($domainName)\Author"
    $roleDesigner = "$($domainName)\Designer"
    $roleDeveloper = "$($domainName)\Developer"
    $roleEditor = "$($domainName)\Editor"
    $roleFrontEnd = "$($domainName)\Front End"
    $roleEveryone = "$($domainName)\Everyone"

    $siteItem = Get-Item -Path $sitePath
    if($siteItem -eq $null){
        Write-Host "Not in site scope"
        exit
    }
    
    $tenantItem = Get-Item -Path $tenantPath
    if((Get-Domain -Name $domainName -ErrorAction SilentlyContinue) -eq $null){
        Write-Host "Domain does not exist!"
        exit
    }
    
    # Create roles if missing
    
    if(-not(Get-Role -Identity $roleBase -ErrorAction 0)) {
        New-Role -Identity $roleBase > $null
        Add-RoleMember -Identity "sitecore\Sitecore Client Authoring" -Members $roleBase
        Add-RoleMember -Identity "sitecore\Sitecore Client Users" -Members $roleBase
    }
    
    if(-not(Get-Role -Identity $roleAdmin -ErrorAction 0)) {
        New-Role -Identity $roleAdmin > $null
        Add-RoleMember -Identity "sitecore\Sitecore Local Administrators" -Members $roleAdmin
        Add-RoleMember -Identity $roleBase -Members $roleAdmin
    }
    
    if(-not(Get-Role -Identity $roleDeveloper -ErrorAction 0)) {
        New-Role -Identity $roleDeveloper > $null
        Add-RoleMember -Identity "sitecore\Developer" -Members $roleDeveloper
        Add-RoleMember -Identity "sitecore\Sitecore Client Advanced Publishing" -Members $roleDeveloper
        Add-RoleMember -Identity $roleBase -Members $roleDeveloper
    }
    
    if(-not(Get-Role -Identity $roleEditor -ErrorAction 0)) {
        New-Role -Identity $roleEditor > $null
        Add-RoleMember -Identity "sitecore\Author" -Members $roleEditor
        Add-RoleMember -Identity "sitecore\Designer" -Members $roleEditor
        Add-RoleMember -Identity "sitecore\Sitecore Client Publishing" -Members $roleEditor
        Add-RoleMember -Identity $roleBase -Members $roleEditor
    }
    
    $roleDesignerExists = $true
    if(-not(Get-Role -Identity $roleDesigner -ErrorAction 0)) {
        $roleDesignerExists = $false
    }
    
    $roleFrontEndExists = $true
    if(-not(Get-Role -Identity $roleFrontEnd -ErrorAction 0)) {
        $roleFrontEndExists = $false
    }

    Write-Host "[Site Security]" -ForegroundColor Yellow
    Write-Information "[A] $($siteItem.ItemPath)"
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $roleAdmin -AccessRule item:read,item:write,item:create @allowItemProps))
    $accessRules.AddRange((New-AccessRuleList -Identity $roleAdmin -AccessRule item:read,item:write,item:create,item:rename,item:delete @allowDescendantsProps))
    $siteItem | Set-ItemAcl -AccessRules $accessRules

    $homeItem = Get-Item -Path "$($sitePath)\Home"
    
    Write-Host "[Home Security]" -ForegroundColor Yellow
    Write-Information "[A] $($homeItem.ItemPath)"
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:read,item:write,item:create @allowItemProps))
    $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:read,item:write,item:create,item:rename,item:delete @allowDescendantsProps))
    $homeItem | Set-ItemAcl -AccessRules $accessRules
    
    Write-Host "[Overlay Security]" -ForegroundColor Yellow
    $overlayFolderTemplateId = "{D7BFFBE5-DAD8-4137-85DE-28013313F72F}"
    foreach($overlayItem in $homeItem.Children | Where-Object { $_.TemplateID -eq $overlayFolderTemplateId }) {
        Write-Information "[A] $(($overlayItem | Initialize-Item).ItemPath)"
        $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
        $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:read,item:create @allowItemProps))
        $accessRules.Add((New-ItemAcl -Identity $roleBase -AccessRight * -PropagationType Entity -SecurityPermission DenyInheritance))
        $overlayItem | Set-ItemAcl -AccessRules $accessRules

        $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
        $accessRules.AddRange((New-AccessRuleList -Identity $roleAdmin -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowItemProps))
        $accessRules.AddRange((New-AccessRuleList -Identity $roleAdmin -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
        $overlayItem | Set-ItemAcl -AccessRules $accessRules
    }
    
    Write-Host "[Data Security]" -ForegroundColor Yellow
    $dataItem = Get-Item -Path "$($sitePath)\Data"
    $dataFolders = gci -path $dataItem.Paths.Path -Language $dataItem.Language.Name
    foreach($dF in $dataFolders){
        Write-Information "[A] $($dF.ItemPath)"
        $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
        $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:create @allowItemProps))
        $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
        $dF | Set-ItemAcl -AccessRules $accessRules
    }
    
    Write-Host "[Media Security]" -ForegroundColor Yellow
    $siteMediaItem = Get-Item -Path "$($sitePath)\Media"
    Write-Information "[A] $($siteMediaItem.ItemPath)"
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:create @allowItemProps))
    $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
    $siteMediaItem | Set-ItemAcl -AccessRules $accessRules
    
    Write-Host "[Media Library Security]" -ForegroundColor Yellow
    $siteMediaLibraryRoot = Get-Item -Path $siteMediaPath
    Write-Information "[A] $($siteMediaLibraryRoot.ItemPath)"
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:create @allowItemProps))
    $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
    $siteMediaLibraryRoot | Set-ItemAcl -AccessRules $accessRules
    
    $tenantMediaLibrarySharedFolder = Get-Item -Path "$($tenantMediaPath)\shared"
    Write-Information "[A] $($tenantMediaLibrarySharedFolder.ItemPath)"
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:create @allowItemProps))
    $accessRules.AddRange((New-AccessRuleList -Identity $roleBase -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
    $tenantMediaLibrarySharedFolder | Set-ItemAcl -AccessRules $accessRules
    
    Write-Host "[Presentation Security]" -ForegroundColor Yellow
    $presentationItem = Get-Item -Path "$($sitePath)\Presentation"
    $presentationChildren = Get-ChildItem -Path $presentationItem.Paths.Path -Language $presentationItem.Language.Name
    foreach($pC in $presentationChildren){
        Write-Information "[A] $($pC.ItemPath)"
        if($roleDesignerExists) {
            $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
            $accessRules.AddRange((New-AccessRuleList -Identity $roleDesigner -AccessRule item:create,item:write @allowItemProps))
            $accessRules.AddRange((New-AccessRuleList -Identity $roleDesigner -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
            $pC | Set-ItemAcl -AccessRules $accessRules
        }
        
        $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
        $accessRules.AddRange((New-AccessRuleList -Identity $roleDeveloper -AccessRule item:create,item:write @allowItemProps))
        $accessRules.AddRange((New-AccessRuleList -Identity $roleDeveloper -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
        $pC | Set-ItemAcl -AccessRules $accessRules
        
        if($roleFrontEndExists) {
            $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
            $accessRules.AddRange((New-AccessRuleList -Identity $roleFrontEnd -AccessRule item:create,item:write @allowItemProps))
            $accessRules.AddRange((New-AccessRuleList -Identity $roleFrontEnd -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
            $pC | Set-ItemAcl -AccessRules $accessRules         
         }
    }
    
    Write-Host "[Theme Security]" -ForegroundColor Yellow
    $sourcePresPath = "/sitecore/media library/Themes/$($domainName)/$($tenantItem.Name)//*[@@templatename='Theme']"
    $tenantThemes = Get-Item -Path "master:" -Query $sourcePresPath -Language $tenantItem.Language.Name | Initialize-Item
    foreach($tTheme in $tenantThemes){
        Write-Information "[A] $($tTheme.ItemPath)"
        $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
        $accessRules.AddRange((New-AccessRuleList -Identity $roleAdmin -AccessRule item:create,item:write @allowItemProps))
        $accessRules.AddRange((New-AccessRuleList -Identity $roleAdmin -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
        $tTheme | Set-ItemAcl -AccessRules $accessRules

        $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
        $accessRules.AddRange((New-AccessRuleList -Identity $roleDeveloper -AccessRule item:create,item:write @allowItemProps))
        $accessRules.AddRange((New-AccessRuleList -Identity $roleDeveloper -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
        $tTheme | Set-ItemAcl -AccessRules $accessRules
        
        if($roleFrontEndExists) {
            $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
            $accessRules.AddRange((New-AccessRuleList -Identity $roleFrontEnd -AccessRule item:create,item:write @allowItemProps))
            $accessRules.AddRange((New-AccessRuleList -Identity $roleFrontEnd -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
            $tTheme | Set-ItemAcl -AccessRules $accessRules
        }
    }
    
    Write-Host "[Data Templates Security]" -ForegroundColor Yellow
    $settingsItem = Get-Item -Path "$($sitePath)\Settings"
    $tenantTemplatesItem = Get-Item master: -ID ($settingsItem.Fields['Templates'].Value)
    Write-Information "[A] $($tenantTemplatesItem.ItemPath)"
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $roleAdmin -AccessRule item:create @allowItemProps))
    $accessRules.AddRange((New-AccessRuleList -Identity $roleAdmin -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
    $tenantTemplatesItem | Set-ItemAcl -AccessRules $accessRules

    if($roleFrontEndExists) {
        $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
        $accessRules.AddRange((New-AccessRuleList -Identity $roleFrontEnd -AccessRule item:create @allowItemProps))
        $accessRules.AddRange((New-AccessRuleList -Identity $roleFrontEnd -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
        $tenantTemplatesItem | Set-ItemAcl -AccessRules $accessRules
    }
    
    $accessRules = New-Object Sitecore.Security.AccessControl.AccessRuleCollection
    $accessRules.AddRange((New-AccessRuleList -Identity $roleDeveloper -AccessRule item:create @allowItemProps))
    $accessRules.AddRange((New-AccessRuleList -Identity $roleDeveloper -AccessRule item:read,item:write,item:rename,item:create,item:delete @allowDescendantsProps))
    $tenantTemplatesItem | Set-ItemAcl -AccessRules $accessRules
}
```

```powershell
<#
    AccountType
    ar = Role
    au = User
    a?
    
    Propagation
    pd = Descendants
    pe = Entity
    p* = Any
    
    Rule Token
    ! = Deny Inheritance
    + = Allow Access
    - = Deny Access
    ^ = Allow Inheritance
#>

$InformationPreference = "Continue"

Import-Function -Name Setup-LanguageSecurity
Import-Function -Name Setup-PublishingTargetSecurity
Import-Function -Name Setup-SystemSecurity
Import-Function -Name Setup-TenantSecurity

$siteTemplateId = "{6669DC16-F106-44B5-96BE-7A31AE82B5B5}"
$tenantTemplateId = "{215F8C54-68B3-4481-A20B-A5716F06081F}"
$tenantFolderTemplateId = "{4F539F2E-9CF9-4453-8E82-3D13DED12AB3}"

filter Where-IsSxaSite {
    $siteItemTemplateId = "{6669DC16-F106-44B5-96BE-7A31AE82B5B5}"
    
    $siteContext = $_
    if([string]::IsNullOrEmpty($siteContext.RootPath)) { return }
    $siteItem = Get-Item -Path $siteContext.RootPath
    if($siteItem -eq $null) { return }
    $isSxaSite = [Sitecore.Data.Managers.TemplateManager]::GetTemplate($siteItem).InheritsFrom($siteItemTemplateId)
    if($isSxaSite) {
        $siteItem 
    }
}

$availableSiteItems = [Sitecore.Configuration.Factory]::GetSites() | Where-IsSxaSite
$siteLookup = @{}
$availableSiteOptions = [ordered]@{}
$availableSiteItems | Foreach-Object { 
    $title = "$($_.Parent.Parent.Name)\$($_.Parent.Name)\$($_.Name)"
    $availableSiteOptions["$($title)"] = $_.ID.ToString()
    $siteLookup[$_.ID.ToString()] = $_
}

$additionalDomainOptions = @{}
foreach($domain in Get-Domain) {
   $mappedDomain = [System.Web.Security.Membership]::Providers["switcher"].Wrappers.DomainMap[$domain.Name]
   if($mappedDomain) {
       $additionalDomainOptions[$domain.Name] = $domain.Name
   }
}

$props = @{
    Parameters = @(
        @{Name="selectedSite"; Title="Choose an available site"; Tooltip="The selected site will have new security settings applied."; Options=$availableSiteOptions; }
    )
    Title = "Setup Tenant Security"
    Icon = "OfficeWhite/32x32/lock2.png"
    Description = "Updates security for the site item and children."
    Width = 450
    Height = 300
    ShowHints = $true
}

if($additionalDomainOptions.Keys.Count -gt 0) {
    $props.Parameters += @{Name="additionalLanguageDomainNames"; Title="Additional Domains"; Tooltip="Domains detected to be associated with the switching provider. Users that need access may be in one of these domains."; Options=$additionalDomainOptions; Editor="checklist"; }
}

$result = Read-Variable @props
if($result -ne "ok") {
    exit
}

$siteItem = $siteLookup[$selectedSite]
$tenantItem = $siteItem.Parent
$tenantFolderItem = $tenantItem.Parent

$isSiteInherited = [Sitecore.Data.Managers.TemplateManager]::GetTemplate($siteItem.TemplateId, $siteItem.Database).InheritsFrom($siteTemplateId)
$isTenantInherited = [Sitecore.Data.Managers.TemplateManager]::GetTemplate($tenantItem.TemplateId, $tenantItem.Database).InheritsFrom($tenantTemplateId)
$isTenantFolderInherited = [Sitecore.Data.Managers.TemplateManager]::GetTemplate($tenantFolderItem.TemplateId, $tenantFolderItem.Database).InheritsFrom($tenantFolderTemplateId)
if($isSiteInherited -and $isTenantInherited -and $isTenantFolderInherited) {
    
    Setup-TenantSecurity -Company $tenantFolderItem.Name -Tenant $tenantItem.Name -Site $siteItem.Name
    Setup-PublishingTargetSecurity -Role "$($tenantFolderItem.Name.ToLower())\Editor"
    Setup-LanguageSecurity -Domain $tenantFolderItem.Name
    
    foreach($domainName in $additionalLanguageDomainNames) {
        Setup-LanguageSecurity -Domain $domainName
    }
    
    Setup-SystemSecurity

    Show-Alert -Title "Security configuration complete. <br/> Company: $($tenantFolderItem.Name) <br/> Tenant: $($tenantItem.Name) <br/> Site: $($siteItem.Name)"
    Show-Result -Text
} else {
    Show-Alert -Title "There was a problem detecting which site to configure security. Should follow the structure Company -> Tenant -> Site."
}
```

[View on GitHub Gist](https://gist.github.com/michaellwest/76a38c9501e960a439f5c72aaa62ed27)
