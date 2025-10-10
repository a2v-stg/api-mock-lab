# 🚀 Mock-Lab on AWS ECS - Complete Deployment Guide

## 🎯 ECS vs EKS: Which to Choose?

| Factor | ECS | EKS |
|--------|-----|-----|
| **Complexity** | Simpler, AWS-native | More complex, K8s learning curve |
| **Cost** | No cluster fee ($0) | $73/month cluster fee |
| **Best For** | AWS-only deployments | Multi-cloud, K8s experience |
| **Lock-in** | AWS-specific | Portable to any K8s |
| **Our Recommendation** | ✅ **Great for most cases** | Better if you need K8s |

---

## 🎯 Should You Use Separate Containers in ECS?

**ABSOLUTELY YES!** Even more so than EKS. Here's why:

### 1. **Independent Service Scaling**

**Separate Services:**
```bash
# Scale backend only (handles API load)
aws ecs update-service --service mocklab-backend --desired-count 10

# Keep frontend at 2 (just serves static files)
# Frontend: 2 tasks × 256 CPU = 512 CPU units
# Backend: 10 tasks × 512 CPU = 5120 CPU units
```

**Monolith:**
```bash
# Must scale everything together
aws ecs update-service --service mocklab-app --desired-count 10

# Wastes resources!
# App: 10 tasks × 1024 CPU = 10,240 CPU units (2x wasteful!)
```

### 2. **Fargate Cost Savings**

**Per-hour Fargate costs:**

| Configuration | vCPU | Memory | Cost/hour | Cost/month |
|---------------|------|--------|-----------|------------|
| Backend (0.5 vCPU, 1GB) | 0.5 | 1GB | $0.04776 | ~$35 |
| Frontend (0.25 vCPU, 0.5GB) | 0.25 | 0.5GB | $0.01554 | ~$11 |
| **Monolith (1 vCPU, 2GB)** | 1 | 2GB | $0.12040 | ~$88 |

**Scaling Example (5 backend, 2 frontend):**
- **Separate:** (5 × $35) + (2 × $11) = **$197/month**
- **Monolith:** (5 × $88) = **$440/month** (2.2x more expensive!)

### 3. **Deployment Speed**

| Action | Separate Containers | Monolith |
|--------|-------------------|----------|
| **Frontend update** | 30 seconds, backend unaffected | 2 minutes, everything restarts |
| **Backend update** | 1 minute, frontend unaffected | 2 minutes, everything restarts |
| **Rollback** | Independent | All or nothing |

---

## 📊 Architecture Comparison

### Option A: Separate Services (Recommended) ✅

```
┌─────────────────────────────────────────┐
│  Application Load Balancer              │
│  • SSL termination                      │
│  • Path-based routing:                  │
│    - /api, /auth, /admin → Backend     │
│    - / (everything else) → Frontend     │
└─────────────────────────────────────────┘
         ↓                        ↓
┌──────────────────┐    ┌──────────────────┐
│ Backend Service  │    │ Frontend Service │
│ • 2-20 tasks     │    │ • 2-5 tasks      │
│ • 0.5 vCPU       │    │ • 0.25 vCPU      │
│ • 1GB RAM        │    │ • 0.5GB RAM      │
│ • Auto-scaling   │    │ • Auto-scaling   │
└──────────────────┘    └──────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  RDS PostgreSQL (External)              │
└─────────────────────────────────────────┘

Monthly Cost: ~$197 (scaled to 5 backend, 2 frontend)
```

### Option B: Single Service (Not Recommended) ❌

```
┌─────────────────────────────────────────┐
│  Application Load Balancer              │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Monolith Service                        │
│ • 2-20 tasks (must scale together)      │
│ • 1 vCPU (wasted when only backend busy)│
│ • 2GB RAM                               │
│ • Both frontend + backend in each task  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  RDS PostgreSQL (External)              │
└─────────────────────────────────────────┘

Monthly Cost: ~$440 (scaled to 5 tasks)
Wastes: $243/month (123% more!)
```

---

## 🚀 Quick Deploy to ECS

### Prerequisites

1. **AWS CLI installed and configured**
2. **Docker installed**
3. **VPC with public and private subnets**
4. **RDS PostgreSQL instance**

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Configure AWS region
export AWS_REGION=us-east-1

# 2. Run deployment script
./ecs/deploy.sh

# That's it! Script will:
# - Create ECR repositories
# - Build and push images
# - Register task definitions
# - Update services (if they exist)
```

### Option 2: CloudFormation (Infrastructure + Services)

```bash
# 1. Get your configuration
export VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
export PUBLIC_SUBNET_1=subnet-xxxxx
export PUBLIC_SUBNET_2=subnet-xxxxx
export PRIVATE_SUBNET_1=subnet-xxxxx
export PRIVATE_SUBNET_2=subnet-xxxxx
export DB_URL="postgresql://user:pass@your-rds.amazonaws.com:5432/mocklab"
export SECRET_KEY=$(openssl rand -hex 32)

# 2. Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name mocklab \
  --template-body file://ecs/cloudformation-template.yaml \
  --parameters \
    ParameterKey=VpcId,ParameterValue=${VPC_ID} \
    ParameterKey=PublicSubnet1,ParameterValue=${PUBLIC_SUBNET_1} \
    ParameterKey=PublicSubnet2,ParameterValue=${PUBLIC_SUBNET_2} \
    ParameterKey=PrivateSubnet1,ParameterValue=${PRIVATE_SUBNET_1} \
    ParameterKey=PrivateSubnet2,ParameterValue=${PRIVATE_SUBNET_2} \
    ParameterKey=DatabaseURL,ParameterValue="${DB_URL}" \
    ParameterKey=SecretKey,ParameterValue="${SECRET_KEY}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# 3. Wait for stack creation
aws cloudformation wait stack-create-complete --stack-name mocklab

# 4. Get ALB URL
aws cloudformation describe-stacks \
  --stack-name mocklab \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text
```

### Option 3: Manual Step-by-Step

See detailed steps in the "Manual Deployment" section below.

---

## 💰 Cost Breakdown (Fargate)

### Baseline (2 backend, 2 frontend tasks)

| Component | vCPU | Memory | Tasks | Cost/month |
|-----------|------|--------|-------|------------|
| Backend | 0.5 | 1GB | 2 | $70 |
| Frontend | 0.25 | 0.5GB | 2 | $22 |
| ALB | - | - | 1 | $16 |
| RDS (external) | - | - | 1 | $120 |
| **Total** | | | | **$228/month** |

### Scaled (10 backend, 3 frontend tasks)

| Component | vCPU | Memory | Tasks | Cost/month |
|-----------|------|--------|-------|------------|
| Backend | 0.5 | 1GB | 10 | $350 |
| Frontend | 0.25 | 0.5GB | 3 | $33 |
| ALB | - | - | 1 | $16 |
| RDS (external) | - | - | 1 | $120 |
| **Total** | | | | **$519/month** |

### Cost Optimization Tips

1. **Use Fargate Spot (70% cheaper!)**
   ```yaml
   CapacityProviders:
     - FARGATE_SPOT  # Can save $245/month on scaled example!
   ```

2. **Right-size tasks**
   - Monitor actual CPU/memory usage
   - Adjust task definitions accordingly

3. **Use auto-scaling**
   - Scale down during low traffic
   - Scale up during peak hours

4. **Frontend on S3+CloudFront**
   - Saves $20-30/month
   - Better performance

---

## 📦 What's Included

### ECS Directory Structure

```
ecs/
├── backend-task-definition.json       # Backend Fargate task
├── frontend-task-definition.json      # Frontend Fargate task
├── monolith-task-definition.json      # Monolith (for comparison)
├── cloudformation-template.yaml       # Complete infrastructure
├── deploy.sh                          # Automated deployment
└── README.md                          # Detailed ECS guide
```

### CloudFormation Template Includes

- ✅ ECS Cluster (Fargate + Fargate Spot)
- ✅ Backend Service (2-20 tasks, auto-scaling)
- ✅ Frontend Service (2-5 tasks, auto-scaling)
- ✅ Application Load Balancer
- ✅ Target Groups with health checks
- ✅ Security Groups
- ✅ IAM Roles
- ✅ CloudWatch Log Groups
- ✅ Secrets Manager integration
- ✅ Auto-scaling policies

---

## 🔄 Scaling Strategies

### Backend Auto-Scaling

**Target Tracking (Recommended):**
```bash
# Scales to maintain 70% CPU utilization
# Min: 2 tasks, Max: 20 tasks
# Automatically adds/removes tasks based on load
```

**Manual Scaling:**
```bash
# Scale backend to 10 tasks
aws ecs update-service \
  --cluster mocklab-cluster \
  --service mocklab-backend \
  --desired-count 10
```

**Schedule-Based Scaling:**
```bash
# Scale up at 8am, down at 6pm
aws application-autoscaling put-scheduled-action \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/mocklab-cluster/mocklab-backend \
  --scheduled-action-name scale-up-morning \
  --schedule "cron(0 8 * * ? *)" \
  --scalable-target-action MinCapacity=5,MaxCapacity=20
```

### Frontend Auto-Scaling

Frontend needs less scaling (static content):
```bash
# Usually 2-3 tasks is enough
# Can scale to 5 during very high traffic
```

---

## 🔧 Operations

### Update Deployments

```bash
# Update backend
./ecs/deploy.sh  # Builds, pushes, and deploys

# Or manually
aws ecs update-service \
  --cluster mocklab-cluster \
  --service mocklab-backend \
  --force-new-deployment
```

### View Logs

```bash
# Stream backend logs
aws logs tail /ecs/mocklab-backend --follow

# Stream frontend logs
aws logs tail /ecs/mocklab-frontend --follow

# Last 100 lines
aws logs tail /ecs/mocklab-backend --since 1h
```

### Check Service Status

```bash
# Service details
aws ecs describe-services \
  --cluster mocklab-cluster \
  --services mocklab-backend mocklab-frontend

# Running tasks
aws ecs list-tasks --cluster mocklab-cluster --service-name mocklab-backend

# Task details
aws ecs describe-tasks \
  --cluster mocklab-cluster \
  --tasks <task-id>
```

### Rollback

```bash
# List task definition revisions
aws ecs list-task-definitions --family-prefix mocklab-backend

# Rollback to previous version
aws ecs update-service \
  --cluster mocklab-cluster \
  --service mocklab-backend \
  --task-definition mocklab-backend:5  # Previous revision
```

---

## 🎯 ECS vs EKS: When to Use What

### Use ECS When:
- ✅ AWS-only deployment
- ✅ Want simplicity
- ✅ Don't need Kubernetes
- ✅ Cost-sensitive ($73/month savings on cluster)
- ✅ Small to medium workloads
- ✅ **90% of use cases**

### Use EKS When:
- ✅ Need Kubernetes (existing K8s apps)
- ✅ Multi-cloud strategy
- ✅ Complex microservices (50+ services)
- ✅ Need K8s ecosystem tools
- ✅ Large enterprise deployments

---

## 🏆 Final Recommendation for ECS

### Best Option: Separate Services on Fargate Spot

```yaml
Architecture:
  Frontend: S3 + CloudFront (or 2 Fargate Spot tasks)
  Backend: 2-20 Fargate Spot tasks (auto-scaling)
  Database: RDS PostgreSQL (external)
  Load Balancer: ALB

Monthly Cost:
  Baseline: ~$180
  Scaled (10 backend): ~$360
  
Benefits:
  ✅ Independent scaling
  ✅ Fast deployments
  ✅ Cost-effective
  ✅ Production-ready
  ✅ Zero cluster fees
```

### Why Not Monolith?

| Factor | Impact |
|--------|--------|
| Cost | 2.2x more expensive at scale |
| Scaling | Inefficient (scales both when only one needs it) |
| Deployment | Slower, affects both services |
| Resource Usage | Wastes CPU/memory |
| Best Practices | Against AWS recommendations |

---

## 📚 What to Do Next

1. **Review files in `ecs/` directory**
2. **Set up RDS PostgreSQL** (if not done)
3. **Run `./ecs/deploy.sh`** for quick deployment
4. **Or use CloudFormation** for full infrastructure
5. **Set up auto-scaling** (included in CloudFormation)
6. **Configure domain and HTTPS** (ACM certificate)

---

## 🆚 Quick Comparison: All Deployment Options

| Deployment | Setup Complexity | Monthly Cost | Scaling | Best For |
|-----------|------------------|--------------|---------|----------|
| **Local Docker** | ⭐ Easy | $0 | Manual | Development |
| **ECS Separate** | ⭐⭐ Medium | $180-360 | Auto | **Production** ✅ |
| **ECS Monolith** | ⭐⭐ Medium | $350-700 | Auto | ❌ Not recommended |
| **EKS Separate** | ⭐⭐⭐⭐ Hard | $250-450 | Auto | K8s expertise |
| **EKS Monolith** | ⭐⭐⭐⭐ Hard | $400-800 | Auto | ❌ Never |

---

**Ready to deploy!** All files are in the `ecs/` directory. Just run `./ecs/deploy.sh` or use the CloudFormation template. 🚀

**Questions? Check:**
- `ecs/README.md` - Detailed ECS guide (coming next)
- `EKS_DEPLOYMENT_GUIDE.md` - EKS comparison
- `ARCHITECTURE_COMPARISON.md` - Why separate containers
