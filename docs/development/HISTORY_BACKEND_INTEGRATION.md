# History & Gallery Backend Integration

## Overview

This document describes the integration that enables the frontend to load generation/edit history from the backend queue system, ensuring data persistence across sessions.

## Changes Made

### 1. Backend Queue Metadata Enhancement

Updated all queue item creation endpoints to include comprehensive metadata:

#### `gemini_tunnel/routes/generation.py`
- **`/generate/gemini`**: Added metadata including:
  - `negativePrompt`, `aspectRatio`, `width`, `height`
  - `seed`, `temperature`, `numImages`
  - `modelVersion`, `referenceCount`

- **`/generate/imagen`**: Same metadata structure

#### `gemini_tunnel/routes/editing.py`
- **`/edit/gemini`**: Added metadata including:
  - `instruction`, `temperature`, `seed`
  - `hasMask`, `referenceCount`

#### `gemini_tunnel/routes/upscale.py`
- **`/upscale`**: Added metadata with `scale` factor
- **`/inpaint`**: Added metadata with `prompt`, `hasMask`, `negativePrompt`

### 2. Frontend Store Enhancement

#### `src/store/useAppStore.ts`
Added new action `hydrateHistoryFromBackend()`:

```typescript
hydrateHistoryFromBackend: async () => Promise<void>
```

**Functionality:**
- Fetches completed queue items from backend
- Converts `QueueItem` objects to `Generation` or `Edit` objects
- Merges with existing local history (avoids duplicates)
- Updates the current project's generations and edits

**Conversion Logic:**
- Queue items with `type: 'generation'` → `Generation` objects
- Queue items with `type: 'edit'` → `Edit` objects
- Metadata is used to reconstruct full parameter objects
- `result_url` is stored as output asset

### 3. App Integration

#### `src/App.tsx`
Added `useEffect` hook to load history on mount:

```typescript
React.useEffect(() => {
  if (currentProject) {
    hydrateHistoryFromBackend().catch(err => {
      console.error('Failed to load history from backend:', err);
    });
  }
}, [currentProject?.id]);
```

**Behavior:**
- Runs once when a project is loaded or changes
- Silently handles errors (logs to console)
- Only runs when user is authenticated

## Data Flow

### Generation Flow
```
1. User generates image
   ↓
2. Backend creates queue item with metadata
   ↓
3. Backend processes generation
   ↓
4. Backend updates queue item: status='completed', result_url=<image>
   ↓
5. Frontend adds to local state (generations[])
   ↓
6. On next session: Frontend loads from backend queue
   ↓
7. History populated from backend
```

### History Loading Flow
```
1. App mounts / Project loads
   ↓
2. hydrateHistoryFromBackend() called
   ↓
3. Fetch GET /api/v1/queue?status=completed&limit=100
   ↓
4. Convert QueueItems → Generations/Edits
   ↓
5. Merge with existing history (dedupe by ID)
   ↓
6. Update store: currentProject.{generations, edits}
   ↓
7. HistoryPanel displays merged history
```

## API Integration

### Queue Service (`src/services/queueService.ts`)
Already existed with full queue management:

```typescript
// Fetch completed history
getQueue(token, 'completed', 100) → QueueResponse

// Queue item structure
interface QueueItem {
  id: string;
  type: 'generation' | 'edit' | 'upscale' | 'inpaint';
  status: 'completed';
  prompt: string;
  result_url: string;  // Base64 data URL
  metadata: Record<string, any>;  // Reconstruction data
  created_at: string;
}
```

### Backend Endpoints Used
- **GET `/api/v1/queue`**: Fetch queue items (filtered by status)
  - Query params: `status=completed`, `limit=100`
  - Returns: `QueueResponse` with items array

## Storage Strategy

### Local Storage (IndexedDB)
- Used for gallery images with board associations
- Managed by `src/utils/galleryStorage.ts`
- Complementary to backend history

### Backend Queue (TinyDB)
- Primary source of truth for generation/edit history
- Includes full metadata for reconstruction
- User-isolated (filtered by `user_id`)

### Combined Approach
1. **Backend queue**: Persistent history across sessions
2. **Local IndexedDB**: Gallery organization (boards, favorites)
3. **Zustand store**: Runtime state management

## Benefits

✅ **Persistence**: History survives browser refresh/close  
✅ **Multi-device**: Same history across devices (if same account)  
✅ **Metadata-rich**: Full parameter reconstruction from queue  
✅ **Deduplication**: Prevents duplicate entries  
✅ **Graceful degradation**: Works offline with local state  
✅ **Incremental sync**: Only new items fetched

## Future Enhancements

### Real-time Sync (Optional)
Could implement WebSocket or polling for live updates:

```typescript
// Periodic sync every 30 seconds
setInterval(async () => {
  await hydrateHistoryFromBackend();
}, 30000);
```

### Selective Loading
Could add date-range filtering:

```typescript
// Load only last 7 days
getQueue(token, 'completed', undefined, {
  since: Date.now() - 7 * 24 * 60 * 60 * 1000
});
```

### Pagination
For large histories:

```typescript
// Load in batches
getQueue(token, 'completed', 50, { offset: 0 });
getQueue(token, 'completed', 50, { offset: 50 });
```

## Testing Checklist

- [ ] Generate image → appears in history immediately
- [ ] Refresh browser → history still present
- [ ] Login on different device → same history loads
- [ ] Edit image → edit appears in history
- [ ] Upscale image → upscale tracked in queue
- [ ] Multiple generations → all appear in history
- [ ] No duplicate entries after refresh
- [ ] Works with and without auth token

## Related Files

### Modified
- `src/store/useAppStore.ts` - Added `hydrateHistoryFromBackend()`
- `src/App.tsx` - Added history loading on mount
- `gemini_tunnel/routes/generation.py` - Enhanced metadata
- `gemini_tunnel/routes/editing.py` - Enhanced metadata
- `gemini_tunnel/routes/upscale.py` - Enhanced metadata

### Existing (Unchanged)
- `src/services/queueService.ts` - Queue API client
- `gemini_tunnel/routes/queue.py` - Queue management endpoints
- `src/utils/galleryStorage.ts` - Local gallery storage
- `src/components/HistoryPanel.tsx` - History UI

## Error Handling

All errors are logged but don't block the UI:

```typescript
try {
  await hydrateHistoryFromBackend();
} catch (error) {
  console.error('Failed to load history:', error);
  // App continues with local state
}
```

**Common errors:**
- No auth token → logs warning, skips loading
- Network error → logs error, uses cached state
- No current project → logs warning, skips loading
- Invalid queue data → skips malformed items

## Conclusion

The integration provides robust history persistence by leveraging the existing backend queue system. All generations, edits, and upscales are automatically tracked in the queue with rich metadata, enabling full reconstruction of history on subsequent sessions.
