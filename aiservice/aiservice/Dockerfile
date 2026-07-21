# Dockerfile for aiservice
# Context is the ROOT of the JobPrep_Group80 repo

FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Copy all POMs to resolve the Parent POM and dependencies correctly
COPY aiservice/aiservice/pom.xml aiservice/aiservice/
COPY authservice/authservice/pom.xml authservice/authservice/
COPY practiceservice/practiceservice/pom.xml practiceservice/practiceservice/
COPY questionservice/questionservice/pom.xml questionservice/questionservice/
COPY gateway/pom.xml gateway/

RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy only this module's source
COPY aiservice/aiservice/src ./aiservice/aiservice/src

# Build only this module
RUN ./mvnw clean package -pl aiservice/aiservice -am -DskipTests -B

# Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=builder /app/aiservice/aiservice/target/*.jar app.jar

# Install curl for healthcheck
RUN apk add --no-cache curl

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]