# Complete Features Guide

This is the complete guide to Mock-Lab features, including core functionality and advanced features.

## Table of Contents

1. [Core Features](#core-features)
2. [Advanced Features](#advanced-features)
   - [Dynamic Placeholders](#dynamic-placeholders)
   - [Async Callbacks](#async-callbacks)
   - [Request Schema Validation](#request-schema-validation)

---

## Core Features

### Multi-Entity Architecture
- **Unique namespaces**: Each entity gets `/api/{entity-name}/*`
- **API key per entity**: Automatic generation
- **Access control**: Public/private entities, sharing with users

### Response Scenarios
- **Multiple scenarios per endpoint**: Define 200, 404, 429, 500 responses
- **Instant switching**: Change scenarios without restart
- **Per-scenario delays**: Simulate timeouts and slow APIs

### Real-Time Monitoring
- **WebSocket updates**: Live traffic monitoring
- **Request/response logs**: Full details of every request
- **Two-panel UI**: Request list + detailed view

### Authentication & Access Control
- **User registration/login**: Secure authentication
- **Entity ownership**: Owner controls settings
- **Entity sharing**: Share with specific users
- **Public entities**: Optional public access

---

## Advanced Features

---

## Dynamic Placeholders

Dynamic placeholders allow you to generate dynamic values in your response payloads instead of returning static data. This is useful for simulating real-world scenarios where data changes on each request.

### Supported Placeholders

#### UUID/GUID Generation

- `{{uuid}}` or `{{uuid4}}` - Generates a UUID v4
- `{{guid}}` - Generates a GUID (same as UUID)

**Example:**
```json
{
  "id": "{{uuid}}",
  "transaction_id": "{{guid}}"
}
```

**Output:**
```json
{
  "id": "a3d4e5f6-1234-5678-9abc-def012345678",
  "transaction_id": "b2c3d4e5-9876-5432-1fed-cba098765432"
}
```

#### Timestamp Placeholders

- `{{timestamp}}` - Current Unix timestamp in milliseconds
- `{{timestamp_iso}}` - ISO 8601 format timestamp
- `{{timestamp_unix}}` - Unix timestamp in seconds
- `{{date}}` - Current date (YYYY-MM-DD)
- `{{datetime}}` - Current datetime (YYYY-MM-DD HH:MM:SS)
- `{{time}}` - Current time (HH:MM:SS)

**Example:**
```json
{
  "created_at": "{{timestamp_iso}}",
  "updated_at": {{timestamp}},
  "date": "{{date}}"
}
```

**Output:**
```json
{
  "created_at": "2025-10-16T14:30:45.123456+00:00",
  "updated_at": 1729089045123,
  "date": "2025-10-16"
}
```

#### Random Numbers

- `{{random}}` - Random number between 0-1000
- `{{random:max}}` - Random number between 0 and max
- `{{random_int:min:max}}` - Random integer between min and max
- `{{random_float:min:max}}` - Random float between min and max

**Example:**
```json
{
  "amount": {{random_float:10:100}},
  "quantity": {{random_int:1:50}},
  "score": {{random:100}}
}
```

**Output:**
```json
{
  "amount": 45.67,
  "quantity": 23,
  "score": 87
}
```

#### Random Strings

- `{{random_string}}` - Random alphabetic string (length 10)
- `{{random_string:length}}` - Random alphabetic string of specified length
- `{{random_hex:length}}` - Random hexadecimal string
- `{{random_alphanumeric:length}}` - Random alphanumeric string

**Example:**
```json
{
  "token": "{{random_hex:32}}",
  "code": "{{random_alphanumeric:8}}",
  "session": "{{random_string:16}}"
}
```

**Output:**
```json
{
  "token": "a1b2c3d4e5f67890abcdef1234567890",
  "code": "Xy9Kp2Qm",
  "session": "AbCdEfGhIjKlMnOp"
}
```

#### Random Personal Data

- `{{random_name}}` - Random full name
- `{{random_first_name}}` - Random first name
- `{{random_last_name}}` - Random last name
- `{{random_email}}` - Random email address
- `{{random_username}}` - Random username

**Example:**
```json
{
  "name": "{{random_name}}",
  "email": "{{random_email}}",
  "username": "{{random_username}}"
}
```

**Output:**
```json
{
  "name": "John Smith",
  "email": "xykpqmrt@example.com",
  "username": "user7k3p9m"
}
```

#### Random Boolean

- `{{random_bool}}` or `{{random_boolean}}` - Random true/false

**Example:**
```json
{
  "is_active": {{random_bool}},
  "verified": {{random_boolean}}
}
```

**Output:**
```json
{
  "is_active": true,
  "verified": false
}
```

### Complete Example

**Endpoint Response Configuration:**
```json
{
  "user_id": "{{uuid}}",
  "username": "{{random_username}}",
  "email": "{{random_email}}",
  "full_name": "{{random_name}}",
  "created_at": "{{timestamp_iso}}",
  "account_balance": {{random_float:100:10000}},
  "is_premium": {{random_bool}},
  "session_token": "{{random_hex:64}}"
}
```

**Actual Response (varies on each request):**
```json
{
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "username": "user9kp3x7",
  "email": "jklfdsop@gmail.com",
  "full_name": "Sarah Johnson",
  "created_at": "2025-10-16T15:23:41.789012+00:00",
  "account_balance": 5432.89,
  "is_premium": true,
  "session_token": "a1b2c3d4e5f6..."
}
```

---

## Async Callbacks

Async callbacks allow your mock endpoints to send HTTP callbacks to external URLs after processing a request. This is useful for testing webhook handlers and async processing scenarios.

### Configuration Options

When creating or updating a mock endpoint, you can configure callbacks with these fields:

- `callback_enabled` (boolean) - Enable/disable callback functionality
- `callback_url` (string) - Static callback URL (optional)
- `callback_method` (string) - HTTP method for callback (GET, POST, PUT, etc.) - defaults to POST
- `callback_delay_ms` (integer) - Delay in milliseconds before sending callback - defaults to 0
- `callback_extract_from_request` (boolean) - Extract callback URL from request body
- `callback_extract_field` (string) - JSON path to extract callback URL from request

### Static Callback URL

Use a fixed callback URL for all requests to this endpoint.

**Example Endpoint Configuration:**
```json
{
  "name": "Order Processing",
  "method": "POST",
  "path": "/orders",
  "response_body": "{\"order_id\": \"{{uuid}}\", \"status\": \"processing\"}",
  "response_code": 202,
  "callback_enabled": true,
  "callback_url": "https://your-app.com/webhooks/order-complete",
  "callback_method": "POST",
  "callback_delay_ms": 5000
}
```

**What happens:**
1. Client makes POST request to `/api/your-entity/orders`
2. Mock service immediately returns 202 response
3. After 5 seconds, mock service sends callback to `https://your-app.com/webhooks/order-complete`

**Callback Payload:**
```json
{
  "endpoint": {
    "method": "POST",
    "path": "/api/your-entity/orders"
  },
  "request": {
    "product_id": "12345",
    "quantity": 2
  },
  "response": {
    "order_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "processing"
  },
  "timestamp": "2025-10-16T15:23:41.789012+00:00"
}
```

### Dynamic Callback URL (Extract from Request)

Extract the callback URL from the incoming request payload. Useful when different clients need different callback endpoints.

**Example Endpoint Configuration:**
```json
{
  "name": "Payment Processing",
  "method": "POST",
  "path": "/payments",
  "response_body": "{\"payment_id\": \"{{uuid}}\", \"status\": \"pending\"}",
  "response_code": 202,
  "callback_enabled": true,
  "callback_extract_from_request": true,
  "callback_extract_field": "callback_url",
  "callback_method": "POST",
  "callback_delay_ms": 3000
}
```

**Client Request:**
```json
POST /api/your-entity/payments
Content-Type: application/json

{
  "amount": 99.99,
  "currency": "USD",
  "callback_url": "https://client-app.com/payment-webhook"
}
```

**What happens:**
1. Client makes POST request with callback_url in body
2. Mock service immediately returns 202 response
3. After 3 seconds, mock service sends callback to the URL from the request

### Nested Field Extraction

You can extract callback URLs from nested JSON paths using dot notation.

**Example Configuration:**
```json
{
  "callback_enabled": true,
  "callback_extract_from_request": true,
  "callback_extract_field": "meta.webhook.url"
}
```

**Client Request:**
```json
{
  "order_data": {...},
  "meta": {
    "webhook": {
      "url": "https://client.com/webhook",
      "secret": "abc123"
    }
  }
}
```

### Use Cases

1. **Testing Webhook Handlers** - Verify your application handles async webhooks correctly
2. **Simulating Payment Gateways** - Test payment confirmation flows
3. **Order Processing** - Test order fulfillment notifications
4. **Email/SMS Services** - Simulate delivery confirmations
5. **Background Job Completion** - Test long-running task notifications

---

## Request Schema Validation

Request schema validation ensures that incoming requests conform to a defined JSON Schema before returning the mock response. Invalid requests receive a 400 error with detailed validation messages.

### Enabling Schema Validation

When creating or updating a mock endpoint:

- `schema_validation_enabled` (boolean) - Enable/disable validation
- `request_schema` (string) - JSON Schema definition (as string)

### JSON Schema Example

**Endpoint Configuration:**
```json
{
  "name": "Create User",
  "method": "POST",
  "path": "/users",
  "response_body": "{\"id\": \"{{uuid}}\", \"created\": true}",
  "schema_validation_enabled": true,
  "request_schema": "{\"type\": \"object\", \"required\": [\"email\", \"username\"], \"properties\": {\"email\": {\"type\": \"string\", \"format\": \"email\"}, \"username\": {\"type\": \"string\", \"minLength\": 3}, \"age\": {\"type\": \"integer\", \"minimum\": 0}}}"
}
```

**JSON Schema (formatted for readability):**
```json
{
  "type": "object",
  "required": ["email", "username"],
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "username": {
      "type": "string",
      "minLength": 3
    },
    "age": {
      "type": "integer",
      "minimum": 0
    }
  }
}
```

### Valid Request

```json
POST /api/your-entity/users
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "age": 25
}
```

**Response: 200 OK**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "created": true
}
```

### Invalid Request

```json
POST /api/your-entity/users
Content-Type: application/json

{
  "email": "invalid-email",
  "username": "ab"
}
```

**Response: 400 Bad Request**
```json
{
  "error": "Request validation failed",
  "details": "Validation failed at 'email': 'invalid-email' is not a 'email'"
}
```

### Advanced Schema Features

#### Nested Objects

```json
{
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "required": ["name", "email"],
      "properties": {
        "name": {"type": "string"},
        "email": {"type": "string", "format": "email"}
      }
    }
  }
}
```

#### Arrays

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "product_id": {"type": "string"},
          "quantity": {"type": "integer", "minimum": 1}
        }
      },
      "minItems": 1
    }
  }
}
```

#### Enumerations

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["pending", "processing", "completed", "failed"]
    }
  }
}
```

#### Pattern Matching

```json
{
  "type": "object",
  "properties": {
    "phone": {
      "type": "string",
      "pattern": "^\\+?[1-9]\\d{1,14}$"
    }
  }
}
```

### Use Cases

1. **API Contract Testing** - Ensure clients send correctly formatted data
2. **Integration Testing** - Validate request payloads match API specifications
3. **Development** - Catch integration issues early
4. **Documentation** - Schema serves as living documentation
5. **Debugging** - Get clear validation errors for malformed requests

---

## Combining Features

All three features can be used together for powerful testing scenarios.

### Example: E-commerce Order API

```json
{
  "name": "Process Order",
  "method": "POST",
  "path": "/orders",
  "response_code": 202,
  "response_body": "{\"order_id\": \"{{uuid}}\", \"status\": \"processing\", \"estimated_delivery\": \"{{date}}\", \"total_amount\": {{random_float:50:500}}}",
  
  "schema_validation_enabled": true,
  "request_schema": "{\"type\": \"object\", \"required\": [\"items\", \"callback_url\"], \"properties\": {\"items\": {\"type\": \"array\", \"minItems\": 1}, \"callback_url\": {\"type\": \"string\", \"format\": \"uri\"}}}",
  
  "callback_enabled": true,
  "callback_extract_from_request": true,
  "callback_extract_field": "callback_url",
  "callback_method": "POST",
  "callback_delay_ms": 10000
}
```

**What happens:**

1. **Schema Validation** - Request must have `items` array and `callback_url`
2. **Dynamic Response** - Each request gets unique UUID, random amount, current date
3. **Async Callback** - After 10 seconds, order confirmation sent to client's callback URL

**Client Request:**
```json
POST /api/store/orders
{
  "items": [
    {"product_id": "SKU123", "quantity": 2},
    {"product_id": "SKU456", "quantity": 1}
  ],
  "callback_url": "https://client.com/order-webhook"
}
```

**Immediate Response:**
```json
{
  "order_id": "8c9d4e5f-1234-5678-9abc-def012345678",
  "status": "processing",
  "estimated_delivery": "2025-10-23",
  "total_amount": 234.56
}
```

**Callback (after 10 seconds) to `https://client.com/order-webhook`:**
```json
{
  "endpoint": {
    "method": "POST",
    "path": "/api/store/orders"
  },
  "request": {
    "items": [
      {"product_id": "SKU123", "quantity": 2},
      {"product_id": "SKU456", "quantity": 1}
    ],
    "callback_url": "https://client.com/order-webhook"
  },
  "response": {
    "order_id": "8c9d4e5f-1234-5678-9abc-def012345678",
    "status": "processing",
    "estimated_delivery": "2025-10-23",
    "total_amount": 234.56
  },
  "timestamp": "2025-10-16T15:45:23.456789+00:00"
}
```

---

## API Reference

### Creating Endpoint with Advanced Features

**Endpoint:** `POST /admin/entities/{entity_id}/endpoints`

**Full Request Example:**
```json
{
  "name": "Advanced Endpoint",
  "method": "POST",
  "path": "/test",
  "response_body": "{\"id\": \"{{uuid}}\", \"timestamp\": {{timestamp}}}",
  "response_code": 200,
  "response_headers": {"X-Custom": "Header"},
  "delay_ms": 100,
  "is_active": true,
  
  "callback_enabled": true,
  "callback_url": "https://example.com/callback",
  "callback_method": "POST",
  "callback_delay_ms": 5000,
  "callback_extract_from_request": false,
  "callback_extract_field": null,
  
  "schema_validation_enabled": true,
  "request_schema": "{\"type\": \"object\", \"required\": [\"name\"]}"
}
```

### Updating Endpoint

**Endpoint:** `PUT /admin/endpoints/{endpoint_id}`

You can update any field independently. Only include fields you want to change.

**Example:**
```json
{
  "callback_delay_ms": 10000,
  "request_schema": "{\"type\": \"object\", \"required\": [\"email\", \"name\"]}"
}
```

---

## Tips and Best Practices

### Dynamic Placeholders

- Use placeholders to make your mocks more realistic
- Combine multiple placeholders for complex scenarios
- Remember: Each request generates new values

### Async Callbacks

- Test with longer delays to simulate real-world async processing
- Use callback extraction for multi-tenant scenarios
- Monitor logs to verify callbacks are sent successfully
- Ensure callback endpoints are accessible from the mock service

### Schema Validation

- Start with simple schemas and add complexity gradually
- Use online JSON Schema validators during development
- Include helpful descriptions in your schemas
- Test both valid and invalid payloads

### Performance

- Long callback delays don't block the response
- Callbacks run in the background (fire-and-forget)
- Schema validation adds minimal overhead
- Placeholder replacement is very fast

---

## Troubleshooting

### Callbacks Not Being Sent

1. Check that `callback_enabled` is `true`
2. Verify callback URL is accessible from the mock service
3. Check logs for callback errors
4. Ensure correct HTTP method is configured

### Schema Validation Errors

1. Validate your JSON Schema syntax using online tools
2. Check the error message for specific validation issues
3. Test schemas with sample payloads before deploying
4. Remember: Schema must be provided as a JSON string

### Placeholder Not Replaced

1. Ensure correct syntax: `{{placeholder_name}}`
2. Check placeholder name spelling
3. For parameterized placeholders, use correct format: `{{name:arg1:arg2}}`
4. Verify the placeholder is supported (see list above)

---

## Support

For more information, see:
- [Main README](../README.md)
- [Development Guide](./DEVELOPMENT_GUIDE.md)
- [Features Documentation](./FEATURES.md)
