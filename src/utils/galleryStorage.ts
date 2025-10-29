/**
 * IndexedDB-based gallery storage for images
 * Much larger capacity than localStorage
 */

const DB_NAME = 'AI_POD_Gallery';
const DB_VERSION = 1;
const STORE_NAME = 'images';

interface GalleryImage {
  id: string;
  url: string;
  boardId: string;
  boardName: string;
  timestamp: number;
  path?: string;
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('boardId', 'boardId', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save image to IndexedDB gallery
 */
export async function saveImageToGalleryDB(
  imageId: string,
  imageUrl: string,
  boardId: string,
  boardName: string,
  path?: string
): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const imageData: GalleryImage = {
      id: imageId,
      url: imageUrl,
      boardId,
      boardName,
      timestamp: Date.now(),
      path
    };

    return new Promise((resolve, reject) => {
      const request = store.put(imageData);
      request.onsuccess = () => {
        console.log(`Image ${imageId} saved to ${boardName} gallery in IndexedDB`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    return false;
  }
}

/**
 * Get all images for a specific board
 */
export async function getImagesForBoard(boardId: string): Promise<GalleryImage[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('boardId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(boardId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting images from IndexedDB:', error);
    return [];
  }
}

/**
 * Get a specific image by ID
 */
export async function getImageById(imageId: string): Promise<GalleryImage | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(imageId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting image from IndexedDB:', error);
    return null;
  }
}

/**
 * Delete an image from gallery
 */
export async function deleteImageFromGallery(imageId: string): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(imageId);
      request.onsuccess = () => {
        console.log(`Image ${imageId} deleted from gallery`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error deleting from IndexedDB:', error);
    return false;
  }
}

/**
 * Get all images across all boards
 */
export async function getAllImages(): Promise<GalleryImage[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting all images from IndexedDB:', error);
    return [];
  }
}
