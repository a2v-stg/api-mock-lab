# Dynamic Placeholder Quick Reference

## UUID & GUID
```
{{uuid}}              → a3d4e5f6-1234-5678-9abc-def012345678
{{uuid4}}             → b2c3d4e5-9876-5432-1fed-cba098765432
{{guid}}              → c1d2e3f4-5678-9012-3456-789abcdef012
```

## Timestamps
```
{{timestamp}}         → 1729089045123 (Unix ms)
{{timestamp_unix}}    → 1729089045 (Unix seconds)
{{timestamp_iso}}     → 2025-10-16T14:30:45.123456+00:00
{{date}}              → 2025-10-16
{{datetime}}          → 2025-10-16 14:30:45
{{time}}              → 14:30:45
```

## Random Numbers
```
{{random}}            → 437 (0-1000)
{{random:100}}        → 67 (0-100)
{{random_int:1:100}}  → 42 (1-100)
{{random_float:0:10}} → 7.23 (0-10)
```

## Random Strings
```
{{random_string}}         → AbCdEfGhIj (10 chars)
{{random_string:5}}       → XyZpQ (5 chars)
{{random_hex:16}}         → a1b2c3d4e5f67890
{{random_alphanumeric:8}} → Ab3Xy9Km
```

## Random Personal Data
```
{{random_name}}       → John Smith
{{random_first_name}} → Sarah
{{random_last_name}}  → Johnson
{{random_email}}      → xyz789@example.com
{{random_username}}   → user3k9p2m
```

## Random Boolean
```
{{random_bool}}       → true
{{random_boolean}}    → false
```

## Example Response Body

```json
{
  "id": "{{uuid}}",
  "user": {
    "name": "{{random_name}}",
    "email": "{{random_email}}",
    "username": "{{random_username}}"
  },
  "created_at": "{{timestamp_iso}}",
  "score": {{random_int:1:100}},
  "balance": {{random_float:10:1000}},
  "token": "{{random_hex:32}}",
  "is_active": {{random_bool}},
  "metadata": {
    "date": "{{date}}",
    "session_id": "{{uuid}}"
  }
}
```

## Notes
- Each placeholder generates a NEW value per request
- Placeholders work in response bodies only
- No escaping needed, just use the placeholder syntax
- Case-sensitive: `{{UUID}}` won't work, use `{{uuid}}`
