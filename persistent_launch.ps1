$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath reverse tcp:8089 tcp:8089
& $adbPath reverse tcp:8081 tcp:8081

docker-compose up -d

$jobs = @()
$jobs += Start-Job { cd C:\Users\duahf\OneDrive\Documents\GitHub\JobPrep_Group80\eureka; mvn spring-boot:run }
Start-Sleep -Seconds 15

$jobs += Start-Job { cd C:\Users\duahf\OneDrive\Documents\GitHub\JobPrep_Group80\gateway; mvn spring-boot:run }
Start-Sleep -Seconds 10

$services = "authservice\authservice", "questionservice\questionservice", "practiceservice\practiceservice", "sessionservice", "aiservice\aiservice", "notificationservice"
foreach ($s in $services) {
    $jobs += Start-Job -ScriptBlock {
        param($path)
        cd $path; mvn spring-boot:run
    } -ArgumentList "C:\Users\duahf\OneDrive\Documents\GitHub\JobPrep_Group80\$s"
    Start-Sleep -Seconds 5
}

$jobs += Start-Job { cd C:\Users\duahf\OneDrive\Documents\GitHub\JobPrep_Group80\frontend; npm start }

Write-Host "All services started. Keeping script alive."
Wait-Job $jobs
