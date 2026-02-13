# Multi-stage build for smaller production image
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Development dependencies stage
FROM base AS deps
RUN npm ci

# Production dependencies stage
FROM base AS prod-deps
RUN npm ci --omit=dev

# Build stage (Node.js doesn't need compilation, but good practice)
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeapp

# Create logs directory
RUN mkdir -p logs && chown nodeapp:nodejs logs

# Copy production deps and source
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

# Switch to non-root user
USER nodeapp

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "src/index.js"]
