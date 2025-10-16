# Technical Implementation Guide

## Overview

This guide provides technical details for developers working on or extending the Mock-Lab advanced features.

---

## Architecture

### Backend Components

#### 1. Placeholder Engine (`backend/placeholders.py`)

**Purpose**: Replace placeholders in text with dynamic values.

**Key Classes**:
- `PlaceholderEngine` - Main engine with registered handlers

**Supported Placeholders**: 21 types across 5 categories
- IDs: `{{uuid}}`, `{{guid}}`
- Timestamps: `{{timestamp}}`, `{{timestamp_iso}}`, `{{date}}`, etc.
- Random data: `{{random_name}}`, `{{random_email}}`, etc.
- Numbers: `{{random_int:min:max}}`, `{{random_float:min:max}}`
- Strings: `{{random_string:length}}`, `{{random_hex:length}}`

**Usage**:
```python
from backend.placeholders import replace_placeholders

response_body = replace_placeholders('{"id": "{{uuid}}"}')
# Result: {"id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"}
```

---

#### 2. Callback Handler (`backend/callbacks.py`)

**Purpose**: Send async HTTP callbacks to external URLs.

**Key Classes**:
- `CallbackHandler` - Async callback sender using httpx

**Features**:
- Fire-and-forget execution
- Configurable delays
- URL extraction from request data
- Custom payload support

**Usage**:
```python
from backend.callbacks import schedule_callback

schedule_callback(
    url="https://webhook.site/abc123",
    method="POST",
    payload={"order_id": "12345"},
    delay_ms=5000
)
```

---

#### 3. Schema Validator (`backend/schema_validator.py`)

**Purpose**: Validate JSON data against JSON schemas.

**Key Classes**:
- `SchemaValidator` - JSON Schema Draft 7 validator

**Features**:
- Schema validation
- Detailed error messages
- Format validation (email, uri, etc.)

**Usage**:
```python
from backend.schema_validator import validate_request

schema = '{"type": "object", "required": ["email"]}'
is_valid, error = validate_request(schema, {"email": "test@example.com"})
# is_valid: True, error: None
```

---

### Database Schema

**New Columns in `mock_endpoints`:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `callback_enabled` | BOOLEAN | FALSE | Enable callbacks |
| `callback_url` | VARCHAR | NULL | Static callback URL |
| `callback_method` | VARCHAR | 'POST' | HTTP method |
| `callback_delay_ms` | INTEGER | 0 | Delay in ms |
| `callback_extract_from_request` | BOOLEAN | FALSE | Extract URL from request |
| `callback_extract_field` | VARCHAR | NULL | JSON path for extraction |
| `callback_payload` | TEXT | NULL | Custom callback payload |
| `request_schema` | TEXT | NULL | JSON Schema |
| `schema_validation_enabled` | BOOLEAN | FALSE | Enable validation |

**Migration**: `backend/migrations.py` - `migrate_add_callback_and_schema_fields()`

---

### Request Flow

**Processing Order:**
1. Request arrives at dynamic endpoint
2. Parse request body as JSON (if applicable)
3. **Schema Validation** (if enabled) → Return 400 if invalid
4. Select active scenario
5. **Replace Placeholders** in response body
6. Apply delay (if configured)
7. Log request
8. **Schedule Callback** (if enabled, non-blocking)
9. Return response

---

## Frontend Architecture

### Components

#### PlaceholderTextarea
**Location**: Lines 85-236 in `frontend/src/App.jsx`

**Purpose**: Textarea with autocomplete for placeholders.

**Features**:
- Detects `{{` typing
- Shows filtered suggestions
- Keyboard navigation
- Smart insertion at cursor

**Props**:
```javascript
<PlaceholderTextarea
  value={text}
  onChange={handleChange}
  placeholder="Enter JSON..."
  rows={6}
  className="..."
/>
```

---

#### EndpointForm (Two-Step Wizard)
**Location**: Lines 1667-2368 in `frontend/src/App.jsx`

**State**:
- `currentStep` - 1 (Config) or 2 (Scenarios)
- `formData` - All endpoint configuration
- `currentScenario` - Scenario being edited

**Steps**:
1. **Configuration**: Basic info + advanced features (progressive disclosure)
2. **Scenarios**: Add/edit response scenarios

**Navigation**:
- Step 1 → Step 2: Validates name and path
- Step 2 → Step 1: Preserves all data

---

## Dependencies

### Python
- `httpx==0.25.0` - Async HTTP client for callbacks
- `jsonschema==4.20.0` - JSON Schema validation

### Installation
```bash
pip install -r requirements.txt
```

---

## Performance Considerations

### Placeholder Replacement
- **Overhead**: ~1-2ms per request
- **Implementation**: Regex-based, single pass
- **Optimization**: Compiled regex patterns

### Schema Validation
- **Overhead**: ~2-5ms per request (only when enabled)
- **Implementation**: jsonschema library
- **Optimization**: Validator caching could be added

### Callbacks
- **Overhead**: 0ms (non-blocking)
- **Implementation**: asyncio.create_task()
- **Timeout**: 30 seconds default
- **Error handling**: Logs errors, doesn't affect response

---

## Extension Points

### Adding New Placeholders

**File**: `backend/placeholders.py`

```python
class PlaceholderEngine:
    def __init__(self):
        self.handlers = {
            # Add new placeholder
            "my_placeholder": self._generate_my_value,
        }
    
    def _generate_my_value(self, *args):
        return "generated value"
```

**Frontend**: Add to `PLACEHOLDER_LIST` in `App.jsx`

```javascript
const PLACEHOLDER_LIST = [
  { value: '{{my_placeholder}}', label: 'My Placeholder', 
    description: 'My custom value', category: 'Custom' },
]
```

---

### Adding Callback Headers

**File**: `backend/callbacks.py`

Current implementation uses default headers. To add custom headers:

```python
async def send_callback(..., headers: Optional[Dict[str, str]] = None):
    callback_headers = headers or {}
    if "Content-Type" not in callback_headers:
        callback_headers["Content-Type"] = "application/json"
    
    # Add custom headers
    callback_headers["X-Custom-Header"] = "value"
```

---

### Custom Validation Rules

**File**: `backend/schema_validator.py`

To add custom format validators:

```python
from jsonschema import FormatChecker

checker = FormatChecker()

@checker.checks("custom_format")
def check_custom_format(instance):
    # Return True if valid, False otherwise
    return instance.startswith("CUSTOM-")

# Use in validation
validator = Draft7Validator(schema, format_checker=checker)
```

---

## Testing

### Backend Tests

**Unit Test Example**:
```python
from backend.placeholders import replace_placeholders

def test_uuid_placeholder():
    result = replace_placeholders('{"id": "{{uuid}}"}')
    assert '"id": "' in result
    assert len(result) > 50  # UUID is long
```

**Integration Test**: Run `test_callback_fields.py`

---

### Frontend Tests

**Component Test Example**:
```javascript
// Test autocomplete trigger
const textarea = screen.getByRole('textbox')
fireEvent.change(textarea, { target: { value: '{{' } })
expect(screen.getByText('Placeholder Suggestions')).toBeInTheDocument()
```

---

## Troubleshooting

### Callbacks Not Sending

**Check**:
1. `callback_enabled` is `True` in database
2. Backend logs show "Callback scheduled"
3. Network connectivity (firewall, outbound HTTPS)
4. URL is valid and accessible

**Debug**:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

### Placeholders Not Replaced

**Check**:
1. Syntax: `{{uuid}}` not `{{UUID}}`
2. Response body is valid JSON string
3. Placeholder name is correct

**Debug**:
```python
from backend.placeholders import placeholder_engine
print(placeholder_engine.handlers.keys())  # List all handlers
```

---

### Schema Validation Fails

**Check**:
1. Schema is valid JSON Schema
2. `schema_validation_enabled` is `True`
3. Request has `Content-Type: application/json`

**Debug**:
```python
from backend.schema_validator import is_valid_schema
is_valid, error = is_valid_schema(your_schema)
print(f"Valid: {is_valid}, Error: {error}")
```

---

## Security Considerations

### Callbacks
- **SSRF Risk**: Callbacks can hit internal URLs
- **Mitigation**: Consider adding URL allowlist
- **Future**: Implement domain restrictions

### Placeholders
- **No Risk**: Server-side only, no user input

### Schema Validation
- **DoS Risk**: Complex schemas could be slow
- **Mitigation**: Consider schema complexity limits
- **Current**: No limits enforced

---

## Performance Optimization

### Placeholder Caching
Currently not implemented. Could add:
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_compiled_pattern():
    return re.compile(r'\{\{([a-zA-Z_][a-zA-Z0-9_]*(?::[^}]*)?)\}\}')
```

### Schema Validator Caching
Could cache validators per schema:
```python
from functools import lru_cache

@lru_cache(maxsize=50)
def get_validator(schema_str):
    schema = json.loads(schema_str)
    return Draft7Validator(schema)
```

### Callback Connection Pooling
Already handled by httpx AsyncClient.

---

## Database Migration

### Running Migration
Automatic on app startup via `backend/migrations.py`

### Manual Migration (if needed)
```sql
-- SQLite
ALTER TABLE mock_endpoints ADD COLUMN callback_enabled INTEGER DEFAULT 0 NOT NULL;
-- ... (see migrations.py for complete list)

-- PostgreSQL
ALTER TABLE mock_endpoints ADD COLUMN callback_enabled BOOLEAN DEFAULT FALSE NOT NULL;
-- ... (see migrations.py for complete list)
```

### Rollback
```sql
ALTER TABLE mock_endpoints DROP COLUMN callback_enabled;
ALTER TABLE mock_endpoints DROP COLUMN callback_url;
-- ... (drop all 9 columns)
```

---

## API Reference

### Creating Endpoint with Advanced Features

**POST** `/admin/entities/{entity_id}/endpoints`

```json
{
  "name": "Order API",
  "method": "POST",
  "path": "/orders",
  "response_scenarios": [...],
  
  // Callback config
  "callback_enabled": true,
  "callback_url": "https://webhook.site/abc",
  "callback_method": "POST",
  "callback_delay_ms": 5000,
  "callback_extract_from_request": false,
  "callback_extract_field": null,
  "callback_payload": "{\"order_id\": \"{{uuid}}\"}",
  
  // Schema validation
  "schema_validation_enabled": true,
  "request_schema": "{\"type\": \"object\", \"required\": [\"items\"]}"
}
```

---

## Code Organization

```
backend/
├── placeholders.py      # Placeholder replacement engine
├── callbacks.py         # Async callback handler
├── schema_validator.py  # JSON Schema validator
├── models.py           # Database models (9 new columns)
├── schemas.py          # Pydantic models
├── main.py             # Integration point
└── migrations.py       # Database migration

frontend/src/
└── App.jsx
    ├── PlaceholderTextarea component (lines 85-236)
    ├── EndpointForm component (lines 1667-2368)
    └── PLACEHOLDER_LIST constant (lines 7-29)
```

---

## Development Workflow

### Adding a Feature

1. **Backend**:
   - Create new module if needed
   - Add database columns (models.py)
   - Add Pydantic fields (schemas.py)
   - Integrate in main.py
   - Add migration

2. **Frontend**:
   - Add form fields in EndpointForm
   - Update form state
   - Update handleSubmit
   - Add UI indicators

3. **Documentation**:
   - Update ADVANCED_FEATURES.md
   - Update PLACEHOLDER_REFERENCE.md (if applicable)

4. **Testing**:
   - Add to demo script
   - Manual testing
   - Update test checklist

---

## Monitoring & Debugging

### Backend Logs
```python
import logging
logger = logging.getLogger(__name__)

# Callback sending
logger.info(f"Callback scheduled for {url} with delay {delay_ms}ms")

# Placeholder replacement
logger.debug(f"Replaced {count} placeholders")

# Schema validation
logger.warning(f"Schema validation failed: {error}")
```

### Frontend Debugging
```javascript
// Enable debug logging
console.log('Submitting endpoint data:', submitData)
console.log('Loading endpoint for editing:', endpoint)
```

### Database Queries
```sql
-- Check callback configuration
SELECT id, name, callback_enabled, callback_url 
FROM mock_endpoints 
WHERE callback_enabled = 1;

-- Check schema validation
SELECT id, name, schema_validation_enabled 
FROM mock_endpoints 
WHERE schema_validation_enabled = 1;
```

---

## Future Enhancements

### Planned Improvements
1. Placeholder caching for better performance
2. Schema validator caching
3. Callback retry logic
4. SSRF protection (URL allowlist)
5. Response schema validation
6. More placeholder types

### Technical Debt
- None currently

---

## Support

For implementation questions:
- Read the source code (well-documented)
- Check examples in `examples_advanced_features.py`

For usage questions:
- See [USER_GUIDE.md](USER_GUIDE.md)
- See [PLACEHOLDER_REFERENCE.md](PLACEHOLDER_REFERENCE.md)
