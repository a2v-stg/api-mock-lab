# Kubernetes Deployment for Mock-Lab on AWS EKS

## Overview

This directory contains Kubernetes manifests for deploying Mock-Lab to AWS EKS with:
- **Separate** frontend and backend deployments
- External RDS PostgreSQL database
- AWS Application Load Balancer (ALB)
- Horizontal Pod Autoscaling (HPA)
- High availability and zero-downtime deployments

## Prerequisites

1. **AWS EKS Cluster** (1.27+)
2. **AWS Load Balancer Controller** installed
3. **Metrics Server** installed (for HPA)
4. **RDS PostgreSQL** database created
5. **ECR repositories** for images:
   - `YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/mocklab-backend`
   - `YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/mocklab-frontend`
6. **ACM Certificate** for HTTPS (optional but recommended)

## Architecture

```
Internet
    ↓
AWS ALB (HTTPS)
    ↓
    ├→ /api, /auth, /admin, /ws → Backend Pods (2-20 replicas)
    └→ / (everything else)       → Frontend Pods (2-5 replicas)
                                        ↓
                                   RDS PostgreSQL
```

## Quick Start

### 1. Build and Push Images to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -f Dockerfile.backend -t mocklab-backend .
docker tag mocklab-backend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/mocklab-backend:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/mocklab-backend:latest

# Build and push frontend
docker build -f Dockerfile.frontend -t mocklab-frontend .
docker tag mocklab-frontend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/mocklab-frontend:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/mocklab-frontend:latest
```

### 2. Create RDS Database

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier mocklab-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username mocklab \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxxx \
  --db-subnet-group-name your-db-subnet-group

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier mocklab-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### 3. Configure Kubernetes Secrets

```bash
# Set your values
export DB_ENDPOINT="mocklab-db.xxxxxx.us-east-1.rds.amazonaws.com"
export DB_PASSWORD="your_secure_password"
export SECRET_KEY=$(openssl rand -hex 32)

# Create secret
kubectl create secret generic mocklab-secret \
  --namespace mocklab \
  --from-literal=DATABASE_URL="postgresql://mocklab:${DB_PASSWORD}@${DB_ENDPOINT}:5432/mocklab" \
  --from-literal=SECRET_KEY="${SECRET_KEY}"
```

### 4. Update Manifests

Edit these files with your values:

**`backend-deployment.yaml` and `frontend-deployment.yaml`:**
```yaml
image: YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/mocklab-backend:latest
```

**`ingress.yaml`:**
```yaml
alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID
rules:
- host: mocklab.yourdomain.com
```

**`serviceaccount.yaml`:**
```yaml
eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/mocklab-backend-role
```

### 5. Deploy to EKS

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Create config and secrets
kubectl apply -f configmap.yaml
# Secret created in step 3

# Create service account
kubectl apply -f serviceaccount.yaml

# Deploy backend
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f backend-hpa.yaml

# Deploy frontend
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# Create ingress (ALB)
kubectl apply -f ingress.yaml

# Apply pod disruption budgets
kubectl apply -f pdb.yaml
```

### 6. Verify Deployment

```bash
# Check all resources
kubectl get all -n mocklab

# Check pods
kubectl get pods -n mocklab

# Check HPA
kubectl get hpa -n mocklab

# Check ingress
kubectl get ingress -n mocklab

# Get ALB DNS name
kubectl get ingress mocklab-ingress -n mocklab -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Check logs
kubectl logs -n mocklab -l component=backend --tail=50
kubectl logs -n mocklab -l component=frontend --tail=50
```

## Scaling Configuration

### Backend Autoscaling

The backend automatically scales based on:
- **CPU**: Target 70% utilization
- **Memory**: Target 80% utilization
- **Range**: 2-20 pods

```bash
# Watch autoscaling in action
kubectl get hpa -n mocklab -w

# Manual scale (overrides HPA temporarily)
kubectl scale deployment backend -n mocklab --replicas=10
```

### Frontend Scaling

Frontend usually needs fewer replicas (2-5) since it just serves static content.

To add HPA for frontend:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: mocklab
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 70
```

## Resource Requirements

### Per Pod

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|------------|-----------|----------------|--------------|
| Backend   | 500m       | 1000m     | 512Mi          | 1Gi          |
| Frontend  | 100m       | 200m      | 128Mi          | 256Mi        |

### Cluster Sizing

For production workload:

**Option 1: Mixed Instance Types**
- 3 × t3.medium nodes (2 CPU, 4GB RAM each)
- Can run: 9 backend pods + 12 frontend pods
- Cost: ~$75/month (spot) or ~$150/month (on-demand)

**Option 2: Spot Instances**
- Use EKS managed node groups with spot instances
- Save 60-70% compared to on-demand
- Configure multiple instance types for availability

**Option 3: Fargate**
- Serverless, pay per pod
- No node management
- ~$30/month for 2 backend + 2 frontend pods

## Cost Optimization

### 1. Use Spot Instances

```yaml
# EKS Managed Node Group with Spot
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: mocklab-cluster
  region: us-east-1
managedNodeGroups:
- name: spot-nodes
  instanceTypes:
    - t3.medium
    - t3a.medium
    - t2.medium
  spot: true
  minSize: 2
  maxSize: 10
  desiredCapacity: 3
```

### 2. Use Cluster Autoscaler

Automatically add/remove nodes based on pod demands:

```bash
# Install cluster autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml
```

### 3. Right-Size Pods

Monitor actual usage:

```bash
# Check actual resource usage
kubectl top pods -n mocklab

# Adjust requests/limits based on real usage
```

## Updating Deployments

### Update Backend

```bash
# Build new version
docker build -f Dockerfile.backend -t mocklab-backend:v2 .
docker tag mocklab-backend:v2 YOUR_ECR/mocklab-backend:v2
docker push YOUR_ECR/mocklab-backend:v2

# Update deployment
kubectl set image deployment/backend \
  backend=YOUR_ECR/mocklab-backend:v2 \
  -n mocklab

# Watch rollout
kubectl rollout status deployment/backend -n mocklab

# Rollback if needed
kubectl rollout undo deployment/backend -n mocklab
```

### Update Frontend

```bash
# Same process
docker build -f Dockerfile.frontend -t mocklab-frontend:v2 .
docker tag mocklab-frontend:v2 YOUR_ECR/mocklab-frontend:v2
docker push YOUR_ECR/mocklab-frontend:v2

kubectl set image deployment/frontend \
  frontend=YOUR_ECR/mocklab-frontend:v2 \
  -n mocklab
```

## Monitoring

### CloudWatch Container Insights

```bash
# Install CloudWatch agent
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml
```

### Useful Commands

```bash
# Real-time pod metrics
kubectl top pods -n mocklab

# Real-time node metrics
kubectl top nodes

# Get events
kubectl get events -n mocklab --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod <pod-name> -n mocklab

# Execute command in pod
kubectl exec -it <pod-name> -n mocklab -- /bin/bash
```

## High Availability

The setup ensures HA through:

1. **Multiple replicas**: Min 2 pods per component
2. **Pod anti-affinity**: Spreads pods across nodes
3. **Pod Disruption Budgets**: Maintains availability during updates
4. **Readiness/Liveness probes**: Auto-restart unhealthy pods
5. **RollingUpdate strategy**: Zero-downtime deployments
6. **Multi-AZ RDS**: Database redundancy

## Security Best Practices

1. **IRSA (IAM Roles for Service Accounts)**: No AWS credentials in pods
2. **Network Policies**: Restrict pod-to-pod communication
3. **Pod Security Standards**: Enforce security contexts
4. **Secrets encryption**: Enable envelope encryption in EKS
5. **Private subnets**: Run pods in private subnets
6. **Security groups**: Restrict RDS access to EKS security group

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl get pods -n mocklab

# Check pod events
kubectl describe pod <pod-name> -n mocklab

# Check logs
kubectl logs <pod-name> -n mocklab

# Check image pull
kubectl get events -n mocklab | grep -i "failed to pull"
```

### Database connection errors

```bash
# Test from backend pod
kubectl exec -it <backend-pod> -n mocklab -- \
  psql -h mocklab-db.xxx.rds.amazonaws.com -U mocklab -d mocklab

# Check security groups
# Ensure EKS node security group can access RDS on port 5432
```

### ALB not created

```bash
# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify service account permissions
kubectl describe sa mocklab-backend -n mocklab
```

## Cost Estimation

**Monthly AWS costs (us-east-1):**

| Resource | Specification | Cost |
|----------|--------------|------|
| EKS Cluster | Control plane | $73 |
| EC2 Nodes | 3 × t3.medium spot | $45 |
| RDS | db.t3.medium Multi-AZ | $120 |
| ALB | Application Load Balancer | $16 |
| Data Transfer | ~100GB/month | $9 |
| **Total** | | **~$263/month** |

**Optimization:**
- Use t4g (ARM) instances: Save 20%
- Use RDS Single-AZ for dev: Save 50% on DB
- Use Fargate Spot: Pay per pod

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions, GitLab CI)
2. Configure monitoring and alerting
3. Set up log aggregation
4. Implement network policies
5. Configure backup strategies
6. Set up disaster recovery

---

**Questions? Check:**
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Docker deployment
- [ARCHITECTURE_COMPARISON.md](../ARCHITECTURE_COMPARISON.md) - Why separate containers
- AWS EKS Documentation
