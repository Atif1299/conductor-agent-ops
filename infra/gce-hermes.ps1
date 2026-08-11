# Create / update GCE VM conductor-hermes and install Hermes + free OpenRouter bridge
# Run from project root: powershell -File infra/gce-hermes.ps1

param(
  [string]$ProjectId = "x-saas-488416",
  [string]$Zone = "asia-south1-a",
  [string]$Instance = "conductor-hermes",
  [string]$MachineType = "e2-small",
  [string]$OpenRouterKey = "",
  [string]$ConductorUrl = "https://conductor-operator-95044197271.asia-south1.run.app",
  [string]$ConductorKey = ""
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not $OpenRouterKey) {
  if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
      if ($_ -match '^\s*OPENROUTER_API_KEY=(.+)$') { $script:OpenRouterKey = $Matches[1].Trim() }
      if ($_ -match '^\s*CONDUCTOR_API_KEY=(.+)$') { $script:ConductorKey = $Matches[1].Trim() }
    }
  }
}
if (-not $ConductorKey -and (Test-Path ".env")) {
  Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*CONDUCTOR_API_KEY=(.+)$') { $script:ConductorKey = $Matches[1].Trim() }
  }
}

if (-not $OpenRouterKey) { throw "OPENROUTER_API_KEY required" }
if (-not $ConductorKey) { throw "CONDUCTOR_API_KEY required" }

Write-Host "Project $ProjectId Zone $Zone Instance $Instance"

gcloud config set project $ProjectId | Out-Null

# Ensure compute API (may already be on)
gcloud services enable compute.googleapis.com --project $ProjectId 2>$null

# Metadata with secrets (only on instance, not in git)
$startupPath = Join-Path $Root "infra\gce-startup.sh"
# Convert to LF for Linux
$raw = [System.IO.File]::ReadAllText($startupPath) -replace "`r`n", "`n"
$tmpStartup = Join-Path $env:TEMP "gce-startup-hermes.sh"
[System.IO.File]::WriteAllText($tmpStartup, $raw)

$exists = gcloud compute instances describe $Instance --zone $Zone --project $ProjectId 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Instance exists — updating metadata and resetting..."
  gcloud compute instances add-metadata $Instance --zone $Zone --project $ProjectId `
    --metadata-from-file=startup-script=$tmpStartup `
    --metadata="OPENROUTER_API_KEY=$OpenRouterKey,CONDUCTOR_PUBLIC_URL=$ConductorUrl,CONDUCTOR_API_KEY=$ConductorKey,OPENROUTER_MODEL=openrouter/free"
  # startup only on first boot — run remote install instead
  gcloud compute scp $tmpStartup "${Instance}:/tmp/gce-startup.sh" --zone $Zone --project $ProjectId
  gcloud compute ssh $Instance --zone $Zone --project $ProjectId --command "sudo OPENROUTER_API_KEY='$OpenRouterKey' CONDUCTOR_PUBLIC_URL='$ConductorUrl' CONDUCTOR_API_KEY='$ConductorKey' OPENROUTER_MODEL=openrouter/free bash /tmp/gce-startup.sh"
} else {
  Write-Host "Creating instance $Instance ..."
  gcloud compute instances create $Instance `
    --project $ProjectId `
    --zone $Zone `
    --machine-type $MachineType `
    --image-family=debian-12 `
    --image-project=debian-cloud `
    --boot-disk-size=30GB `
    --boot-disk-type=pd-balanced `
    --tags=conductor-hermes `
    --metadata="OPENROUTER_API_KEY=$OpenRouterKey,CONDUCTOR_PUBLIC_URL=$ConductorUrl,CONDUCTOR_API_KEY=$ConductorKey,OPENROUTER_MODEL=openrouter/free" `
    --metadata-from-file=startup-script=$tmpStartup `
    --scopes=cloud-platform
}

Write-Host "Waiting 90s for install..."
Start-Sleep -Seconds 90

Write-Host "Remote status:"
gcloud compute ssh $Instance --zone $Zone --project $ProjectId --command "systemctl is-active conductor-hermes-bridge.service; systemctl is-active hermes-gateway.service 2>/dev/null || echo hermes-gateway:skipped; /opt/conductor/health.sh 2>/dev/null || true; curl -sS -o /dev/null -w '%{http_code}' -X POST '$ConductorUrl/api/intake' -H 'content-type: application/json' -H 'X-Conductor-Key: $ConductorKey' -d '{\"message\":\"GCE hermes live\",\"source\":\"cron\"}' || true"

Write-Host "Done. Open Conductor: $ConductorUrl"
