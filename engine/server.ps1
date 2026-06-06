# Serveur statique minimal pour prévisualiser le prototype (sert le dossier engine/).
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$port = 8731
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()
Write-Output "SERVER_UP http://localhost:$port/"
while ($true) {
  $client = $null
  try {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream(); $stream.ReadTimeout = 2000
    $reader = New-Object System.IO.StreamReader($stream)
    $req = $reader.ReadLine()
    if ([string]::IsNullOrEmpty($req)) { $client.Close(); continue }
    $path = "/"; if ($req -match '^GET\s+(\S+)\s') { $path = $Matches[1] }
    $rel = [System.Uri]::UnescapeDataString($path.Split('?')[0]).TrimStart('/')
    if ([string]::IsNullOrEmpty($rel)) { $rel = "conseil.html" }
    $full = Join-Path $root $rel
    if (Test-Path $full -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ctype = if ($ext -eq ".html") { "text/html; charset=utf-8" } elseif ($ext -eq ".js") { "text/javascript" } elseif ($ext -eq ".css") { "text/css" } else { "application/octet-stream" }
      $hdr = "HTTP/1.1 200 OK`r`nContent-Type: $ctype`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      $hb = [System.Text.Encoding]::ASCII.GetBytes($hdr)
      $stream.Write($hb, 0, $hb.Length); $stream.Write($bytes, 0, $bytes.Length); $stream.Flush()
    } else {
      $body = [System.Text.Encoding]::UTF8.GetBytes("404")
      $hdr = "HTTP/1.1 404 Not Found`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $hb = [System.Text.Encoding]::ASCII.GetBytes($hdr); $stream.Write($hb, 0, $hb.Length); $stream.Write($body, 0, $body.Length)
    }
  } catch {} finally { if ($client) { try { $client.Close() } catch {} } }
}
