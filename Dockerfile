# Use Node.js LTS version
FROM node:20-slim AS base

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the frontend
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/sooq_al_ketab.db

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npx", "tsx", "server.ts"]
