FROM node:20-alpine

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

WORKDIR /app

# Copy workspace manifests and lockfile first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including devDependencies for the build step)
RUN pnpm install --frozen-lockfile

# Copy the full source
COPY . .

# Build workspace dependencies first, then the backend
RUN pnpm -r --filter @camino/backend... build

EXPOSE 3000

CMD ["node", "apps/backend/dist/index.js"]
