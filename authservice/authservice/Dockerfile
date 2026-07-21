# Dockerfile for authservice
# Context is the ROOT of the JobPrep_Group80 repo

FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

COPY aiservice/aiservice/pom.xml aiservice/aiservice/
COPY authservice/authservice/pom.xml authservice/authservice/
COPY practiceservice/practiceservice/pom.xml practiceservice/practiceservice/
COPY questionservice/questionservice/pom.xml questionservice/questionservice/
COPY gateway/pom.xml gateway/

RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY authservice/authservice/src ./authservice/authservice/src

RUN ./mvnw clean package -pl authservice/authservice -am -DskipTests -B

# Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=builder /app/authservice/authservice/target/*.jar app.jar

RUN apk add --no-cache curl

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]