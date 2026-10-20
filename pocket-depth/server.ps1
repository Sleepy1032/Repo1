# Serves this folder at http://localhost:8642/ so Pocket Depth runs in the browser.
# Uses only what ships with Windows. Close this window to stop it.

$ErrorActionPreference = "Stop"
$port = 8642
$url = "http://localhost:$port/"
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)

$types = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript"; ".mjs" = "text/javascript"
  ".json" = "application/json"; ".webmanifest" = "application/manifest+json"; ".wasm" = "application/wasm"
  ".onnx" = "application/octet-stream"; ".png" = "image/png"; ".svg" = "image/svg+xml"
  ".css" = "text/css"; ".txt" = "text/plain; charset=utf-8"; ".md" = "text/plain; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
try { $listener.Start() }
catch {
  # Most likely already running in another window.
  try { Start-Process $url } catch {}
  exit
}

Write-Host "Pocket Depth is running at $url"
Write-Host "Keep this window open while you use it. Close it to stop."
try { Start-Process $url } catch { Write-Host "Open $url in your browser." }

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
    if ($path -eq "") { $path = "index.html" }
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $path))
    if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
      $res.StatusCode = 404
    } else {
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
      $res.AddHeader("Cache-Control", "no-cache")
      $stream = [System.IO.File]::OpenRead($file)
      try {
        $res.ContentLength64 = $stream.Length
        if ($ctx.Request.HttpMethod -ne "HEAD") { $stream.CopyTo($res.OutputStream) }
      } finally { $stream.Dispose() }
    }
  } catch {
    # The browser closed the connection early; nothing to do.
  } finally {
    try { $res.Close() } catch {}
  }
}
