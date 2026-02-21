# PowerShell script to start the server with port conflict handling
# Usage: .\start-server.ps1

$PORT = 3001

Write-Host "🔍 Checking if port $PORT is in use..." -ForegroundColor Yellow

# Check if port is in use
$connection = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    Write-Host "⚠️  Port $PORT is already in use by process $processId" -ForegroundColor Red
    if ($process) {
        Write-Host "   Process: $($process.Name) (PID: $processId)" -ForegroundColor Yellow
        Write-Host ""
        $response = Read-Host "Do you want to kill this process and start the server? (y/n)"
        
        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-Host "🛑 Stopping process $processId..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            Write-Host "✅ Process stopped" -ForegroundColor Green
        } else {
            Write-Host "❌ Server start cancelled" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   Process not found. Attempting to free port..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
} else {
    Write-Host "✅ Port $PORT is available" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting server..." -ForegroundColor Cyan
Write-Host ""

# Start the server
node server.js

