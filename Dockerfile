# ---- Build/Runtime Stage ----
FROM node:18-alpine

WORKDIR /usr/src/app

# Only copy package files first for caching
COPY package*.json ./
RUN npm ci --only=production || npm install --only=production

# Copy rest
COPY . .

# Health: run tests inside the container at build time? (We’ll run at runtime via Jenkins)
# Expose
EXPOSE 3000

CMD ["npm", "start"]
