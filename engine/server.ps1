# Serveur statique minimal pour tester la plateforme en local (sert le dossier engine/).
# Usage :  powershell -NoProfile -ExecutionPolicy Bypass -File server.ps1 [-Port 8731]
# Puis ouvre http://localhost:<port>/  (le menu). 100% PowerShell, aucun Node requis.
param([int]$Port = 8731)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Output "SERVER_UP http://localhost:$Port/"
$mime = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript"; ".css" = "text/css";
  ".svg" = "image/svg+xml"; ".json" = "application/json"; ".webmanifest" = "application/manifest+json";
  ".png" = "image/png"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"; ".gif" = "image/gif";
  ".ico" = "image/x-icon"; ".webp" = "image/webp"; ".md" = "text/markdown; charset=utf-8";
  ".woff2" = "font/woff2"; ".txt" = "text/plain; charset=utf-8"; ".ts" = "text/plain; charset=utf-8"
}
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
    if ([string]::IsNullOrEmpty($rel)) { $rel = "monde.html" }   # on arrive sur le Village (plateforme centrale)
    # sécurité : interdire de remonter hors du dossier servi
    $full = Join-Path $root $rel
    $fullResolved = [System.IO.Path]::GetFullPath($full)
    if (-not $fullResolved.StartsWith([System.IO.Path]::GetFullPath($root))) { $full = Join-Path $root "index.html" }
    if (Test-Path $full -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ctype = $mime[$ext]; if (-not $ctype) { $ctype = "application/octet-stream" }
      $hdr = "HTTP/1.1 200 OK`r`nContent-Type: $ctype`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      $hb = [System.Text.Encoding]::ASCII.GetBytes($hdr)
      $stream.Write($hb, 0, $hb.Length); $stream.Write($bytes, 0, $bytes.Length); $stream.Flush()
    } else {
      $body = [System.Text.Encoding]::UTF8.GetBytes("404 - introuvable : $rel")
      $hdr = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $hb = [System.Text.Encoding]::ASCII.GetBytes($hdr); $stream.Write($hb, 0, $hb.Length); $stream.Write($body, 0, $body.Length)
    }
  } catch {} finally { if ($client) { try { $client.Close() } catch {} } }
}
