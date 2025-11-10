import { joinBackendPath, buildJsonHeaders } from './apiConfig';

export interface QueueItem {
  id: string;
  user_id: string;
  type: 'generation' | 'edit' | 'upscale' | 'inpaint';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt?: string;
  preview_url?: string;
  result_url?: string;
  error_message?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface QueueResponse {
  items: QueueItem[];
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface CreateQueueItemRequest {
  type: 'generation' | 'edit' | 'upscale' | 'inpaint';
  prompt?: string;
  preview_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateQueueItemRequest {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result_url?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

/**
 * Get queue items for the current user
 */
export async function getQueue(
  token: string,
  status?: string,
  limit?: number
): Promise<QueueResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (limit) params.append('limit', limit.toString());

  const url = joinBackendPath(`/api/v1/queue?${params.toString()}`);
  const response = await fetch(url, {
    headers: {
      ...buildJsonHeaders(),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get queue: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new queue item
 */
export async function createQueueItem(
  token: string,
  request: CreateQueueItemRequest
): Promise<QueueItem> {
  const url = joinBackendPath('/api/v1/queue');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...buildJsonHeaders(),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create queue item: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific queue item
 */
export async function getQueueItem(
  token: string,
  itemId: string
): Promise<QueueItem> {
  const url = joinBackendPath(`/api/v1/queue/${itemId}`);
  const response = await fetch(url, {
    headers: {
      ...buildJsonHeaders(),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get queue item: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update a queue item
 */
export async function updateQueueItem(
  token: string,
  itemId: string,
  request: UpdateQueueItemRequest
): Promise<QueueItem> {
  const url = joinBackendPath(`/api/v1/queue/${itemId}`);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...buildJsonHeaders(),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to update queue item: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a queue item
 */
export async function deleteQueueItem(
  token: string,
  itemId: string
): Promise<void> {
  const url = joinBackendPath(`/api/v1/queue/${itemId}`);
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...buildJsonHeaders(),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete queue item: ${response.statusText}`);
  }
}

/**
 * Clear all completed and failed queue items
 */
export async function clearCompletedQueue(token: string): Promise<void> {
  const url = joinBackendPath('/api/v1/queue');
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...buildJsonHeaders(),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to clear completed queue: ${response.statusText}`);
  }
}

/**
 * Poll queue for updates
 */
export async function pollQueue(
  token: string,
  onUpdate: (queue: QueueResponse) => void,
  interval: number = 3000
): Promise<() => void> {
  const intervalId = setInterval(async () => {
    try {
      const queue = await getQueue(token);
      onUpdate(queue);
    } catch (error) {
      console.error('Failed to poll queue:', error);
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
