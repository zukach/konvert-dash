#!/bin/sh

# Push schema to database
npx -w @konverrt/db prisma db push --accept-data-loss

# Start API on internal port 3001
API_PORT=3001 node apps/api/dist/main.js &

# Start Next.js on Railway's PORT (default 3000)
npx -w @konverrt/web next start -p ${PORT:-3000}
