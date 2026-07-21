@echo off
echo Starting Docker Containers...
docker-compose up -d

echo Starting Backend Microservices...
start cmd /k "cd eureka && mvn spring-boot:run"
timeout /t 10
start cmd /k "cd gateway && mvn spring-boot:run"
start cmd /k "cd authservice\authservice && mvn spring-boot:run"
start cmd /k "cd questionservice\questionservice && mvn spring-boot:run"
start cmd /k "cd practiceservice\practiceservice && mvn spring-boot:run"
start cmd /k "cd sessionservice && mvn spring-boot:run"
start cmd /k "cd aiservice\aiservice && mvn spring-boot:run"
start cmd /k "cd notificationservice && mvn spring-boot:run"

echo Forwarding port 8089 to physical USB device...
adb reverse tcp:8089 tcp:8089

echo Starting Frontend...
start cmd /k "cd frontend && npm start"
