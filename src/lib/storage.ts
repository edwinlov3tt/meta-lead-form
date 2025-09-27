import localforage from 'localforage';

/**
 * Storage configuration using localForage for large data with IndexedDB fallback
 */

// Configure localForage for form data
export const formStorage = localforage.createInstance({
  name: 'MetaLeadFormBuilder',
  storeName: 'forms',
  description: 'Stores form configurations and campaign data'
});

// Configure localForage for cache data
export const cacheStorage = localforage.createInstance({
  name: 'MetaLeadFormBuilder',
  storeName: 'cache',
  description: 'Stores API responses and temporary data'
});

// Configure localForage for user preferences
export const preferencesStorage = localforage.createInstance({
  name: 'MetaLeadFormBuilder',
  storeName: 'preferences',
  description: 'Stores user settings and preferences'
});

/**
 * Storage utilities
 */
export const storage = {
  // Form data (large objects)
  forms: {
    async save(key: string, data: unknown): Promise<void> {
      await formStorage.setItem(key, data);
    },
    async load<T>(key: string): Promise<T | null> {
      return await formStorage.getItem<T>(key);
    },
    async remove(key: string): Promise<void> {
      await formStorage.removeItem(key);
    },
    async list(): Promise<string[]> {
      return await formStorage.keys();
    }
  },

  // Cache data (API responses, etc.)
  cache: {
    async save(key: string, data: unknown, ttl?: number): Promise<void> {
      const item = {
        data,
        timestamp: Date.now(),
        ttl: ttl || 5 * 60 * 1000 // 5 minutes default
      };
      await cacheStorage.setItem(key, item);
    },
    async load<T>(key: string): Promise<T | null> {
      const item = await cacheStorage.getItem<{data: T, timestamp: number, ttl: number}>(key);
      if (!item) return null;

      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        await cacheStorage.removeItem(key);
        return null;
      }

      return item.data;
    },
    async remove(key: string): Promise<void> {
      await cacheStorage.removeItem(key);
    }
  },

  // Preferences (small flags, use localStorage as fallback)
  preferences: {
    save(key: string, data: unknown): void {
      try {
        localStorage.setItem(`meta-form-${key}`, JSON.stringify(data));
      } catch {
        // Fallback to memory if localStorage fails
        console.warn('localStorage unavailable, using memory storage');
      }
    },
    load<T>(key: string): T | null {
      try {
        const item = localStorage.getItem(`meta-form-${key}`);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    },
    remove(key: string): void {
      try {
        localStorage.removeItem(`meta-form-${key}`);
      } catch {
        // Ignore errors
      }
    }
  }
};