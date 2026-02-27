---
title: "SPE Workflow Action using Slack Notifications"
created: "2017-06-19"
description: "Have you ever wondered how to notify a user about workflow changes to an item in Sitecore, but not through email?"
tags: ["sitecore", "powershell"]
source: "https://michaellwest.blogspot.com/2017/06/spe-workflow-action-using-slack.html"
migrated: true
---

Have you ever wondered how to notify a user about workflow changes to an item in Sitecore, but not through email? In this post I'll show you in a few steps how to send notifications to a user or channel in Slack when transitioning an item's workflow state in Sitecore.  
  

#### TL;DR;

1.  Setup a Slack authentication token [here](https://api.slack.com/custom-integrations/legacy-tokens). The documentation indicates there are some newer ways to acquire a token, but for now we'll go with the low effort approach.
2.  Setup the PSSlack module for PowerShell found [here](http://ramblingcookiemonster.github.io/PSSlack). Optionally, run **Install-Module PSSlack** from an elevated PowerShell console. Big thanks to [@pscookiemonster](https://twitter.com/pscookiemonster) for putting this together.
3.  Create a SPE workflow action like described [here](https://doc.sitecorepowershell.com/workflows.html).
4.  Update the script to send messages to Slack.
5.  Celebrate!

  

#### Example Notification

![](/images/posts/spe-workflow-action-using-slack-notifications/SNAG-0231.png)

  
  

#### Getting Started

  
  
Install the PSSlack module.  
  

![](/images/posts/spe-workflow-action-using-slack-notifications/SNAG-0232.png)

  
Create a new PowerShell script in Sitecore. Here I created one for Slack and another for email.  
  

![](/images/posts/spe-workflow-action-using-slack-notifications/SNAG-0233.png)

  
Write the necessary code to post into Slack  
  

```powershell
$workflowEvent = $SitecoreContextItem | Get-ItemWorkflowEvent | Select-Object -Last 1
$previousState = Get-Item -Path "master:" -ID $workflowEvent.OldState
$currentState = Get-Item -Path "master:" -ID $workflowEvent.NewState
$user = Get-User -Id $workflowEvent.User

$subject = "Review Needed in Sitecore"

$message = @"
<strong>Details:</strong><br/>
$($user.Profile.FullName) ($($user.Name)) has transitioned '$($SitecoreContextItem.DisplayName)' from <i>$($previousState.Name)</i> to <i>$($currentState.Name)</i>.
"@

if($workflowEvent.CommentFields -and ($comments = $workflowEvent.CommentFields["Comments"])) {
    $message += "<br/><br/><strong>Comments:</strong><br/>$($comments)"
}

$id = $SitecoreContextItem.ID.ToString().ToUpper()
$language = $SitecoreContextItem.Language.Name
$editUrl = "https://test.dev.local/sitecore/shell/sitecore/content/Applications/Content Editor.aspx?id=$($id)&amp;la=$($language)&amp;fo=$($id)"
$previewUrl = "https://test.dev.local/?sc_itemid=$($id)&amp;sc_mode=preview&amp;sc_lang=$($language)"
$message += "<br/><br/><a href='$($editUrl)'>Edit Item</a>"
$message += "<br/><br/><a href='$($previewUrl)'>Preview Item</a>"

Send-MailMessage -To test@test.com -From here@here.com -Subject $subject -SmtpServer localhost -Body $message -BodyAsHtml

Close-Window
```

```powershell
# http://ramblingcookiemonster.github.io/PSSlack
Import-Module -Name PSSlack

$token = "[REPLACE_TOKEN]"

$workflowEvent = $SitecoreContextItem | Get-ItemWorkflowEvent | Select-Object -Last 1
$previousState = Get-Item -Path "master:" -ID $workflowEvent.OldState
$currentState = Get-Item -Path "master:" -ID $workflowEvent.NewState
$user = Get-User -Id $workflowEvent.User

$subject = "Review Needed in Sitecore"

$message = "*Details:*\n$($user.Profile.FullName) ($($user.Name)) has transitioned '$($SitecoreContextItem.DisplayName)' from _$($previousState.Name)_ to _$($currentState.Name)_."

if($workflowEvent.CommentFields -and ($comments = $workflowEvent.CommentFields["Comments"])) {
    $message += "\n\n*Comments:*\n$($comments)"
}

$id = $SitecoreContextItem.ID.ToString().ToUpper()
$language = $SitecoreContextItem.Language.Name
$editUrl = "https://[REPLACE_SITECORE_URL]/sitecore/shell/sitecore/content/Applications/Content Editor.aspx?id=$($id)&amp;la=$($language)&amp;fo=$($id)"
$previewUrl = "https://[REPLACE_SITECORE_URL]/?sc_itemid=$($id)&amp;sc_mode=preview&amp;sc_lang=$($language)"

New-SlackMessageAttachment -Color $([System.Drawing.Color]::Blue) `
                           -Title "Preview Changes" `
                           -TitleLink $previewUrl `
                           -Text $message `
                           -Pretext $subject `
                           -AuthorName ($user.Profile.FullName) `
                           -AuthorIcon "[REPLACE_AVATAR_URL]" `
                           -Fallback "Please review and approve the changes at your earliest convenience." `
                           -MarkdownFields "text" |
New-SlackMessage -Channel '[REPLACE_CHANNEL_NAME]' -IconEmoji :heart: | Send-SlackMessage -Token $token

Close-Window
```

[View on GitHub Gist](https://gist.github.com/michaellwest/ed386f3bb6d85a6860595d9bc541e2f3)

Configure Workflow Action  
  

![](/images/posts/spe-workflow-action-using-slack-notifications/SNAG-0234.png)

  

![](/images/posts/spe-workflow-action-using-slack-notifications/SNAG-0235.png)

  

That's it!  
  
I hope you found this helpful. Feel free to reach out in the Slack channel **#module-spe** for help with the SPE module or just to say thanks. If you haven't already, signup [here](http://siteco.re/sitecoreslack).  
  
Also, check out this post on when to choose [Sitecore Slack and Sitecore Stack Exchange](http://www.sitecorenutsbolts.net/2017/06/14/Sitecore-Stack-Exchange-vs-Slack-What-should-I-use/).
