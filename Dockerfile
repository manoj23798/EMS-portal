FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app
COPY backend/pom.xml .
COPY backend/src src

# Build the application
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Explicitly expose port 8080 (Render/Koyeb will map this automatically)
EXPOSE 8080

# Configure memory limits for Java to prevent crashing on free tiers
ENV JAVA_OPTS="-Xmx300m -Xms300m -XX:+UseSerialGC -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar --spring.profiles.active=prod"]
