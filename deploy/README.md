# 🚀 Mock-Lab Deployment Guide

This directory contains all deployment configurations and documentation for Mock-Lab.

## 📁 Directory Structure

```
deploy/
├── README.md                          # This file
├── docker/                            # Docker & Docker Compose deployments
│   ├── docker-compose.yml            # Production (separate services)
│   ├── docker-compose.monolith.yml   # Alternative (single service)
│   ├── Dockerfile.backend            # Backend container
│   ├── Dockerfile.frontend           # Frontend container
│   ├── Dockerfile.monolith           # Monolith container (for comparison)
│   ├── nginx.conf                    # Nginx config for frontend
│   ├── nginx-monolith.conf           # Nginx config for monolith
│   ├── supervisord.conf              # Supervisor config for monolith
│   ├── docker-test.sh                # Automated deployment test
│   └── Makefile                      # Convenient deployment commands
├── kubernetes/                        # Kubernetes (EKS) deployments
│   ├── README.md                     # Kubernetes deployment guide
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml.example
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── backend-hpa.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── ingress.yaml
│   ├── serviceaccount.yaml
│   └── pdb.yaml
├── aws-ecs/                           # AWS ECS (Fargate) deployments
│   ├── backend-task-definition.json
│   ├── frontend-task-definition.json
│   ├── monolith-task-definition.json
│   ├── cloudformation-template.yaml
│   └── deploy.sh
└── docs/                              # Deployment documentation
    ├── DEPLOYMENT.md                  # Docker deployment guide
    ├── DOCKER_QUICK_START.md          # Quick reference
    ├── DOCKER_SETUP_SUMMARY.md        # Complete Docker overview
    ├── EKS_DEPLOYMENT_GUIDE.md        # Kubernetes/EKS guide
    ├── ECS_DEPLOYMENT_GUIDE.md        # ECS/Fargate guide
    └── ARCHITECTURE_COMPARISON.md     # Why separate containers
```

---

## 🎯 Choose Your Deployment Method

### Local Development

**Docker Compose (Recommended)**
```bash
cd deploy/docker
docker-compose up -d --build
```
📖 [Full Guide](docker/README.md) | [Quick Start](docs/DOCKER_QUICK_START.md)

---

### AWS Cloud Deployments

#### Option 1: AWS ECS (Fargate) - Simplest ✅ Recommended

**Best for:** AWS-native, simple deployments, cost-sensitive projects

```bash
cd deploy/aws-ecs
./deploy.sh
```

**Monthly Cost:** ~$180-360
- No cluster fees
- Auto-scaling
- Simpler than Kubernetes

📖 [ECS Guide](docs/ECS_DEPLOYMENT_GUIDE.md)

---

#### Option 2: AWS EKS (Kubernetes) - Most Flexible

**Best for:** Kubernetes expertise, multi-cloud, complex microservices

```bash
cd deploy/kubernetes
kubectl apply -f .
```

**Monthly Cost:** ~$260-450
- $73/month cluster fee
- Portable to any K8s
- More features

📖 [EKS Guide](docs/EKS_DEPLOYMENT_GUIDE.md) | [K8s README](kubernetes/README.md)

---

## 🆚 Deployment Comparison

| Method | Complexity | Monthly Cost | Best For |
|--------|-----------|--------------|----------|
| **Docker Compose** | ⭐ Easy | $0 (local) | Development, testing |
| **AWS ECS** | ⭐⭐ Medium | $180-360 | Production (AWS-only) ✅ |
| **AWS EKS** | ⭐⭐⭐⭐ Advanced | $260-450 | Production (K8s needed) |

---

## 🏗️ Architecture: Separate vs Monolith

All deployment methods support **two approaches**:

### Separate Services (Recommended) ✅

```
Frontend Container (Nginx) + Backend Container (FastAPI)
```

**Benefits:**
- 50-55% cheaper at scale
- Independent scaling
- Faster deployments
- Better resource usage

### Monolith (Educational)

```
Single Container (Nginx + FastAPI + Supervisor)
```

**Use only for:**
- Learning Docker
- Very small deployments (<10 users)

📖 [Detailed Comparison](docs/ARCHITECTURE_COMPARISON.md)

---

## 🚀 Quick Start by Method

### Docker Compose (Local/Small VPS)

```bash
# 1. Setup environment
cd deploy/docker
cp ../../.env.example ../../.env
# Edit .env with your values

# 2. Deploy
docker-compose up -d --build

# 3. Access
# Frontend: http://localhost:3000
# Backend:  http://localhost:8001
```

**Commands:**
```bash
make up         # Start services
make down       # Stop services
make logs-f     # View logs
make test       # Run tests
make db-backup  # Backup database
```

---

### AWS ECS (Fargate)

```bash
# 1. Prerequisites
# - AWS CLI configured
# - RDS PostgreSQL created
# - Docker installed

# 2. Deploy
cd deploy/aws-ecs
./deploy.sh

# 3. Or use CloudFormation
aws cloudformation create-stack \
  --stack-name mocklab \
  --template-body file://cloudformation-template.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM
```

---

### AWS EKS (Kubernetes)

```bash
# 1. Prerequisites
# - EKS cluster created
# - kubectl configured
# - AWS Load Balancer Controller installed
# - RDS PostgreSQL created

# 2. Build and push images to ECR
cd deploy/kubernetes
# See README.md for detailed steps

# 3. Deploy
kubectl apply -f namespace.yaml
kubectl create secret generic mocklab-secret --from-literal=DATABASE_URL=...
kubectl apply -f .
```

---

## 📊 Cost Estimates

### Local Development
- **Cost:** $0
- **Resources:** Runs on your machine

### AWS ECS (Recommended for Production)

| Scale | Backend Tasks | Frontend Tasks | Monthly Cost |
|-------|--------------|----------------|--------------|
| **Small** | 2 | 2 | ~$180 |
| **Medium** | 5 | 2 | ~$260 |
| **Large** | 10 | 3 | ~$400 |

Plus: ALB ($16) + RDS ($120) = **$316-536/month total**

### AWS EKS

| Scale | Backend Pods | Frontend Pods | Monthly Cost |
|-------|-------------|---------------|--------------|
| **Small** | 2 | 2 | ~$260 |
| **Medium** | 5 | 2 | ~$340 |
| **Large** | 10 | 3 | ~$480 |

Plus: Cluster ($73) + ALB ($16) + RDS ($120) = **$469-689/month total**

---

## 🎯 Recommendations

### For Most Users
→ **AWS ECS with separate services**
- Simplest cloud deployment
- No Kubernetes complexity
- 30-40% cheaper than EKS
- Auto-scaling included

### For Kubernetes Users
→ **AWS EKS with separate services**
- Portable to any K8s
- More ecosystem tools
- Better for 50+ microservices

### For Development
→ **Docker Compose**
- Free, runs locally
- Easy debugging
- Fast iteration

---

## 📖 Documentation

### Quick References
- [Docker Quick Start](docs/DOCKER_QUICK_START.md) - Get started in 5 minutes
- [Docker Setup Summary](docs/DOCKER_SETUP_SUMMARY.md) - Complete Docker overview

### Detailed Guides
- [Docker Deployment](docs/DEPLOYMENT.md) - Comprehensive Docker guide
- [ECS Deployment](docs/ECS_DEPLOYMENT_GUIDE.md) - AWS ECS/Fargate guide
- [EKS Deployment](docs/EKS_DEPLOYMENT_GUIDE.md) - Kubernetes/EKS guide

### Architecture
- [Separate vs Monolith](docs/ARCHITECTURE_COMPARISON.md) - Why separate containers

---

## 🔧 Common Tasks

### Update Application

**Docker:**
```bash
cd deploy/docker
docker-compose down
docker-compose up -d --build
```

**ECS:**
```bash
cd deploy/aws-ecs
./deploy.sh  # Builds, pushes, and deploys
```

**EKS:**
```bash
cd deploy/kubernetes
# Build and push images
kubectl set image deployment/backend backend=NEW_IMAGE
```

### Scale Services

**Docker:**
```bash
docker-compose up -d --scale backend=5
```

**ECS:**
```bash
aws ecs update-service --service backend --desired-count 10
```

**EKS:**
```bash
kubectl scale deployment backend --replicas=10
```

### View Logs

**Docker:**
```bash
docker-compose logs -f backend
```

**ECS:**
```bash
aws logs tail /ecs/mocklab-backend --follow
```

**EKS:**
```bash
kubectl logs -f deployment/backend
```

### Backup Database

**Docker:**
```bash
cd deploy/docker
make db-backup
```

**RDS (ECS/EKS):**
```bash
# Automated backups configured
# Manual snapshot:
aws rds create-db-snapshot \
  --db-instance-identifier mocklab-db \
  --db-snapshot-identifier mocklab-$(date +%Y%m%d)
```

---

## 🛠️ Troubleshooting

### Docker Issues
→ See [Docker Quick Start](docs/DOCKER_QUICK_START.md#troubleshooting)

### ECS Issues
→ See [ECS Guide](docs/ECS_DEPLOYMENT_GUIDE.md#troubleshooting)

### EKS Issues
→ See [Kubernetes README](kubernetes/README.md#troubleshooting)

---

## 🔒 Security Best Practices

### Secrets Management

**Docker (Local):**
- Use `.env` file (never commit!)
- Set strong passwords

**AWS (ECS/EKS):**
- Use AWS Secrets Manager
- Enable encryption at rest
- Use IAM roles (no credentials in code)

### Network Security

**All Deployments:**
- Use HTTPS (ACM certificates)
- Enable security groups
- Use private subnets for backend
- Restrict database access

### Application Security

- Change default SECRET_KEY
- Use strong database passwords
- Enable RDS encryption
- Set up WAF (Web Application Firewall)

---

## 📈 Monitoring & Observability

### Docker
- Built-in health checks
- CloudWatch logs (if running on EC2)

### ECS
- CloudWatch Container Insights
- ALB access logs
- X-Ray tracing (optional)

### EKS
- CloudWatch Container Insights
- Prometheus + Grafana (optional)
- ELK stack for logs (optional)

---

## 🚢 CI/CD Integration

All deployment methods work with:
- GitHub Actions
- GitLab CI
- Jenkins
- AWS CodePipeline
- CircleCI

Example workflows in each deployment directory.

---

## ✅ Pre-Deployment Checklist

### All Deployments
- [ ] `.env` file configured
- [ ] Secrets are secure (not in git)
- [ ] Database connection tested
- [ ] Health checks configured

### Docker
- [ ] Docker and Docker Compose installed
- [ ] Ports 3000, 8001, 5432 available
- [ ] Sufficient disk space (5GB+)

### AWS ECS
- [ ] AWS CLI configured
- [ ] ECR repositories created
- [ ] RDS PostgreSQL running
- [ ] VPC and subnets configured
- [ ] IAM roles created

### AWS EKS
- [ ] EKS cluster created
- [ ] kubectl configured
- [ ] AWS Load Balancer Controller installed
- [ ] Metrics Server installed
- [ ] RDS PostgreSQL running

---

## 🆘 Getting Help

1. **Check documentation in `docs/` folder**
2. **Review troubleshooting sections**
3. **Check logs:**
   - Docker: `docker-compose logs -f`
   - ECS: `aws logs tail /ecs/mocklab-backend --follow`
   - EKS: `kubectl logs -f deployment/backend`
4. **Open an issue on GitHub**

---

## 📚 Additional Resources

- [Main README](../README.md) - Application overview
- [Features](../FEATURES.md) - Complete feature list
- [Development Guide](../DEVELOPMENT_GUIDE.md) - Local development

---

**Ready to deploy?** Choose your method above and follow the guide! 🚀
