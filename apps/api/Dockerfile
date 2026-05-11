# ─── Build stage ───────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /repo

RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/

RUN pnpm install --frozen-lockfile=false

COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Build the workspace packages to JS first so node_modules contains compiled
# .js (Node 22 refuses to strip TS types in files under node_modules).
RUN pnpm --filter @tadhealth/shared build && \
    pnpm --filter @tadhealth/db build && \
    pnpm --filter @tadhealth/api build

# Prune dev dependencies for the production image. --legacy is required
# starting in pnpm v10 because workspaces aren't using inject-workspace-packages.
RUN pnpm --filter @tadhealth/api deploy --legacy --prod /out

# ─── Runtime stage ─────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./package.json
COPY --from=build /repo/apps/api/dist ./dist

EXPOSE 3001
CMD ["node", "dist/server.js"]