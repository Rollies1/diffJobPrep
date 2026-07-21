$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath reverse tcp:8089 tcp:8089
& $adbPath reverse tcp:8081 tcp:8081

docker-compose up -d

Write-Host "Starting Eureka..."
$eProc = Start-Process cmd -ArgumentList "/c cd eureka && mvn spring-boot:run -Dmaven.test.skip=true < NUL > eureka.log 2>&1" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 20

Write-Host "Starting Gateway..."
$gProc = Start-Process cmd -ArgumentList "/c cd gateway && mvn spring-boot:run -Dmaven.test.skip=true < NUL > gateway.log 2>&1" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 10

$env:DATABASE_USER="jobprep"
$env:DATABASE_PASSWORD="devpassword"
$env:DATABASE_URL="jdbc:postgresql://localhost:5432/jobprep"

$services = "authservice\authservice", "questionservice\questionservice", "practiceservice\practiceservice", "sessionservice", "aiservice\aiservice", "notificationservice"
$procs = @($eProc, $gProc)

foreach ($s in $services) {
    $name = ($s -split '\\')[0]
    Write-Host "Starting $name..."
    $p = Start-Process cmd -ArgumentList "/c cd $s && mvn spring-boot:run -Dmaven.test.skip=true < NUL > ..\..\$name.log 2>&1" -WindowStyle Hidden -PassThru
    $procs += $p
    Start-Sleep -Seconds 5
}

Write-Host "Starting Frontend..."
Remove-Item Env:\EXPO_OFFLINE -ErrorAction SilentlyContinue
Set-Location -Path "$PSScriptRoot\frontend"
npm start -- --clear
