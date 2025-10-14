# Mock-Lab: Internal Use Cases & Team Guide

## Overview

**Mock-Lab** is an internal API mocking service that allows teams to simulate API endpoints for development and testing purposes. This document describes which teams can use Mock-Lab, what problems it solves, and practical workflows for each team.

---

## Table of Contents

1. [Target Teams](#target-teams)
2. [Team-Specific Use Cases](#team-specific-use-cases)
3. [Common Workflows](#common-workflows)
4. [Getting Started](#getting-started)
5. [Best Practices](#best-practices)
6. [FAQ](#faq)
7. [Common Alternatives & Their Limitations](#common-alternatives--their-limitations)
8. [Additional Resources](#additional-resources)

---

## Target Teams

| Team | Primary Use Case | Key Benefit |
|------|------------------|-------------|
| **QA Team** | Testing API failure scenarios and non-200 responses | Test error scenarios safely without affecting production |
| **Backend/Dev Team** | Testing third-party APIs before full integration | Develop integration code without third-party dependency |
| **Backend/Dev Team** | Callback URL testing for webhooks | Receive callbacks locally without tunneling tools |
| **Frontend/UI Team** | Developing UI while waiting for backend APIs | Parallel development without blocking |
| **DevOps/SRE Team** | Testing infrastructure resilience and chaos scenarios | Safe chaos testing with no production impact |
| **Integration/Partner** | Testing partner integrations and API contracts | Isolated testing environment for partners |

---

### 1. QA Team
**Primary Use**: Testing API failure scenarios and non-200 responses

**Problem Solved**: 
- Testing error scenarios against real APIs is risky and expensive
- Some error scenarios (like 500 errors, timeouts) are hard to reproduce in real systems
- Third-party APIs may charge per request or have rate limits

**How Mock-Lab Helps**:
- Create mock endpoints that return any HTTP status code (400, 401, 403, 404, 429, 500, 503, etc.)
- Switch between success and error scenarios instantly without code changes
- Test timeout scenarios by adding delays to responses
- Test rate limiting by configuring 429 responses
- No risk of affecting production data or hitting API limits

---

### 2. Backend/Dev Team - Third-Party Integration Testing
**Primary Use**: Testing third-party APIs before full integration

**Problem Solved**:
- Third-party APIs may have sandbox environments that are unreliable or limited
- Integration testing can hit rate limits or incur costs
- Some third-party services don't have good sandbox environments
- Need to test error handling before committing to integration

**How Mock-Lab Helps**:
- Create mock endpoints that match the third-party API contract
- Test your integration logic without calling real third-party services
- Simulate various response scenarios (success, failures, timeouts)
- Test retry logic and error handling
- Validate your code works before making real API calls

---

### 3. Backend/Dev Team - Callback URL Testing
**Primary Use**: Receiving webhooks/callbacks from third parties in local development

**Problem Solved**:
- Third-party services (payment gateways, webhooks, OAuth providers) need to send callbacks to your application
- Local development machines aren't accessible from the internet
- Using ngrok or similar tools is cumbersome and requires tunnel management
- Need to test callback handling logic

**How Mock-Lab Helps**:
- Point third-party callback URLs to Mock-Lab endpoints
- Mock-Lab receives the callbacks and stores them
- View callback payloads in the Mock-Lab UI
- Test your callback processing logic locally
- No need for ngrok or external tunneling services

---

### 4. Frontend/UI Dev Team
**Primary Use**: Developing UI while waiting for backend APIs

**Problem Solved**:
- Frontend development blocked waiting for backend API implementation
- Backend and frontend teams can't work in parallel
- UI development delayed until backend is ready

**How Mock-Lab Helps**:
- Backend team defines API contract
- Frontend team uses Mock-Lab to simulate backend responses
- Both teams work in parallel
- When backend is ready, swap mock URLs with real API URLs
- Frontend is already tested and working

---

### 5. DevOps/SRE Team
**Primary Use**: Testing infrastructure resilience and chaos scenarios

**Problem Solved**:
- Need to test how applications handle API failures
- Can't safely test failure scenarios in production
- Staging environments may not have all dependencies

**How Mock-Lab Helps**:
- Simulate API failures (503, timeouts, slow responses)
- Test circuit breakers, retries, and fallback mechanisms
- Load test with various failure scenarios
- Validate monitoring and alerting systems
- No risk to production systems

---

### 6. Integration/Partner Development
**Primary Use**: Testing partner integrations and API contracts

**Problem Solved**:
- Partners need to test integrations before going live
- Don't want to expose internal systems to partners
- Need controlled test environment

**How Mock-Lab Helps**:
- Create mock endpoints for partner testing
- Partners can test their integration code
- Switch scenarios to test different response cases
- Isolated from internal systems

---

## Team-Specific Use Cases

### QA Team - Error Scenario Testing

**Workflow**:

1. **Setup Phase**:
   - Create a new entity (e.g., "payment-api-testing")
   - Add endpoints that match your API structure
   - Define multiple scenarios for each endpoint

2. **Scenario Definition**:
   ```
   Endpoint: POST /api/payments
   
   Scenarios:
   - Success (200): Payment processed successfully
   - Invalid Card (400): Card validation failed
   - Insufficient Funds (402): Payment declined
   - Rate Limited (429): Too many requests (test retry logic)
   - Server Error (500): Internal server error
   - Timeout (504): Request timeout (add 10s delay)
   ```

3. **Testing Process**:
   - Run automated tests against mock endpoints
   - Switch scenarios to test each error path
   - Verify error handling in UI/application
   - Document any issues found

4. **Benefits**:
   - Test scenarios that are hard to reproduce in real systems
   - No risk of corrupting test data
   - No API rate limits or costs
   - Repeatable, consistent test results

---

### Dev Team - Third-Party API Testing

**Workflow**:

1. **Pre-Integration Phase**:
   - Study third-party API documentation
   - Create mock endpoints matching the API contract
   - Define success and error scenarios

2. **Development Phase**:
   ```python
   # Use mock URL during development
   PAYMENT_API_URL = os.getenv('PAYMENT_API_URL', 'http://mock-lab:8000/api/payments')
   
   # Your integration code
   response = requests.post(PAYMENT_API_URL, json=payment_data)
   ```

3. **Testing Phase**:
   - Test all scenarios (success, failures, timeouts)
   - Validate error handling and retry logic
   - Test edge cases and boundary conditions

4. **Integration Phase**:
   - Swap mock URL with real third-party API
   - Run integration tests
   - Monitor for any differences in behavior

**Benefits**:
   - Develop integration code without third-party dependency
   - Test error handling before committing to integration
   - No sandbox account setup required
   - No API costs during development

---

### Dev Team - Callback/Webhook Testing

**Workflow**:

1. **Setup**:
   - Create mock endpoint for callback: `POST /webhooks/payment-callback`
   - Configure third-party service to send callbacks to Mock-Lab URL
   - Example: `https://your-mock-lab.com/webhooks/payment-callback`

2. **Development**:
   - Third-party service sends callbacks to Mock-Lab
   - View callback payloads in Mock-Lab UI
   - Copy payloads to test your callback handler locally

3. **Testing**:
   - Manually trigger callbacks from Mock-Lab UI
   - Test your callback processing logic
   - Verify data persistence and business logic

4. **Production**:
   - Point third-party callback URL to your production endpoint
   - Mock-Lab no longer needed

**Benefits**:
   - No need for ngrok or tunneling tools
   - Test callback handling without exposing local machine
   - View and replay callback payloads
   - Consistent testing environment

---

### Frontend/UI Team - Parallel Development

**Workflow**:

1. **Contract Definition** (Day 1):
   - Backend team defines API contract (OpenAPI/Swagger)
   - Frontend team reviews and provides feedback
   - Both teams agree on contract

2. **Mock Creation** (Day 1):
   - Backend team creates Mock-Lab endpoints matching contract
   - Defines sample responses for each endpoint
   - Shares Mock-Lab URLs with frontend team

3. **Parallel Development** (Day 2-5):
   - Backend team implements real APIs
   - Frontend team builds UI using Mock-Lab endpoints
   - Both teams work independently

4. **Integration** (Day 6):
   - Backend APIs ready
   - Swap Mock-Lab URLs with real API URLs
   - Frontend already tested and working
   - Minimal integration issues

**Benefits**:
   - No blocking between teams
   - Frontend can demo progress early
   - Catch API design issues early
   - Faster overall development

---

### DevOps/SRE - Chaos Testing

**Workflow**:

1. **Scenario Setup**:
   - Create mock endpoints for critical dependencies
   - Define failure scenarios:
     ```
     - Normal: 200 OK, 100ms delay
     - Degraded: 200 OK, 3000ms delay
     - Partial Failure: 503 Service Unavailable (intermittent)
     - Total Failure: 503 Service Unavailable (consistent)
     - Recovery: 200 OK after failure
     ```

2. **Load Testing**:
   - Run load tests against application
   - Switch mock scenarios during load test
   - Monitor application behavior

3. **Validation**:
   - Verify circuit breakers activate
   - Check retry logic works correctly
   - Validate fallback mechanisms
   - Ensure monitoring/alerting triggers

4. **Documentation**:
   - Document findings
   - Create runbooks for failure scenarios
   - Update incident response procedures

**Benefits**:
   - Safe chaos testing (no production impact)
   - Validate resilience patterns
   - Test monitoring and alerting
   - Build confidence in system reliability

---

## Common Workflows

### Creating Your First Mock API

1. **Access Mock-Lab**:
   - Navigate to Mock-Lab UI (default: http://localhost:5173)
   - Register/Login to create your account

2. **Create an Entity**:
   - Click "Create Entity"
   - Name it descriptively (e.g., "payment-service", "user-api")
   - This groups related endpoints together

3. **Add an Endpoint**:
   - Click "Add Endpoint" in your entity
   - Choose HTTP method (GET, POST, PUT, DELETE, etc.)
   - Define the path (e.g., `/api/users/{id}`)

4. **Define Scenarios**:
   - Create multiple scenarios for the endpoint
   - Each scenario has:
     - Name (e.g., "Success", "Not Found", "Server Error")
     - HTTP Status Code (200, 404, 500, etc.)
     - Response Body (JSON, XML, plain text)
     - Optional delay (for timeout testing)

5. **Test Your Mock**:
   - Copy the Mock-Lab URL for your endpoint
   - Use curl or Postman to test:
     ```bash
     curl http://localhost:8000/api/users/123
     ```

---

### Switching Between Scenarios

1. **Via UI**:
   - Navigate to your endpoint in Mock-Lab UI
   - Click on the scenario dropdown
   - Select the scenario you want to activate
   - The endpoint will now return that scenario's response

2. **Via API** (for automation):
   ```bash
   # Switch to specific scenario
   curl -X POST http://localhost:8000/api/scenarios/switch \
     -H "Content-Type: application/json" \
     -d '{"endpoint_id": "abc123", "scenario_name": "Server Error"}'
   ```

3. **Use Cases**:
   - QA: Switch scenarios during test execution
   - Frontend: Test different response states in UI
   - DevOps: Simulate failures during load testing

---

### Environment Configuration

**Development**:
```bash
# .env.development
API_BASE_URL=http://localhost:8000  # Mock-Lab
```

**Testing**:
```bash
# .env.test
API_BASE_URL=http://mock-lab:8000  # Docker network
```

**Staging/Production**:
```bash
# .env.staging
API_BASE_URL=https://api-staging.example.com  # Real API
```

**Code Example**:
```python
import os

API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000')

# Use in your application
response = requests.get(f"{API_BASE_URL}/api/users")
```

---

### Testing Error Scenarios

**Example: Testing Payment API Error Handling**

1. **Create Scenarios**:
   ```
   POST /api/payments
   
   Scenarios:
   - Success (200): {"status": "success", "transaction_id": "tx_123"}
   - Insufficient Funds (402): {"status": "error", "code": "INSUFFICIENT_FUNDS"}
   - Rate Limited (429): {"status": "error", "code": "RATE_LIMIT"}
   - Server Error (500): {"status": "error", "code": "INTERNAL_ERROR"}
   - Timeout (504): Add 10s delay
   ```

2. **Test in Your Application**:
   ```python
   # Test each scenario
   for scenario in ['Success', 'Insufficient Funds', 'Rate Limited', 'Server Error']:
       switch_scenario('payment-endpoint', scenario)
       result = process_payment(payment_data)
       assert error_handled_correctly(result)
   ```

3. **Verify**:
   - Error messages display correctly
   - Retry logic works for transient errors
   - User experience is smooth

---

### Callback/Webhook Testing

**Setup**:

1. **Create Webhook Endpoint**:
   - Create: `POST /webhooks/stripe-payment`
   - Define expected payload structure

2. **Configure Third-Party Service**:
   - Point Stripe webhook URL to: `https://your-mock-lab.com/webhooks/stripe-payment`
   - Stripe will send callbacks to Mock-Lab

3. **View Callbacks**:
   - Go to Mock-Lab UI
   - Navigate to your webhook endpoint
   - View received callbacks with full payload

4. **Test Locally**:
   - Copy callback payload from Mock-Lab
   - Use in your local callback handler:
     ```python
     # Test callback handler locally
     payload = get_payload_from_mock_lab()
     result = handle_stripe_callback(payload)
     ```

---

### Parallel Development Workflow

**Week 1: Contract Definition**
- Backend team creates OpenAPI spec
- Frontend team reviews and approves
- Both teams agree on API contract

**Week 2: Mock Creation**
- Backend team creates Mock-Lab endpoints
- Defines sample responses for each endpoint
- Shares Mock-Lab URLs with frontend team

**Week 3-4: Parallel Development**
- Backend: Implements real APIs
- Frontend: Builds UI using Mock-Lab
- Both teams work independently

**Week 5: Integration**
- Backend APIs ready
- Update environment variables to use real APIs
- Frontend already tested and working
- Minimal integration issues

**Benefits**:
- No blocking between teams
- Early feedback on API design
- Faster overall development

---

## Getting Started

### Quick Start

1. **Deploy Mock-Lab**:
   ```bash
   # Using Docker Compose
   cd deploy/docker
   docker-compose up -d
   
   # Or run locally
   ./start-backend.sh  # Terminal 1
   ./start-frontend.sh # Terminal 2
   ```

2. **Access the UI**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

3. **Create Your First Mock**:
   - Register/Login at http://localhost:5173
   - Create an entity (e.g., "my-api")
   - Add an endpoint (e.g., `GET /api/users`)
   - Define a scenario (e.g., "Success" with 200 status)
   - Test it: `curl http://localhost:8000/api/users`

---

### For QA Teams

**First Steps**:
1. Identify APIs you need to test
2. Create Mock-Lab entities for each API
3. Define success and error scenarios
4. Integrate mock URLs into your test suite

**Example Test Setup**:
```python
import pytest

@pytest.fixture
def mock_api():
    # Setup mock scenarios
    setup_mock_scenarios()
    return "http://localhost:8000"

def test_payment_success(mock_api):
    # Test success scenario
    switch_scenario("payment", "success")
    response = process_payment(mock_api, payment_data)
    assert response.status == "success"

def test_payment_insufficient_funds(mock_api):
    # Test error scenario
    switch_scenario("payment", "insufficient_funds")
    response = process_payment(mock_api, payment_data)
    assert response.status == "error"
```

---

### For Development Teams

**First Steps**:
1. Review API contracts (OpenAPI/Swagger)
2. Create mock endpoints matching contracts
3. Define realistic response scenarios
4. Share mock URLs with team

**Integration Example**:
```python
# config.py
import os

# Use environment variable to switch between mock and real API
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000')

# service.py
import requests
from config import API_BASE_URL

def get_user(user_id):
    response = requests.get(f"{API_BASE_URL}/api/users/{user_id}")
    return response.json()

# Run with mock
# API_BASE_URL=http://localhost:8000 python app.py

# Run with real API
# API_BASE_URL=https://api.example.com python app.py
```

---

### For Frontend Teams

**First Steps**:
1. Get API contracts from backend team
2. Create or request Mock-Lab endpoints
3. Configure your app to use mock URLs
4. Start building UI

**Example Configuration**:
```javascript
// config.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// api.js
export async function getUsers() {
  const response = await fetch(`${API_BASE_URL}/api/users`);
  return response.json();
}

// .env.development
VITE_API_URL=http://localhost:8000

// .env.production
VITE_API_URL=https://api.example.com
```

---

### For DevOps/SRE Teams

**First Steps**:
1. Identify critical dependencies
2. Create mock endpoints for each dependency
3. Define failure scenarios
4. Integrate into chaos testing workflows

**Chaos Testing Example**:
```python
def test_circuit_breaker():
    # Normal operation
    switch_scenario("payment-api", "success")
    assert make_payment() == "success"
    
    # Simulate failure
    switch_scenario("payment-api", "server_error")
    assert make_payment() == "error"
    
    # Verify circuit breaker opens
    assert circuit_breaker.is_open()
    
    # Simulate recovery
    switch_scenario("payment-api", "success")
    # Circuit breaker should eventually close
```

---

## Best Practices

### API Contract Design
- **Define contracts first**: Agree on API structure before implementation
- **Use OpenAPI/Swagger**: Document contracts in standard format
- **Version your APIs**: Create separate entities for different API versions
- **Keep contracts updated**: Sync mock changes with real API changes

### Scenario Design
- **Test all status codes**: Don't just test 200 responses
  - 2xx: Success scenarios
  - 4xx: Client errors (400, 401, 403, 404, 429)
  - 5xx: Server errors (500, 502, 503, 504)
- **Use realistic data**: Make response data similar to production
- **Add delays for timeout testing**: Configure delays (100ms, 1s, 5s, 10s)
- **Name scenarios clearly**: "Success", "Not Found", "Server Error"

### Organization
- **Group related endpoints**: Use entities to organize by service/team
- **Use descriptive names**: `payment-service` not `test-api`
- **Document your mocks**: Add notes explaining scenarios
- **Clean up unused mocks**: Delete old entities and scenarios

### Environment Management
- **Use environment variables**: Switch between mock and real APIs easily
- **Separate by environment**: Different entities for dev/staging/prod
- **Never use mocks in production**: Always use real APIs in production
- **Version control**: Export/import mock configurations

### Testing
- **Test error paths**: Include error scenarios in test coverage
- **Automate scenario switching**: Use API to switch scenarios in tests
- **Verify error handling**: Ensure your app handles all scenarios
- **Test edge cases**: Boundary conditions, empty responses, malformed data

### Team Collaboration
- **Share mock URLs**: Document in team wiki or README
- **Coordinate mock updates**: Notify team when scenarios change
- **Review mock data**: Ensure scenarios match real API behavior
- **Onboard new team members**: Show them how to use Mock-Lab

---

## FAQ

### Can Mock-Lab replace staging environments?
No, Mock-Lab complements staging environments. Use mocks for:
- Early development before staging is ready
- Testing error scenarios safely
- Isolated component testing
- Local development

Use staging for:
- Integration testing with real services
- Pre-production validation
- Performance testing
- End-to-end testing

### How do we prevent mocks from going to production?
Best practices:
- Use environment variables for API URLs
- Code reviews check for mock URLs
- CI/CD validates production configurations
- Use different domains (mock.internal vs api.production.com)
- Add checks in deployment pipeline

### What happens when the real API changes?
Update your mocks:
1. Backend team updates the real API
2. Update mock scenarios to match new API
3. Frontend/QA teams test with updated mocks
4. Deploy updated code

### Can non-developers use Mock-Lab?
Yes! QA engineers, product managers, and others can:
- Create entities and endpoints
- Define scenarios
- Switch scenarios for demos
- View API traffic

### Is this only for REST APIs?
Currently supports REST APIs. Future support planned for:
- GraphQL
- WebSocket
- gRPC

### How do we handle authentication in mocks?
- Create mock endpoints for authentication
- Return mock tokens for testing
- Test different auth scenarios (valid, expired, invalid)
- Never use mock auth in production

### Can we use Mock-Lab in CI/CD?
Yes, Mock-Lab can be used in CI/CD pipelines:
- Deploy Mock-Lab as part of test infrastructure
- Use mock URLs in test environment
- Switch scenarios programmatically via API
- Clean up after tests complete

---

## Common Alternatives & Their Limitations

Teams typically use various approaches for API mocking and testing. Here's a comparison of common alternatives and their limitations:

### External Tools (Postman, Beeceptor, etc.)

**What teams do:**
- Use external cloud-based mocking services
- Create mock endpoints in Postman or similar tools
- Configure callbacks to these external services

**Problems:**
- ❌ **Data leaves your network**: Sensitive data goes to external services
- ❌ **Rate limits**: Many services limit number of calls (e.g., 1000 calls/month)
- ❌ **Limited scenarios**: Hard to switch between multiple response scenarios
- ❌ **Cost**: Free tiers have limitations, paid plans can be expensive
- ❌ **Dependency on external service**: Service downtime affects your testing
- ❌ **No control**: Limited customization and control over behavior

**Example Issues:**
- Beeceptor: 1000 requests/month on free tier, data goes to external servers
- Postman Mock Server: Limited to 1000 calls/month, requires internet connection
- RequestBin: Data retention limited, not suitable for production-like testing

---

### Mocked Data in Code

**What teams do:**
- Create mock data directly in application code
- Use configuration flags to switch between mock and real APIs
- Maintain separate mock data files

**Problems:**
- ❌ **Code pollution**: Mock logic mixed with production code
- ❌ **Hard to switch scenarios**: Requires code changes or restarts
- ❌ **Limited flexibility**: Can't easily test different error scenarios
- ❌ **Maintenance burden**: Mock data gets out of sync with real API
- ❌ **No realistic testing**: Mock data often doesn't match production behavior
- ❌ **Deployment risk**: Easy to accidentally deploy with mock data enabled

**Example Issues:**
```python
# This approach has problems:
if USE_MOCK:
    return {"status": "success"}  # Hard-coded, not realistic
else:
    return real_api_call()
```

---

### Ngrok for Callbacks

**What teams do:**
- Use ngrok to create tunnels to local development machines
- Expose local ports to receive webhooks
- Set up ngrok tunnels for callback testing

**Problems:**
- ❌ **Complex setup**: Requires ngrok installation and configuration
- ❌ **Security concerns**: Exposing local machine to internet
- ❌ **Not scalable**: Hard to share with team members
- ❌ **No request history**: Can't easily view or replay callbacks
- ❌ **Manual configuration**: Each developer needs to set up their own ngrok
- ❌ **No scenario testing**: Can't simulate different callback scenarios
- ❌ **URL changes**: Ngrok URLs change on restart (free tier)
- ❌ **Cost**: Paid tier needed for stable URLs

**Example Issues:**
- Each developer needs to configure ngrok separately
- Can't easily test different webhook payloads
- Hard to debug callback issues
- URLs change frequently on free tier

---

### Why Mock-Lab Solves These Problems

| Problem | External Tools | Mocked Data in Code | Ngrok | **Mock-Lab** |
|---------|---------------|---------------------|-------|--------------|
| **Data Security** | ❌ Data leaves network | ✅ Stays local | ✅ Stays local | ✅ **Stays local** |
| **No Rate Limits** | ❌ Limited calls | ✅ Unlimited | ⚠️ Free tier limited | ✅ **Unlimited** |
| **Multiple Scenarios** | ❌ Limited | ❌ Hard to switch | ❌ Not supported | ✅ **Easy switching** |
| **No External Dependency** | ❌ Depends on service | ✅ No dependency | ⚠️ Depends on ngrok | ✅ **No dependency** |
| **Team Collaboration** | ❌ Hard to share | ❌ Code changes needed | ❌ Manual setup | ✅ **Shared instance** |
| **Easy Setup** | ⚠️ Moderate | ❌ Code changes | ❌ Complex | ✅ **Simple** |
| **Callback Testing** | ⚠️ Limited | ❌ Not supported | ⚠️ Manual | ✅ **Built-in** |
| **Request History** | ⚠️ Limited | ❌ Not available | ❌ Not available | ✅ **Full history** |
| **Stable URLs** | ⚠️ Depends on service | ✅ Not applicable | ❌ Changes on restart | ✅ **Stable** |
| **No Cost** | ❌ Free tier limited | ✅ Free | ⚠️ Free tier limited | ✅ **Free** |

---

## Additional Resources

- **Quick Start**: See [README.md](.././README.md)
- **Technical Features**: See [FEATURES.md](./FEATURES.md)
- **Deployment Guide**: See [deploy/docs/DEPLOYMENT.md](.././deploy/docs/DEPLOYMENT.md)
- **Docker Setup**: See [deploy/docs/DOCKER_QUICK_START.md](.././deploy/docs/DOCKER_QUICK_START.md)
- **Development Guide**: See [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
