# Clean build script for Windows PowerShell
# Removes all build artifacts and caches
# Run this before rebuilding to ensure no stale artifacts

Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Cyan

# Remove build output
if (Test-Path "docs") { Remove-Item -Recurse -Force "docs" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "node_modules\.vite") { Remove-Item -Recurse -Force "node_modules\.vite" }

# Remove Vite cache
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }

# Remove lock file (optional - uncomment if you want to reinstall from scratch)
# if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }

Write-Host "✅ Clean complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. npm install (if you removed package-lock.json)"
Write-Host "2. npm run build"




