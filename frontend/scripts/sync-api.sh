#!/bin/bash
set -e

# Boot the backend (assumes docker-compose.dev.yml is in repo root)
docker-compose -f ../../docker-compose.dev.yml up -d postgres redis gateway authservice questionservice aiservice

# Wait for services to be healthy
sleep 10

# Generate types from each service's springdoc endpoint
npx openapi-typescript http://localhost:8081/v3/api-docs -o src/types/auth.ts
npx openapi-typescript http://localhost:8082/v3/api-docs -o src/types/questions.ts
npx openapi-typescript http://localhost:8083/v3/api-docs -o src/types/ai.ts

# Typecheck
npx tsc --noEmit

# Block `as any` bypasses
if grep -r "as any" src/ --include="*.ts" --include="*.tsx"; then
  echo "ERROR: Found 'as any' bypasses."
  exit 1
fi
