# Production Container for AccessIQ (Full Stack + Playwright Chromium Engine)
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV CI=true

# 1. Copy package definitions for efficient layer caching
COPY package*.json ./
COPY types/package*.json ./types/
COPY scanner/package*.json ./scanner/
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY tsconfig*.json ./

# 2. Install all monorepo dependencies (including devDependencies needed for build)
RUN npm ci

# 3. Ensure matching Chromium browser executable is installed
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install --with-deps chromium

# 4. Copy Prisma schema and generate client
COPY server/prisma ./server/prisma
RUN npx prisma generate --schema=./server/prisma/schema.prisma

# 4. Copy source code and demo pages
COPY types ./types
COPY scanner ./scanner
COPY server ./server
COPY client ./client
COPY demo-pages ./demo-pages

# 5. Build all packages: types -> scanner -> server -> client
RUN npx tsc -b --clean && npx tsc -b && npm run build -w client && test -f /app/server/dist/index.js

# 6. Initialize database schema, ensure tables exist, and grant write permissions
ENV PORT=8080
ENV NODE_ENV=production
ENV DATABASE_URL="file:../data/accessiq.db"

RUN mkdir -p /app/data /app/server/data && \
    npx prisma db push --schema=./server/prisma/schema.prisma --accept-data-loss && \
    chmod -R 777 /app/data /app/server/data

# Expose standard Cloud Run port
EXPOSE 8080

# 7. Start unified server (handles API, Playwright scans, and serves static React frontend)
CMD ["npm", "start", "-w", "server"]
