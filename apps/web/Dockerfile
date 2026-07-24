FROM node:22-slim
RUN npm install -g pnpm@9.15.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --filter web...

COPY apps/web/next.config.ts ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/postcss.config.mjs ./apps/web/
COPY apps/web/src ./apps/web/src/

WORKDIR /app/apps/web

CMD ["pnpm", "dev"]
