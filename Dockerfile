# Simplified single-stage build to avoid corruption issues
FROM node:22

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . ./

# Build the frontend
RUN npm run build

# Install server dependencies
WORKDIR /app/server
COPY server/package.json ./
RUN npm install

# Copy server source code
COPY server/ ./

# Go back to app root
WORKDIR /app

EXPOSE 3000

CMD ["node", "server/server.js"]
