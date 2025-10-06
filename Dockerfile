FROM node:22-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies
RUN npm install

# Install server dependencies
RUN cd server && npm install

# Build the frontend
RUN npm run build

EXPOSE 3001

CMD ["node", "server/server.js"]
