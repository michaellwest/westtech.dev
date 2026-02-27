$feedPath = "C:\Projects\github\westtech-dev\takeout-20260227T041842Z-3-001\Takeout\Blogger\Blogs\something to know\feed.atom"
$atom = [xml](Get-Content $feedPath -Encoding UTF8)

$ns = New-Object System.Xml.XmlNamespaceManager($atom.NameTable)
$ns.AddNamespace("atom", "http://www.w3.org/2005/Atom")
$ns.AddNamespace("blogger", "http://schemas.google.com/blogger/2018")

$entries = $atom.SelectNodes("//atom:entry", $ns)

$posts = foreach ($e in $entries) {
    $type = $e.SelectSingleNode("blogger:type", $ns).'#text'
    if ($type -ne 'POST') { continue }

    $title    = $e.SelectSingleNode("atom:title", $ns).'#text'
    $pub      = $e.SelectSingleNode("atom:published", $ns).'#text'.Substring(0, 10)
    $status   = $e.SelectSingleNode("blogger:status", $ns).'#text'
    $filename = $e.SelectSingleNode("blogger:filename", $ns).'#text'
    $cats     = $e.SelectNodes("atom:category", $ns) | ForEach-Object { $_.GetAttribute("term") }

    [PSCustomObject]@{
        Published = $pub
        Status    = $status
        Title     = $title
        Filename  = $filename
        Tags      = ($cats -join ", ")
    }
}

$posts | Sort-Object Published | Format-Table -AutoSize -Wrap
