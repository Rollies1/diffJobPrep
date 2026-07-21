# Build stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw package -B -DskipTests && \
    mkdir -p target/dependency && \
    (cd target/dependency; jar -xf ../*.jar)

# Runtime stage
FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL org.opencontainers.image.title="Session Service"
LABEL org.opencontainers.image.description="CodeQuest Session Management Service"
LABEL org.opencontainers.image.source="https://github.com/${GITHUB_REPOSITORY}"
LABEL org.opencontainers.image.revision="${VCS_REF}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /build/target/dependency/BOOT-INF/lib /app/lib
COPY --from=builder /build/target/dependency/META-INF /app/META-INF
COPY --from=builder /build/target/dependency/BOOT-INF/classes /app

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Updated ENTRYPOINT to match correct class name 'SessionserviceApplication'
ENTRYPOINT ["java", "-cp", "/app:/app/lib/*", "com.knust.codequest.sessionservice.SessionserviceApplication"]
