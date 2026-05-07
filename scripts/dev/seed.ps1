Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

node packages/db/scripts/apply-migrations.cjs
node packages/db/scripts/seed-santoral.cjs
