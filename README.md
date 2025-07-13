🚧 日本語版の`README`に関しては、プロジェクは完成次第、追加させていただきます。

# Pocket Pod

> Turn any article into a clean, downloadable podcast episode – built as a learning exercise around AWS ECS, Redis Streams, and npm workspaces.

## Goal of the Project

This portfolio project exists first and foremost as a **learning playground**.  The focus areas are:

*  **AWS ECS Fargate** – container-native deployments without managing servers
*  **Infrastructure-as-Code (AWS CDK)** – repeatable, version-controlled infrastructure
*  **Redis Streams** – lightweight, high-throughput job queuing
*  **npm workspaces** – monorepo-friendly dependency management across services

## Architectural Overview

![Pocket Pod architecture](docs/infra.png)

The diagram shows the complete end-to-end flow from an authenticated request, to job queuing, worker processing with AWS Polly, and final asset storage in S3.

## Project Progress

### Backend

**Done** ✅

- [x] ECS cluster and supporting infrastructure defined with **AWS CDK**
- [x] Containerised **API** & **Worker** services
- [x] **Redis Streams** implementation for job dispatching
- [x] Job management APIs with persistence in **DynamoDB**

**To Do** 🔜

- [ ] GitHub OAuth token verification infrastructure
- [ ] Auto-scaling based on custom **CloudWatch** metrics
- [ ] Workers push status updates to **DynamoDB**
- [ ] Workers scrape articles, generate audio with **AWS Polly**, and upload to **S3**

### Frontend (upcoming)

- [ ] Authentication via **Auth.js** with GitHub provider
- [ ] CRUD UI for managing podcasts
- [ ] Direct streaming & listening experience for generated episodes

---

*Stay tuned – this README will evolve alongside the project!*
