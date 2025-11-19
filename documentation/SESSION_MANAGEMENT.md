# Distributed Session Management

## Overview

This application supports distributed session management for production deployments with multiple backend pods. **By default, sessions are stored in PostgreSQL**, which works seamlessly across all pods. Redis is available as an optional enhancement for higher performance, but is not required.

## Problem Statement

When deploying with multiple backend pods (e.g., 2+ replicas in Kubernetes), in-memory session storage causes authentication failures because:

1. User logs in on Pod 1 → token stored in Pod 1's memory
2. Next request goes to Pod 2 → Pod 2 doesn't have the token → authentication fails

## Solution

The application uses a **shared session store** that works across all pods:

- **PostgreSQL (Default)**: Uses your existing database - no additional infrastructure needed
- **Redis (Optional)**: Can be enabled for higher performance if needed

## Architecture

```
┌─────────────┐     ┌─────────────┐
│  Backend    │     │  Backend    │
│    Pod 1    │     │    Pod 2    │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
       ┌─────────▼─────────┐
       │  Session Store    │
       │  (Redis or DB)     │
       └───────────────────┘
```

## Configuration

### Default: PostgreSQL (No Configuration Needed)

**Sessions are stored in PostgreSQL by default.** The `session_tokens` table is automatically created via migrations. No additional configuration is required - it just works!

### Option 1: Redis (Optional Performance Enhancement)

#### Using AWS ElastiCache

1. **Create ElastiCache Redis Cluster**:
   ```bash
   aws elasticache create-cache-cluster \
     --cache-cluster-id mocklab-redis \
     --cache-node-type cache.t3.micro \
     --engine redis \
     --num-cache-nodes 1 \
     --security-group-ids sg-xxxxx \
     --subnet-group-name your-subnet-group
   ```

2. **Get Redis Endpoint**:
   ```bash
   aws elasticache describe-cache-clusters \
     --cache-cluster-id mocklab-redis \
     --show-cache-node-info \
     --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
     --output text
   ```

3. **Update Kubernetes Secret**:
   ```bash
   kubectl create secret generic mocklab-secret \
     --namespace mocklab \
     --from-literal=REDIS_URL="redis://your-redis-endpoint.cache.amazonaws.com:6379/0" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

#### Using Kubernetes Redis Deployment

1. **Deploy Redis** (optional, for development/testing):
   ```bash
   kubectl apply -f deploy/kubernetes/redis-deployment.yaml
   ```

2. **Update Secret**:
   ```bash
   kubectl create secret generic mocklab-secret \
     --namespace mocklab \
     --from-literal=REDIS_URL="redis://redis-service.mocklab.svc.cluster.local:6379/0" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

#### Using Docker Compose (Development)

Add to `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - mocklab-network

volumes:
  redis_data:
```

Set environment variable:
```bash
export REDIS_URL="redis://localhost:6379/0"
```

### Option 2: Keep Using PostgreSQL (Default - Recommended)

**PostgreSQL is the default and recommended option.** It requires no additional infrastructure and works perfectly for most use cases.

The system automatically:
1. Creates a `session_tokens` table via migrations
2. Stores tokens in PostgreSQL
3. Cleans up expired tokens every hour via background task
4. Works seamlessly across all backend pods

## How It Works

### Session Storage Flow

1. **User Login**:
   ```python
   token = create_access_token(user_id)  # Stores in Redis/DB
   ```

2. **Token Validation**:
   ```python
   user_id = get_user_from_token(token)  # Retrieves from Redis/DB
   ```

3. **Token Expiration**:
   - Redis: Automatic TTL expiration
   - Database: Cleaned up on next access or via scheduled job

### How It Works

The system uses PostgreSQL by default, and only uses Redis if explicitly configured:

```python
# Default: Uses PostgreSQL
store = DatabaseSessionStore()

# Only if REDIS_URL is set:
if REDIS_URL:
    store = RedisSessionStore()  # Falls back to PostgreSQL if connection fails
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string (used for session storage by default) |
| `REDIS_URL` | No | None | Redis connection URL. If not set, PostgreSQL is used (default). |

### Redis URL Format

```
redis://[password@]host:port[/db]
```

Examples:
- `redis://localhost:6379/0`
- `redis://:mypassword@redis.example.com:6379/0`
- `redis://redis-service.mocklab.svc.cluster.local:6379/0`

## Performance Comparison

| Storage | Latency | Scalability | Setup Complexity |
|---------|---------|-------------|------------------|
| **Redis** | ~1ms | Excellent | Medium (requires Redis) |
| **Database** | ~5-10ms | Good | Low (uses existing DB) |

## Production Recommendations

### For Most Applications (Recommended)

1. **Use PostgreSQL** (default) - No additional infrastructure needed
2. **Ensure database connection pooling** is configured (SQLAlchemy handles this)
3. **Expired tokens are automatically cleaned up** every hour
4. **Works perfectly with multiple pods** - all pods share the same database

### For Very High-Traffic Applications (Optional)

If you need sub-millisecond session lookups and have very high traffic:

1. **Consider Redis** (ElastiCache, Azure Cache, etc.)
2. **Enable Redis persistence** (RDB or AOF)
3. **Use Redis Cluster** for high availability
4. **Set appropriate TTL** (default: 24 hours)

**Note**: For most applications, PostgreSQL is perfectly adequate and simpler to manage.

## Monitoring

### Check Session Store Type

The application logs which storage backend is being used:

```
INFO: ✓ Connected to Redis for session storage
# OR
INFO: Using database for session storage
```

### Redis Health Check

```bash
# Test Redis connection
kubectl exec -it deployment/backend -n mocklab -- redis-cli -u $REDIS_URL ping
```

### Database Session Count

```sql
-- Check active sessions
SELECT COUNT(*) FROM session_tokens WHERE expires_at > NOW();

-- Check expired sessions
SELECT COUNT(*) FROM session_tokens WHERE expires_at <= NOW();
```

## Troubleshooting

### Sessions Not Working Across Pods

**Symptoms**: User gets logged out when requests hit different pods

**Solution**: 
1. Verify `REDIS_URL` is set correctly
2. Check Redis connectivity: `kubectl logs deployment/backend -n mocklab | grep -i redis`
3. Ensure all pods have the same `REDIS_URL` configuration

### Redis Connection Errors

**Symptoms**: Logs show "Failed to connect to Redis"

**Solution**:
1. Verify Redis is running: `kubectl get pods -n mocklab | grep redis`
2. Check network connectivity from backend pods
3. Verify security groups/firewall rules allow Redis port (6379)
4. Check Redis authentication if password is required

### Fallback to Database Not Working

**Symptoms**: Application fails when Redis is unavailable

**Solution**:
1. Verify database connection is working
2. Check that `session_tokens` table exists: `kubectl exec -it deployment/backend -n mocklab -- python -c "from backend.models import SessionToken; print('OK')"`
3. Review migration logs: `kubectl logs deployment/backend -n mocklab | grep -i migration`

## Migration from In-Memory Storage

The migration is **automatic** and **backward compatible**:

1. Existing code continues to work
2. Sessions are now stored in shared storage
3. No code changes required in your application
4. Tokens are automatically migrated on next login

## Security Considerations

1. **Token Expiration**: Tokens expire after 24 hours (configurable)
2. **Redis Security**: 
   - Use password authentication in production
   - Enable TLS for Redis connections
   - Restrict network access to Redis
3. **Database Security**: 
   - Use encrypted connections
   - Restrict database access
   - Regularly clean expired tokens

## Testing

### Test Session Persistence

```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' | jq -r '.token')

# Test from different pod (simulate load balancer)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8001/auth/me
```

### Test Redis Fallback

```bash
# Stop Redis
kubectl scale deployment redis --replicas=0 -n mocklab

# Verify fallback to database
kubectl logs deployment/backend -n mocklab | grep -i "database for session"
```

## Additional Resources

- [Redis Documentation](https://redis.io/docs/)
- [AWS ElastiCache for Redis](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/WhatIs.html)
- [Kubernetes Redis Deployment](https://kubernetes.io/docs/tutorials/stateful-application/run-replicated-stateful-application/)

