FROM eclipse-temurin:17-jre-focal

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice-core libreoffice-writer libreoffice-common \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080

CMD ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar /app/app.jar"]