# Simplified single-stage build to avoid corruption issues
FROM node:22

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code (including server files)
COPY . ./

# Build the frontend
RUN npm run build

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Go back to app root
WORKDIR /app

EXPOSE 3000

CMD ["node", "server/server.js"]
