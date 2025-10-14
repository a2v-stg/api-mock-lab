# Entity Access Control Feature

## Overview

This document describes the private and public/shared entities feature that has been added to Mock-Lab. This feature allows users to control the visibility and access to their entities based on authentication.

## Features Added

### 1. Entity Ownership
- Each entity now has an `owner_id` field that tracks who created the entity
- Only the owner can delete or modify entity settings
- Entities created require authentication

### 2. Public/Private Entities
- **Private Entities (default)**: Only accessible to the owner and users it's shared with
- **Public Entities**: Visible and accessible to everyone, including non-authenticated users
- Owners can toggle entity visibility between public and private

### 3. Entity Sharing
- Owners can share their private entities with specific users
- Shared users get full access to view and use the entity's endpoints
- Owners can revoke access at any time
- Many-to-many relationship between users and entities for sharing

## Backend Changes

### Models (`backend/models.py`)
- Added `owner_id` field to `Entity` model
- Added `is_public` boolean field to `Entity` model (default: False)
- Added relationship to owner user
- Enhanced user-entity many-to-many relationship for sharing

### Schemas (`backend/schemas.py`)
- Updated `EntityCreate` to include `is_public` field
- Added `EntityUpdate` schema for modifying entity settings
- Added `EntityShareRequest` schema for sharing entities
- Updated `EntityResponse` to include ownership and visibility fields

### API Endpoints (`backend/main.py`)

#### New Authentication Dependencies
- `get_current_user_dependency`: Requires valid Bearer token
- `get_optional_user`: Optionally gets current user (doesn't fail if not authenticated)
- `check_entity_access`: Checks if user has access to an entity
- `require_entity_access`: Raises 403 if user doesn't have access
- `require_entity_ownership`: Raises 403 if user is not the owner

#### Modified Endpoints

**Entity Management:**
- `POST /admin/entities`: Now requires authentication, sets owner_id automatically
- `GET /admin/entities`: Filters entities based on user access (owned, shared, public)
- `GET /admin/entities/{id}`: Checks access permissions
- `PUT /admin/entities/{id}`: New endpoint for updating entity settings (owner only)
- `DELETE /admin/entities/{id}`: Now requires ownership

**New Sharing Endpoints:**
- `POST /admin/entities/{id}/share`: Share entity with another user (owner only)
- `DELETE /admin/entities/{id}/share/{user_id}`: Revoke access (owner only)
- `GET /users`: List all users (authenticated users only, for sharing)

**Mock Endpoints & Logs:**
- All mock endpoint operations now check entity access permissions
- All log operations now check entity access permissions
- WebSocket connections check access for private entities

## Frontend Changes

### Entity Creation
- Added checkbox to make entity public during creation
- Default is private

### Entity List (`EntitiesPage`)
- Shows PUBLIC badge for public entities
- Shows SHARED badge for entities shared with current user
- Only shows delete button for entities you own
- Displays ownership status visually

### Entity Detail (`EntityDetail`)
- Added "Settings & Share" button (owner only)
- New settings panel with:
  - **Visibility Toggle**: Switch between public/private with visual indicator
  - **Share with Users**: Dropdown to select and share with other users
  - **Shared Users List**: Shows who the entity is shared with and allows revoking access

### Visual Indicators
- 🔒 Lock icon for private entities
- 🌐 Globe icon for public entities
- Color-coded badges (GREEN for public, BLUE for shared)
- Toggle switch for visibility settings

## Access Control Rules

### Public Entities
- ✅ Anyone can view (even unauthenticated)
- ✅ Anyone can access endpoints and logs
- ✅ Only owner can modify settings
- ✅ Only owner can delete

### Private Entities
- ✅ Owner has full access
- ✅ Shared users can view and use endpoints
- ❌ Non-shared users cannot access
- ❌ Unauthenticated users cannot access
- ✅ Only owner can share with others
- ✅ Only owner can modify or delete

### Shared Entities
- ✅ Shared users can view entity details
- ✅ Shared users can view and manage endpoints
- ✅ Shared users can view logs
- ❌ Shared users cannot modify entity settings
- ❌ Shared users cannot delete the entity
- ❌ Shared users cannot share with others

## Usage Examples

### Creating a Private Entity
```bash
curl -X POST http://localhost:8001/admin/entities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-private-app", "is_public": false}'
```

### Creating a Public Entity
```bash
curl -X POST http://localhost:8001/admin/entities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "public-api", "is_public": true}'
```

### Making an Entity Public
```bash
curl -X PUT http://localhost:8001/admin/entities/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_public": true}'
```

### Sharing an Entity
```bash
curl -X POST http://localhost:8001/admin/entities/1/share \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2}'
```

### Revoking Access
```bash
curl -X DELETE http://localhost:8001/admin/entities/1/share/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Migration

The feature adds two new fields to the `entities` table:
- `owner_id` (Integer, nullable, foreign key to users.id)
- `is_public` (Boolean, default: False)

### Automatic Migration

**Migrations run automatically on backend startup!** The migration system (`backend/migrations.py`) will:
- Check if the new columns exist
- Add them if they're missing
- Work with both SQLite and PostgreSQL
- Run safely without affecting existing data

Just restart your backend with:
```bash
./start-backend.sh
# or
make up
# or
uvicorn backend.main:app --reload --port 8001
```

You'll see migration logs in the console:
```
INFO:     Running database migrations...
INFO:     Adding owner_id column to entities table
INFO:     ✓ Added owner_id column
INFO:     Adding is_public column to entities table
INFO:     ✓ Added is_public column
INFO:     All migrations completed successfully
```

### Existing Entities

After migration, existing entities will have:
- `owner_id` = NULL (no owner assigned)
- `is_public` = False (private by default)

**Optional**: You may want to assign owners to existing entities or make them public:

```sql
-- Make existing entities public
UPDATE entities SET is_public = true WHERE owner_id IS NULL;

-- Or assign to a specific user
UPDATE entities SET owner_id = 1 WHERE owner_id IS NULL;
```

## Security Considerations

1. **Authentication Required**: All entity creation, modification, and deletion now require authentication
2. **Authorization Checks**: Every operation checks if the user has appropriate access
3. **Bearer Token**: Uses Bearer token format in Authorization header
4. **Owner Validation**: Ownership is verified server-side, not just in UI
5. **WebSocket Security**: Private entity WebSocket connections require authentication

## Testing the Feature

1. **Register two users**
2. **User 1**: Create a private entity
3. **User 2**: Should not see the private entity
4. **User 1**: Share entity with User 2
5. **User 2**: Should now see and access the entity
6. **User 1**: Make entity public
7. **Logout**: Public entity should be visible without authentication
8. **User 1**: Revoke User 2's access
9. **User 2**: Should no longer see the entity (unless it's public)

## Future Enhancements

Potential improvements:
- [ ] Role-based permissions (viewer vs editor)
- [ ] Team/organization support
- [ ] Share via link with expiration
- [ ] Audit log for access changes
- [ ] Email notifications for sharing
- [ ] API key-based access for public entities
