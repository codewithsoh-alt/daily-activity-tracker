# Multi-stage Dockerfile for Daily Activity Tracker
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy backend files
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/backend/target/activity-tracker-backend-*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
