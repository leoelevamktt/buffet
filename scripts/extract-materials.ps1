$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $root 'materials\originals'
$outFile = Join-Path $root 'src\sourceMaterials.ts'
$ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
$lf = [Environment]::NewLine
$tab = [char]9

function Get-DocxText([string]$Path) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
  try {
    $entry = $zip.GetEntry('word/document.xml')
    if (-not $entry) { throw "word/document.xml ausente em $Path" }
    $reader = New-Object System.IO.StreamReader($entry.Open())
    try { $raw = $reader.ReadToEnd() } finally { $reader.Dispose() }
    $xml = New-Object System.Xml.XmlDocument
    $xml.PreserveWhitespace = $true
    $xml.LoadXml($raw)
    $mgr = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $mgr.AddNamespace('w', $ns)
    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($p in $xml.SelectNodes('//w:body//w:p', $mgr)) {
      $buffer = New-Object System.Text.StringBuilder
      foreach ($node in $p.SelectNodes('.//w:t | .//w:tab | .//w:br', $mgr)) {
        if ($node.LocalName -eq 't') { [void]$buffer.Append($node.InnerText) }
        elseif ($node.LocalName -eq 'tab') { [void]$buffer.Append($tab) }
        elseif ($node.LocalName -eq 'br') { [void]$buffer.Append($lf) }
      }
      $line = $buffer.ToString().Trim()
      if ($line) { $lines.Add($line) }
    }
    return ($lines -join $lf)
  } finally { $zip.Dispose() }
}

$map = [ordered]@{
  'akela-infinity-2027' = 'cardapio-infinity-akela-2027.docx'
  'akela-prata-2027' = 'cardapio-prata-2027.docx'
  'akela-bronze-unit2' = 'cardapio-bronze.docx'
  'akela-churrasco-2027' = 'cardapio-churrasco-2027.docx'
  'akela-boteco-2027' = 'cardapio-boteco-2027.docx'
  'akela-space-rental-2027' = 'contrato-locacao-espaco-2027.docx'
}
$data = [ordered]@{}
foreach ($id in $map.Keys) {
  $fileName = $map[$id]
  $fullPath = Join-Path $sourceDir $fileName
  $data[$id] = [ordered]@{ fileName = $fileName; text = Get-DocxText $fullPath }
}
$json = $data | ConvertTo-Json -Depth 5 -Compress
$content = "export interface SourceMaterialText {" + $lf +
  "  fileName: string" + $lf +
  "  text: string" + $lf +
  "}" + $lf + $lf +
  "export const sourceMaterialTexts: Record<string, SourceMaterialText> = " + $json + $lf + $lf +
  "export const getSourceMaterialText = (id?: string) => id ? sourceMaterialTexts[id] : undefined" + $lf
[System.IO.File]::WriteAllText($outFile, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("Generated " + $outFile + " (" + (Get-Item $outFile).Length + " bytes)")
