FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:resolve
COPY src ./src
RUN ./mvnw clean package -DskipTests
EXPOSE 8085
CMD ["java", "-jar", "target/cvservice-0.0.1-SNAPSHOT.jar"]