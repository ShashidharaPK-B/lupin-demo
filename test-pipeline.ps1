param([switch]$SkipTests)

$root = "C:\temp\lupin-demo"
Set-Location $root
$failed = @()

# Image that has both uv + Python 3.11
$UV_IMAGE = "ghcr.io/astral-sh/uv:python3.11-bookworm-slim"

function Pass($name) { Write-Host "  PASS  $name" -ForegroundColor Green }
function Fail($name, $msg) {
    Write-Host "  FAIL  $name" -ForegroundColor Red
    if ($msg) { Write-Host "        $msg" -ForegroundColor DarkRed }
    $script:failed += $name
}

Write-Host "`nCI Pipeline - Local Test Run" -ForegroundColor White
Write-Host "=============================" -ForegroundColor White

# Load .env into current process
if (Test-Path "$root\.env") {
    Get-Content "$root\.env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and (-not $line.StartsWith("#")) -and $line.Contains("=")) {
            $idx = $line.IndexOf("=")
            $key = $line.Substring(0, $idx).Trim()
            $val = $line.Substring($idx + 1).Trim()
            Set-Item "env:$key" $val
        }
    }
}

# ── Backend ───────────────────────────────────────────────────
Write-Host "`n--- Backend ---" -ForegroundColor Cyan

Write-Host "Installing backend dependencies (including dev)..."
docker run --rm -v "${root}\backend:/app" -w /app $UV_IMAGE uv sync 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { Pass "uv sync" } else { Fail "uv sync" "exit $LASTEXITCODE" }

Write-Host "Running ruff lint..."
$out = docker run --rm -v "${root}\backend:/app" -w /app $UV_IMAGE uv run ruff check app/ tests/ 2>&1
if ($LASTEXITCODE -eq 0) { Pass "ruff check" } else { Fail "ruff check" ($out | Out-String).Trim() }

Write-Host "Running ruff format check..."
$out = docker run --rm -v "${root}\backend:/app" -w /app $UV_IMAGE uv run ruff format --check app/ tests/ 2>&1
if ($LASTEXITCODE -eq 0) { Pass "ruff format" } else { Fail "ruff format" ($out | Out-String).Trim() }

if (-not $SkipTests) {
    Write-Host "Starting test Postgres on port 5433..."
    docker rm -f ci-postgres 2>$null | Out-Null
    docker run -d --name ci-postgres `
        -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=shouldcost_test `
        -p 5433:5432 postgres:16-alpine 2>&1 | Out-Null

    $ready = $false
    for ($i = 1; $i -le 30; $i++) {
        docker exec ci-postgres pg_isready -U user 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }

    if ($ready) {
        Write-Host "Running pytest..."
        # Write env file to avoid PowerShell quoting issues with special chars
        $testEnvFile = "$env:TEMP\ci-test.env"
        @"
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5433/shouldcost_test
AZURE_OPENAI_ENDPOINT=$env:AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_API_KEY=$env:AZURE_OPENAI_API_KEY
AZURE_OPENAI_DEPLOYMENT_NAME=$env:AZURE_OPENAI_DEPLOYMENT_NAME
AZURE_OPENAI_API_VERSION=$env:AZURE_OPENAI_API_VERSION
SECRET_KEY=$env:SECRET_KEY
UPLOAD_DIR=/tmp/uploads
CORS_ORIGINS=["http://localhost:3000"]
"@ | Set-Content $testEnvFile -Encoding utf8

        docker run --rm `
            -v "${root}\backend:/app" -w /app `
            --env-file $testEnvFile `
            --network host `
            $UV_IMAGE uv run pytest tests/ -v --cov=app --cov-report=term-missing

        Remove-Item $testEnvFile -Force -ErrorAction SilentlyContinue

        if ($LASTEXITCODE -eq 0) { Pass "pytest" } else { Fail "pytest" "exit $LASTEXITCODE" }
    } else {
        Fail "postgres startup" "Did not become ready in 30s"
    }

    Write-Host "Stopping test Postgres..."
    docker rm -f ci-postgres 2>$null | Out-Null
}

# ── Frontend ──────────────────────────────────────────────────
Write-Host "`n--- Frontend ---" -ForegroundColor Cyan

Write-Host "Installing frontend dependencies..."
docker run --rm -v "${root}\frontend:/app" -w /app node:20-alpine sh -c "npm ci --legacy-peer-deps 2>&1" | Out-Null
if ($LASTEXITCODE -eq 0) { Pass "npm ci" } else { Fail "npm ci" "exit $LASTEXITCODE" }

Write-Host "Running ESLint..."
$out = docker run --rm -v "${root}\frontend:/app" -w /app node:20-alpine sh -c "npm run lint 2>&1"
if ($LASTEXITCODE -eq 0) { Pass "eslint" } else { Fail "eslint" ($out | Out-String).Trim() }

# ── Summary ───────────────────────────────────────────────────
Set-Location $root
Write-Host "`n=============================" -ForegroundColor White
if ($failed.Count -eq 0) {
    Write-Host "  ALL STEPS PASSED" -ForegroundColor Green
} else {
    Write-Host "  FAILED: $($failed -join ', ')" -ForegroundColor Red
    exit 1
}
