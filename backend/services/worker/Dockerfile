FROM public.ecr.aws/docker/library/node:20-slim

# Install ffmpeg for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

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

CMD ["node", "dist/index.js"] 