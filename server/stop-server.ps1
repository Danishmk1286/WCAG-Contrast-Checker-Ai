# PowerShell script to stop the server running on port 3001
# Usage: .\stop-server.ps1

$PORT = 3001

Write-Host "🔍 Looking for server on port $PORT..." -ForegroundColor Yellow

$connection = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "🛑 Stopping server process: $($process.Name) (PID: $processId)" -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        
        # Verify it's stopped
        $check = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue
        if (-not $check) {
            Write-Host "✅ Server stopped successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Server may still be running" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Process $processId not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  No server found running on port $PORT" -ForegroundColor Cyan
}

