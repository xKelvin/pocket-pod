FROM public.ecr.aws/docker/library/node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source code and build
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

# Remove dev dependencies for smaller image
RUN npm install --omit=dev && npm cache clean --force

EXPOSE 3000
CMD ["node", "dist/index.js"]