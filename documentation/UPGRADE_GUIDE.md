# Upgrade Guide

## What's New

Three powerful features + improved UI:
1. **Dynamic Placeholders** - 21 types (UUID, timestamps, random data, names, emails, etc.)
2. **Async Callbacks** - HTTP callbacks with delays and custom payloads
3. **Request Schema Validation** - JSON Schema Draft 7 validation
4. **UI Improvements** - Two-step wizard, placeholder autocomplete, progressive disclosure

**100% Backward Compatible** - Existing endpoints work unchanged!

---

## Quick Upgrade

### 1. Update Code & Dependencies

```bash
git pull origin main
pip install -r requirements.txt
```

**New dependencies**: `httpx`, `jsonschema`

### 2. Restart Application

```bash
python -m uvicorn backend.main:app --reload --port 8001
cd frontend && npm run dev
```

**Migration runs automatically** - You'll see migration logs in console.

### 3. Verify

- Existing endpoints still work ✅
- New UI shows two-step wizard ✅
- Type `{{` in textarea → autocomplete appears ✅

---

## Using New Features

### Dynamic Placeholders

Just use them in response bodies or callback payloads:

```json
{
  "id": "{{uuid}}",
  "user": "{{random_name}}",
  "created_at": "{{timestamp_iso}}",
  "balance": {{random_float:100:1000}}
}
```

**UI**: Type `{{` for autocomplete suggestions!

See [PLACEHOLDER_REFERENCE.md](PLACEHOLDER_REFERENCE.md) for all placeholders.

---

### Async Callbacks

**Step 1** of endpoint wizard:
- ☑ Check "Enable Async Callbacks"
- Enter callback URL (or extraction field path)
- Set HTTP method and delay
- Optional: Add custom callback payload

**Example custom payload:**
```json
{
  "order_id": "{{uuid}}",
  "completed_at": "{{timestamp_iso}}"
}
```

---

### Schema Validation

**Step 1** of endpoint wizard:
- ☑ Check "Enable Request Schema Validation"  
- Paste JSON Schema

**Example schema:**
```json
{
  "type": "object",
  "required": ["email"],
  "properties": {
    "email": {"type": "string", "format": "email"}
  }
}
```

Invalid requests return 400 with error details.

---

## Docker Deployment

```bash
cd deploy/docker
docker-compose down
docker-compose build
docker-compose up -d
```

Migration runs automatically on container start.

---

## Rollback (if needed)

```bash
git checkout <previous-commit>
pip install -r requirements.txt
```

Database columns can stay (will be ignored by old code).

---

## Support

- **Usage Guide**: [USER_GUIDE.md](USER_GUIDE.md)
- **Quick Reference**: [PLACEHOLDER_REFERENCE.md](PLACEHOLDER_REFERENCE.md)
- **Technical Details**: [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md)
- **Demo Script**: `python examples_advanced_features.py`
