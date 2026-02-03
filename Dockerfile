# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first properly to leverage cache
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript to dist
RUN npm run build

# Production Stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose API port
EXPOSE 3100

# Start command (Run migrations deploy if needed, then start)
# Note: In a real prod env, you typically run migrations in a separate release step.
CMD ["node", "dist/index.js"]
