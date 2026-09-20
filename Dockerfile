FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN tr -d '\r' < mvnw > mvnw.clean && mv mvnw.clean mvnw && chmod +x mvnw && ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
