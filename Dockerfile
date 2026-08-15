# Production Dockerfile for Next.js, SQLite, and Playwright
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

# Install dependencies first (for layer caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Generate Prisma client and build Next.js application
RUN npx prisma generate
RUN npm run build

# Expose Next.js server port
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Database path (point to the persistent mount path)
ENV DATABASE_URL="file:/data/dev.db"

# Create directory for persistent SQLite data
RUN mkdir -p /data

# Run database schema push on launch, then start Next.js
CMD npx prisma db push && npm run start
