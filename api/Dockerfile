# Base stage
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Build stage
FROM base AS build
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --only=production --ignore-scripts
COPY --from=build /app/dist ./dist
# Also copy needed configurations and seeds for production/seeding
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/src/seeds ./src/seeds

EXPOSE 3000
CMD ["node", "dist/main"]
