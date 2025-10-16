# 🚀 Quick Start - Advanced Features

## Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

**New dependencies**: `httpx`, `jsonschema` (for callbacks and validation)

---

## Start Application

```bash
# Backend
python -m uvicorn backend.main:app --reload --port 8001

# Frontend (new terminal)
cd frontend && npm run dev
```

**Migration runs automatically** on first start!

---

## Try the Demo

```bash
python examples_advanced_features.py
```

This demonstrates all three features in action.

---

## Create Your First Advanced Endpoint

### Using the UI

1. **Open** http://localhost:3000
2. **Login/Register** and create an entity
3. **Click** "Create Endpoint"

**Step 1: Configuration**
- Fill basic info (name, method, path)
- ☑ Optional: Enable Schema Validation
- ☑ Optional: Enable Async Callbacks
- Click "Next"

**Step 2: Scenarios**
- Add response scenario
- **Type `{{`** → See autocomplete! ⚡
- Select placeholders to insert
- Click "Create Endpoint"

**Done!** 🎉

---

## Quick Examples

### Dynamic Placeholders

Type `{{` for autocomplete, or use directly:

```json
{
  "id": "{{uuid}}",
  "user": "{{random_name}}",
  "email": "{{random_email}}",
  "created_at": "{{timestamp_iso}}",
  "balance": {{random_float:100:1000}}
}
```

**Each request gets different values!**

---

### Async Callbacks

Enable callbacks in Step 1:
- URL: `https://webhook.site/your-unique-url`
- Delay: `5000` ms
- Optional custom payload with placeholders

**Callback sent 5 seconds after response!**

---

### Schema Validation

Enable validation in Step 1, add schema:

```json
{
  "type": "object",
  "required": ["email"],
  "properties": {
    "email": {"type": "string", "format": "email"}
  }
}
```

**Invalid requests get 400 error!**

---

## Documentation

- **Placeholders**: [PLACEHOLDER_REFERENCE.md](PLACEHOLDER_REFERENCE.md)
- **Complete Guide**: [USER_GUIDE.md](USER_GUIDE.md)
- **Technical Details**: [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md)
- **All Docs**: [README.md](README.md)

---

## 🎉 That's It!

You're ready to use all advanced features. Enjoy! 🚀
