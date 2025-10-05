# Stage 1: Build the frontend
FROM node:22 AS frontend-builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json ./
COPY package-lock.json* ./

# Install frontend dependencies
RUN npm install

# Copy source code
COPY . ./

# Create environment file
RUN echo "API_KEY=PLACEHOLDER" > ./.env
RUN echo "GEMINI_API_KEY=PLACEHOLDER" >> ./.env

# Debug: Show what files we have
RUN ls -la

# Debug: Show package.json contents
RUN cat package.json

# Build the frontend with verbose output
RUN npm run build --verbose

# Stage 2: Build the server
FROM node:22 AS server-builder

WORKDIR /app

# Copy server package files
COPY server/package.json ./
COPY server/package-lock.json* ./

# Install server dependencies
RUN npm install

# Copy server source code
COPY server/ ./

# Stage 3: Final production image
FROM node:22

WORKDIR /app

# Copy server files from server builder
COPY --from=server-builder /app ./

# Copy built frontend assets from frontend builder
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "server.js"]
