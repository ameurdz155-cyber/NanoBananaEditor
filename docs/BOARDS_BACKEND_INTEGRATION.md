# Gallery Boards - Backend Integration

## Overview
Gallery boards (folders) are now persisted to the backend and associated with user accounts. This ensures boards are saved across sessions and synchronized across devices.

## Backend API

### Endpoints

#### `POST /api/v1/boards`
Create a new board for the current user.

**Request Body:**
```json
{
  "name": "My Board",
  "emoji": "🎨",
  "description": "Optional description"
}
```

**Response:** `201 Created`
```json
{
  "id": "board-uuid-here",
  "name": "My Board",
  "emoji": "🎨",
  "description": "Optional description",
  "created_at": 1699564800000,
  "updated_at": 1699564800000,
  "image_ids": [],
  "user_id": "user-id"
}
```

**Errors:**
- `409 Conflict` - Board with this name already exists
- `401 Unauthorized` - Not logged in

---

#### `GET /api/v1/boards`
Get all boards for the current user.

**Response:** `200 OK`
```json
[
  {
    "id": "board-uuid",
    "name": "My Board",
    "emoji": "🎨",
    "description": "",
    "created_at": 1699564800000,
    "updated_at": 1699564800000,
    "image_ids": ["img1", "img2"],
    "user_id": "user-id"
  }
]
```

---

#### `GET /api/v1/boards/{board_id}`
Get a specific board by ID.

**Response:** `200 OK`
```json
{
  "id": "board-uuid",
  "name": "My Board",
  ...
}
```

**Errors:**
- `404 Not Found` - Board doesn't exist or doesn't belong to user

---

#### `PUT /api/v1/boards/{board_id}`
Update a board's information.

**Request Body:**
```json
{
  "name": "Updated Name",
  "emoji": "✨",
  "description": "New description"
}
```

**Response:** `200 OK` - Returns updated board

**Errors:**
- `404 Not Found` - Board not found
- `409 Conflict` - Name already exists

---

#### `DELETE /api/v1/boards/{board_id}`
Delete a board.

**Response:** `204 No Content`

**Errors:**
- `404 Not Found` - Board not found

---

#### `POST /api/v1/boards/{board_id}/images`
Add images to a board.

**Request Body:**
```json
{
  "image_ids": ["img1", "img2", "img3"]
}
```

**Response:** `200 OK` - Returns updated board with merged image_ids

---

#### `DELETE /api/v1/boards/{board_id}/images/{image_id}`
Remove an image from a board.

**Response:** `200 OK` - Returns updated board

---

## Frontend Integration

### Store Methods

All board operations in the store are now async and sync with the backend:

```typescript
// Load boards from backend (called on app start)
await loadBoardsFromBackend();

// Create a new board
await addBoard({
  id: 'board-123',
  name: 'My Board',
  description: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  imageIds: []
});

// Update board
await updateBoard('board-123', {
  name: 'New Name',
  emoji: '🎨'
});

// Delete board
await deleteBoard('board-123');

// Add image to board
await addImageToBoard('board-123', 'image-456');

// Remove image from board
await removeImageFromBoard('board-123', 'image-456');
```

### Error Handling

All methods include fallback to local-only storage if backend fails:
- If backend request fails, operation still applies locally
- Errors are logged to console
- User sees error message for creation/update failures

### Auto-sync on Login

When a user logs in or the app loads with a current project:
1. `loadBoardsFromBackend()` is called
2. Backend boards replace local boards
3. User sees their saved boards from any device

## Database Schema

Boards are stored in TinyDB in the `boards` table:

```python
{
  "id": "board-uuid",
  "name": "My Board",
  "emoji": "🎨",
  "description": "Optional description",
  "created_at": 1699564800000,  # milliseconds timestamp
  "updated_at": 1699564800000,  # milliseconds timestamp
  "image_ids": ["img1", "img2"],
  "user_id": "user-id-from-jwt"
}
```

### Indexes
- `user_id` - for filtering boards by user
- `id` - for quick lookups

## Security

- All board endpoints require authentication via JWT
- Users can only access their own boards
- Board name uniqueness is enforced per-user (not globally)
- UUID-based board IDs prevent enumeration attacks

## Usage Example

### Creating a Board in UI

```tsx
const handleConfirmCreateBoard = async () => {
  try {
    await addBoard({
      id: `board-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      name: newBoardName.trim(),
      description: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      imageIds: []
    });
    
    setShowCreateBoardModal(false);
  } catch (error) {
    setCreateBoardError(error.message);
  }
};
```

### Adding Image to Board

```tsx
// When user drags image to board
await addImageToBoard(targetBoardId, imageId);
```

## Testing

To test the API:

1. Start backend: `cd gemini_tunnel && uvicorn main:app --reload`
2. Login to get JWT token
3. Use token in Authorization header: `Bearer <token>`
4. Test endpoints with curl or Postman:

```bash
# Create board
curl -X POST http://localhost:9000/api/v1/boards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Board", "emoji": "🎨"}'

# Get boards
curl http://localhost:9000/api/v1/boards \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Migration Notes

- Existing local boards are not automatically migrated
- After login, backend boards replace local boards
- Users should create boards after logging in
- Future: Add migration tool to sync local → backend

## Future Enhancements

- [ ] Bulk image operations
- [ ] Board sharing between users
- [ ] Board templates
- [ ] Reorder boards
- [ ] Board cover images
- [ ] Export/import boards
- [ ] Board categories/tags
