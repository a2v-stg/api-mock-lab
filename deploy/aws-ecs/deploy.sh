#!/bin/bash
# Mock-Lab ECS Deployment Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🚀 Mock-Lab ECS Deployment"
echo "=========================="
echo ""

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLUSTER_NAME="mocklab-cluster"
BACKEND_SERVICE="mocklab-backend"
FRONTEND_SERVICE="mocklab-frontend"

# Check prerequisites
echo "1️⃣  Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Build and push images
echo "2️⃣  Building and pushing Docker images..."

# Login to ECR
echo "   Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Create ECR repositories if they don't exist
echo "   Creating ECR repositories..."
aws ecr describe-repositories --repository-names mocklab-backend --region ${AWS_REGION} 2>/dev/null || \
    aws ecr create-repository --repository-name mocklab-backend --region ${AWS_REGION}

aws ecr describe-repositories --repository-names mocklab-frontend --region ${AWS_REGION} 2>/dev/null || \
    aws ecr create-repository --repository-name mocklab-frontend --region ${AWS_REGION}

# Build and push backend
echo "   Building backend..."
docker build -f Dockerfile.backend -t mocklab-backend:latest .

echo "   Pushing backend..."
docker tag mocklab-backend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/mocklab-backend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/mocklab-backend:latest

# Build and push frontend
echo "   Building frontend..."
docker build -f Dockerfile.frontend -t mocklab-frontend:latest .

echo "   Pushing frontend..."
docker tag mocklab-frontend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/mocklab-frontend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/mocklab-frontend:latest

echo -e "${GREEN}✅ Images pushed to ECR${NC}"
echo ""

# Register task definitions
echo "3️⃣  Registering ECS task definitions..."

# Update task definition files with account ID and region
sed -e "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" \
    -e "s/us-east-1/${AWS_REGION}/g" \
    ecs/backend-task-definition.json > /tmp/backend-task-def.json

sed -e "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" \
    -e "s/us-east-1/${AWS_REGION}/g" \
    ecs/frontend-task-definition.json > /tmp/frontend-task-def.json

# Register task definitions
echo "   Registering backend task definition..."
aws ecs register-task-definition \
    --cli-input-json file:///tmp/backend-task-def.json \
    --region ${AWS_REGION} > /dev/null

echo "   Registering frontend task definition..."
aws ecs register-task-definition \
    --cli-input-json file:///tmp/frontend-task-def.json \
    --region ${AWS_REGION} > /dev/null

echo -e "${GREEN}✅ Task definitions registered${NC}"
echo ""

# Update services
echo "4️⃣  Updating ECS services..."

# Check if services exist
if aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${BACKEND_SERVICE} --region ${AWS_REGION} 2>/dev/null | grep -q "ACTIVE"; then
    echo "   Updating backend service..."
    aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${BACKEND_SERVICE} \
        --task-definition mocklab-backend \
        --force-new-deployment \
        --region ${AWS_REGION} > /dev/null
    echo -e "${GREEN}   ✅ Backend service updated${NC}"
else
    echo -e "${YELLOW}   ⚠️  Backend service not found. Deploy with CloudFormation first.${NC}"
fi

if aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${FRONTEND_SERVICE} --region ${AWS_REGION} 2>/dev/null | grep -q "ACTIVE"; then
    echo "   Updating frontend service..."
    aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${FRONTEND_SERVICE} \
        --task-definition mocklab-frontend \
        --force-new-deployment \
        --region ${AWS_REGION} > /dev/null
    echo -e "${GREEN}   ✅ Frontend service updated${NC}"
else
    echo -e "${YELLOW}   ⚠️  Frontend service not found. Deploy with CloudFormation first.${NC}"
fi

echo ""

# Get ALB URL
echo "5️⃣  Getting application URL..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names mocklab-alb \
    --query 'LoadBalancers[0].DNSName' \
    --output text \
    --region ${AWS_REGION} 2>/dev/null || echo "ALB not found")

if [ "$ALB_DNS" != "ALB not found" ]; then
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
    echo "📋 Access your application:"
    echo "   URL: http://${ALB_DNS}"
    echo ""
else
    echo -e "${YELLOW}⚠️  ALB not found. Deploy CloudFormation stack first.${NC}"
    echo ""
fi

# Show service status
echo "📊 Service status:"
aws ecs describe-services \
    --cluster ${CLUSTER_NAME} \
    --services ${BACKEND_SERVICE} ${FRONTEND_SERVICE} \
    --region ${AWS_REGION} \
    --query 'services[*].[serviceName,status,runningCount,desiredCount]' \
    --output table 2>/dev/null || echo "No services found"

echo ""
echo "🛠️  Useful commands:"
echo "   View logs:     aws logs tail /ecs/mocklab-backend --follow"
echo "   Scale backend: aws ecs update-service --cluster ${CLUSTER_NAME} --service ${BACKEND_SERVICE} --desired-count 5"
echo "   Service info:  aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${BACKEND_SERVICE}"
echo ""
