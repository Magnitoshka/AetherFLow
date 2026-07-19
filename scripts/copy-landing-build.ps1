$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$packageJson = Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json
$version = $packageJson.version
$source = Join-Path $root "release\AetherFlow Setup $version.exe"
$targetDir = Join-Path $root "landing-builds"
$latestTarget = Join-Path $targetDir "AetherFlow-Setup-latest.exe"
$versionedTarget = Join-Path $targetDir "AetherFlow-Setup-$version.exe"
$manifestTarget = Join-Path $targetDir "manifest.json"

if (!(Test-Path $source)) {
  throw "Installer not found: $source. Run npm run dist first."
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item -Force -Path $source -Destination $latestTarget
Copy-Item -Force -Path $source -Destination $versionedTarget

$file = Get-Item $latestTarget
$manifest = [ordered]@{
  product = "AetherFlow"
  version = $version
  file = $file.Name
  versionedFile = (Split-Path $versionedTarget -Leaf)
  sizeBytes = $file.Length
  generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$manifest | ConvertTo-Json | Set-Content -Encoding UTF8 $manifestTarget

Write-Host "Landing build exported:"
Write-Host " - $latestTarget"
Write-Host " - $versionedTarget"
Write-Host " - $manifestTarget"
