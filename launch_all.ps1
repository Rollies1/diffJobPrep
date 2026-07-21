$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
Write-Host "Reversing ports..."
& $adbPath reverse tcp:8089 tcp:8089
& $adbPath reverse tcp:8081 tcp:8081

Write-Host "Starting Docker (just in case)..."
docker-compose up -d

Write-Host "Starting Eureka..."
Start-Process powershell -ArgumentList "-Command", "cd eureka; mvn spring-boot:run > eureka.log 2>&1" -WindowStyle Hidden
Start-Sleep -Seconds 15

Write-Host "Starting Gateway..."
Start-Process powershell -ArgumentList "-Command", "cd gateway; mvn spring-boot:run > gateway.log 2>&1" -WindowStyle Hidden
Start-Sleep -Seconds 10

$services = "authservice\authservice", "questionservice\questionservice", "practiceservice\practiceservice", "sessionservice", "aiservice\aiservice", "notificationservice"
foreach ($s in $services) {
    $name = ($s -split '\\')[0]
    Write-Host "Starting $name..."
    Start-Process powershell -ArgumentList "-Command", "cd $s; mvn spring-boot:run > ..\..\$name.log 2>&1" -WindowStyle Hidden
    Start-Sleep -Seconds 5
}

Write-Host "Starting Frontend (Expo)..."
# We start Expo in a new visible window so the user can see the QR code and press 'a' for android
Start-Process cmd -ArgumentList "/c", "cd frontend && npm start" -WindowStyle Normal

Write-Host "All processes have been launched."
