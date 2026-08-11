# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
WORKDIR /app

COPY package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/operator/package.json ./apps/operator/
COPY sample-target/package.json ./sample-target/

RUN npm install --workspace=@conductor/contracts --workspace=@conductor/operator --include-workspace-root

COPY packages/contracts ./packages/contracts
COPY apps/operator ./apps/operator
COPY scripts ./scripts
COPY scenarios ./scenarios
COPY data ./data

RUN node ./node_modules/typescript/bin/tsc -p packages/contracts/tsconfig.json \
  && node ./node_modules/next/dist/bin/next build apps/operator

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

EXPOSE 8080

CMD ["sh", "-c", "node ./node_modules/next/dist/bin/next start apps/operator -H 0.0.0.0 -p ${PORT}"]
