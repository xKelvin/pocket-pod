# Pocket-Pod Backend 🎵

> Turn any article URL into a clean, downloadable audio episode in minutes.

## Architecture Overview

This backend implements a **containerized microservices architecture** using AWS ECS Fargate:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │───▶│      ALB        │───▶│  API Service    │
│   (Frontend)    │    │  (Port 80)      │    │  (Fargate)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                                      ▼
                                              ┌─────────────────┐
                                              │ Redis Streams   │
                                              │ (Job Queue)     │
                                              └─────────────────┘
                                                      │
                                                      ▼
                                              ┌─────────────────┐
                                              │ Worker Service  │
                                              │ (Fargate 0-N)   │
                                              │ • TTS + ffmpeg  │
                                              └─────────────────┘
                                                      │
                                                      ▼
                                              ┌─────────────────┐
                                              │ S3 + DynamoDB   │
                                              │ (Storage)       │
                                              └─────────────────┘
```

## Services

### 🚀 API Service
- **Technology**: Express.js + TypeScript
- **Container**: `services/api/`
- **Resources**: 256 CPU, 512MB RAM
- **Endpoints**: 
  - `GET /health` - Health check
  - `GET /` - Service info
  - `POST /jobs` - Create new podcast job (TODO)
  - `GET /jobs/:id` - Get job status (TODO)

### 🎵 Worker Service
- **Technology**: Node.js + TypeScript + ffmpeg
- **Container**: `services/worker/`
- **Resources**: 1024 CPU, 2048MB RAM
- **Capabilities**:
  - HTML article extraction (Readability.js)
  - Text-to-speech (AWS Polly)
  - Audio concatenation (ffmpeg)
  - S3 upload

### 🏗️ Infrastructure
- **VPC**: 2 AZs, public/private subnets, single NAT gateway
- **ECS Cluster**: Fargate launch type with Container Insights
- **Load Balancer**: Application Load Balancer for API service
- **Database**: DynamoDB for job metadata
- **Queue**: Redis ElastiCache for job queue
- **Storage**: S3 for podcast episodes

## Development

### Prerequisites
- Node.js 20+
- Docker (for containerization)
- AWS CLI configured (for deployment)

### Setup
```bash
# Install dependencies
npm install

## Project Structure

```
backend/
├── infra/                    # CDK infrastructure code
│   ├── main.ts              # CDK app entry point
│   └── stacks/
│       └── BackendStack.ts  # Main infrastructure stack
├── services/                # Microservices
│   ├── api/                 # API service
│   │   ├── src/
│   │   │   └── index.ts    # Express.js server
│   │   ├── Dockerfile
│   │   └── package.json
│   └── worker/              # Worker service
│       ├── src/
│       │   └── index.ts    # Job processor
│       ├── Dockerfile
│       └── package.json
├── scripts/
│   └── dev.sh              # Development helper script
├── tsconfig.json           # Root TypeScript config
└── tsconfig.base.json      # Shared TypeScript config
```

## Deployment

### First-time Setup
```bash
# Bootstrap CDK (one-time)
npx cdk bootstrap

# Deploy infrastructure
npm run cdk deploy
```

### Subsequent Deployments
```bash
# Build and deploy
npm run build
npm run cdk deploy
```

## Environment Variables

### API Service
- `NODE_ENV`: production/development
- `PORT`: Server port (3000)
- `DYNAMODB_TABLE`: DynamoDB table name
- `REDIS_URL`: Redis connection string

### Worker Service
- `NODE_ENV`: production/development
- `DYNAMODB_TABLE`: DynamoDB table name
- `S3_BUCKET`: S3 bucket name
- `REDIS_URL`: Redis connection string
- `AWS_REGION`: AWS region

## Key CDK Concepts Learned

1. **Fargate Services**: Serverless containers that scale automatically
2. **Task Definitions**: Container blueprints with CPU/memory specs
3. **VPC Configuration**: Network isolation with public/private subnets
4. **Load Balancer Integration**: Automatic service discovery and health checks
5. **IAM Roles**: Fine-grained permissions for each service
6. **Container Images**: CDK builds and deploys Docker images automatically

## Cost Optimization

- **Single NAT Gateway**: Reduces networking costs
- **Fargate Spot**: Use spot instances for worker tasks
- **Auto-scaling**: Workers scale to 0 when no jobs
- **Pay-per-request**: DynamoDB billing mode
- **S3 Standard**: Cost-effective storage for episodes

## Security Features

- **Private Subnets**: Workers run in isolated network
- **Security Groups**: Restricted network access
- **IAM Roles**: Least-privilege permissions
- **VPC Endpoints**: Private AWS service access (optional)
- **Load Balancer**: SSL termination and WAF integration ready

---