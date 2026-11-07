# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend assets from builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure persistent SQLite data directory exists
RUN mkdir -p /app/backend/data

EXPOSE 5000

CMD ["node", "backend/src/server.js"]

