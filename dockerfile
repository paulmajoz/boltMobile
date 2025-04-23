# Stage 1: Build the Angular app
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci
RUN npm install -g @angular/cli

COPY . .
RUN npm run build --configuration=production

# Stage 2: Serve using a simple HTTP server
FROM node:18-alpine

RUN npm install -g http-server
WORKDIR /usr/src/app

# 👇 NOTE: Adjust the path based on your real output folder
COPY --from=build /app/dist/demo/browser .

EXPOSE 8090
CMD ["http-server", "-p", "8090", "-a", "0.0.0.0", "-c-1"]

