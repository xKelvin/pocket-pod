FROM public.ecr.aws/docker/library/node:20-slim

# Install ffmpeg, Chromium (ARM64) and required libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 libatk1.0-0 libgbm1 libgtk-3-0 \
    libnss3 libxss1 libasound2 libxcomposite1 libxdamage1 libxrandr2 \
    libx11-xcb1 libxcb1 libdrm2 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Prevent Puppeteer from downloading the x86 Chrome build; we installed the right binary above
ENV PUPPETEER_SKIP_BROWSER_DOWNLOAD=1 \
    CHROME_BIN=/usr/bin/chromium

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