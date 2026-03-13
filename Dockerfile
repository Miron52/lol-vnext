# ── Stage 1: Build ──────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files and workspace structure
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/

# Install all dependencies (workspaces)
RUN npm install --ignore-scripts

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/api/ packages/api/

# Build shared first, then API
RUN npm run build -w packages/shared
RUN cd packages/api && npx nest build

# ── Stage 2: Production ────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy root package files
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/

# Install production dependencies only
RUN npm install --omit=dev --ignore-scripts

# Copy built code from builder
COPY --from=builder /app/packages/shared/ packages/shared/
COPY --from=builder /app/packages/api/dist/ packages/api/dist/
COPY packages/api/nest-cli.json packages/api/

# Copy migrations (needed at runtime)
COPY packages/api/src/database/migrations/ packages/api/dist/database/migrations/

EXPOSE 3001

ENV API_PORT=3001

CMD ["node", "packages/api/dist/main.js"]
