# Deploy Conductor Operator to GCP Cloud Run (x-saas)
# Usage:
#   .\deploy.ps1
#   .\deploy.ps1 -ApiKey "your-key" -OpenRouterKey "sk-or-..."

param(
  [string]$ProjectId = "x-saas-488416",
  [string]$Region = "asia-south1",
  [string]$Service = "conductor-operator",
  [string]$Bucket = "conductor-operator-data-xsaas",
  [string]$ApiKey = "",
  [string]$OpenRouterKey = "",
  [string]$OpenRouterModel = "anthropic/claude-sonnet-4"
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "Project: $ProjectId / Region: $Region / Service: $Service"

gcloud config set project $ProjectId | Out-Null
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com storage.googleapis.com --project $ProjectId | Out-Null

$bucketUri = "gs://$Bucket"
gcloud storage buckets describe $bucketUri --project $ProjectId 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating bucket $Bucket ..."
  gcloud storage buckets create $bucketUri --project $ProjectId --location $Region --uniform-bucket-level-access
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Bucket unavailable; deploying without GCS_BUCKET (ephemeral store)."
    $Bucket = ""
  }
}

$envList = New-Object System.Collections.Generic.List[string]
$envList.Add("LLM_PROVIDER=openrouter")
$envList.Add("OPENROUTER_MODEL=$OpenRouterModel")
$envList.Add("CODING_ROLE_LABEL=Claude Code path")
$envList.Add("DEMO_MODE=true")

if ($Bucket -ne "") {
  $envList.Add("GCS_BUCKET=$Bucket")
  $envList.Add("GCS_OBJECT=store.json")
}
if ($ApiKey -ne "") {
  $envList.Add("CONDUCTOR_API_KEY=$ApiKey")
}
if ($OpenRouterKey -ne "") {
  $envList.Add("OPENROUTER_API_KEY=$OpenRouterKey")
}

$setEnv = [string]::Join(",", $envList)

Write-Host "Deploying Cloud Run from source (this can take several minutes)..."
gcloud run deploy $Service `
  --project $ProjectId `
  --region $Region `
  --source . `
  --allow-unauthenticated `
  --port 8080 `
  --memory 1Gi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 3 `
  --set-env-vars $setEnv

if ($LASTEXITCODE -ne 0) {
  Write-Error "gcloud run deploy failed"
  exit $LASTEXITCODE
}

$url = gcloud run services describe $Service --project $ProjectId --region $Region --format "value(status.url)"
Write-Host "Live URL: $url"

if ($Bucket -ne "") {
  $projNumber = gcloud projects describe $ProjectId --format "value(projectNumber)"
  $sa = "$projNumber-compute@developer.gserviceaccount.com"
  gcloud storage buckets add-iam-policy-binding $bucketUri --member="serviceAccount:$sa" --role="roles/storage.objectAdmin" --project $ProjectId 2>$null
}

gcloud run services update $Service --project $ProjectId --region $Region --update-env-vars "CONDUCTOR_PUBLIC_URL=$url" | Out-Null

Write-Host ""
Write-Host "Smoke:"
Write-Host "  curl $url/api/overview"
Write-Host "  curl -X POST $url/api/demo/seed -H content-type:application/json -d {\"runWorkerSim\":true}"
