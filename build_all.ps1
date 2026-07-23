$env:JAVA_HOME="C:\Users\duahf\.jdks\jdk-21\jdk-21.0.6+7"
$services = @("eureka", "gateway", "authservice\authservice", "questionservice\questionservice", "practiceservice\practiceservice", "sessionservice", "aiservice\aiservice", "notificationservice", "cvservice")

foreach ($svc in $services) {
    Write-Host "Building $svc..."
    Push-Location $svc
    mvn clean compile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to compile $svc" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}
Write-Host "All services compiled successfully!" -ForegroundColor Green
