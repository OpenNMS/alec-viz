FROM openjdk:8-jdk-alpine
COPY ./backend/server.jar /app/
COPY ./frontend/dist/ /app/static/
VOLUME ["/dataset"]
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/server.jar"]
