# RHMS Server Manager
Write-Host "========================================"
Write-Host "RHMS Rental House Management System"
Write-Host "========================================"
Write-Host ""

Write-Host "[1] Starting Backend Server..."
Start-Job -Name "BackendServer" -ScriptBlock {
    Set-Location "$PSScriptRoot\backend"
    python app.py
}

Write-Host "[2] Starting Frontend Server..."
Start-Sleep -Seconds 3
Start-Job -Name "FrontendServer" -ScriptBlock {
    Set-Location "$PSScriptRoot\frontend"
    npm run dev
}

Write-Host ""
Write-Host "========================================"
Write-Host "Servers are starting..."
Write-Host ""
Write-Host "Frontend: http://localhost:5176"
Write-Host "Admin Dashboard: http://localhost:5000/dashboard"
Write-Host ""
Write-Host "Press Ctrl+C to stop servers"

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "Stopping servers..."
    Stop-Job -Name "BackendServer" -Force
    Stop-Job -Name "FrontendServer" -Force
    Write-Host "Servers stopped."
}
