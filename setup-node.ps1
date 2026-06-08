# PowerShell Script to download and configure a portable Node.js and NPM environment for PrecificaPro
# Run this script to bootstrap the project on Windows.

$projectRoot = 'C:\Users\Pichau\.gemini\antigravity\scratch\marketplace-pricing-saas'
$binDir = Join-Path $projectRoot 'bin'
$nodeTargetDir = Join-Path $binDir 'node'
$nodeExe = Join-Path $nodeTargetDir 'node.exe'

Write-Host '============================================='
Write-Host '   PRECIFA PRO - BOOTSTRAP ENVIRONMENT'
Write-Host '============================================='

# Ensure bin directory exists
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir | Out-Null
    Write-Host 'Created bin directory'
}

# Clean any previous broken installations
if (Test-Path $nodeTargetDir) {
    Write-Host 'Removing previous node folder to prevent conflicts...'
    Remove-Item -Recurse -Force $nodeTargetDir | Out-Null
}

$url = 'https://nodejs.org/dist/v22.12.0/node-v22.12.0-win-x64.zip'
$zipPath = Join-Path $binDir 'node.zip'

if (-not (Test-Path $zipPath)) {
    Write-Host 'Downloading portable Node.js LTS...'
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UserAgent 'Mozilla/5.0' -TimeoutSec 300
        Write-Host 'Download completed.'
    } catch {
        Write-Host 'Failed to download Node.js.'
        exit 1
    }
} else {
    Write-Host 'Zip file already downloaded.'
}

Write-Host 'Extracting archive...'
$extractTemp = Join-Path $binDir 'node_temp'
if (Test-Path $extractTemp) {
    Remove-Item -Recurse -Force $extractTemp | Out-Null
}

try {
    Expand-Archive -Path $zipPath -DestinationPath $extractTemp -Force
    Write-Host 'Archive extracted.'
} catch {
    Write-Host 'Failed to extract archive.'
    exit 1
}

# Re-organize directory structure
$extractedSubDir = Get-ChildItem -Path $extractTemp -Directory | Select-Object -First 1
if ($extractedSubDir) {
    Write-Host 'Renaming extracted folder to target destination...'
    Move-Item -Path $extractedSubDir.FullName -Destination $nodeTargetDir -Force
    Write-Host 'Clean up temporary files...'
    Remove-Item -Recurse -Force $extractTemp | Out-Null
    Remove-Item -Path $zipPath -Force | Out-Null
} else {
    Write-Host 'Could not find extracted subdirectory.'
    exit 1
}

if (Test-Path $nodeExe) {
    Write-Host '============================================='
    Write-Host ' Node.js portable installed successfully!'
    Write-Host ' Version details:'
    & $nodeExe --version
    $npmCmd = Join-Path $nodeTargetDir 'npm.cmd'
    & $npmCmd --version
    Write-Host '============================================='
} else {
    Write-Host 'Verification failed.'
    exit 1
}
