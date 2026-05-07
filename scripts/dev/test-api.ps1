Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$baseUrl = $env:CAMINO_API_URL
if ([string]::IsNullOrWhiteSpace($baseUrl)) {
  $baseUrl = 'http://localhost:3101'
}

$endpoints = @(
  '/api/liturgy/today',
  '/api/breviary/today',
  '/api/breviary/2026-05-06/compline'
)

foreach ($endpoint in $endpoints) {
  $url = "$baseUrl$endpoint"
  Write-Host ""
  Write-Host "GET $url"
  Invoke-RestMethod -Uri $url | ConvertTo-Json -Depth 12
}
