FROM node:25-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@9.15.0

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --filter server...

COPY apps/server/prisma ./apps/server/prisma/
COPY apps/server/src ./apps/server/src/

WORKDIR /app/apps/server

CMD sh -c "npx prisma generate && npx prisma db push --skip-generate && node --watch --experimental-strip-types src/index.ts"
