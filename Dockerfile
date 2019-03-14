FROM openjdk:8-jdk-alpine
COPY ./backend/server.jar /app/
ENTRYPOINT ["java","-jar","/app/server.jar"]
