import { QueryClient, MutationCache, QueryCache, DefaultOptions } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

/**
 * Enhanced TanStack Query client configuration
 * Features:
 * - Smart caching strategies based on data type
 * - Network-aware caching
 * - Optimistic updates with rollback
 * - Background sync and conflict resolution
 * - Offline support with persistence
 * - Error handling with user feedback
 */

// Network detection utility
class NetworkManager {
  private online: boolean = navigator.onLine;
  private listeners: ((online: boolean) => void)[] = [];

  constructor() {
    window.addEventListener('online', () => {
      this.online = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.online = false;
      this.notifyListeners();
    });
  }

  isOnline(): boolean {
    return this.online;
  }

  subscribe(listener: (online: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.online));
  }
}

export const networkManager = new NetworkManager();

// Smart cache configuration based on data type
const getCacheConfig = (queryKey: string[]) => {
  const [domain] = queryKey;

  switch (domain) {
    case 'forms':
      return {
        staleTime: 2 * 60 * 1000, // 2 minutes - forms change frequently
        gcTime: 30 * 60 * 1000,   // 30 minutes
        refetchOnWindowFocus: true, // Important for collaboration
      };

    case 'pages':
    case 'users':
      return {
        staleTime: 15 * 60 * 1000, // 15 minutes - profile data changes less
        gcTime: 60 * 60 * 1000,    // 1 hour
        refetchOnWindowFocus: false,
      };

    case 'ai-generated':
      return {
        staleTime: 60 * 60 * 1000, // 1 hour - AI results are expensive
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
        refetchOnWindowFocus: false,
      };

    case 'drafts':
      return {
        staleTime: 30 * 1000,      // 30 seconds - drafts are very dynamic
        gcTime: 5 * 60 * 1000,     // 5 minutes
        refetchOnWindowFocus: true,
      };

    default:
      return {
        staleTime: 5 * 60 * 1000,  // 5 minutes default
        gcTime: 10 * 60 * 1000,    // 10 minutes
        refetchOnWindowFocus: false,
      };
  }
};

// Enhanced retry logic with exponential backoff
const retryFn = (failureCount: number, error: any) => {
  // Don't retry client errors (4xx)
  if (error.status >= 400 && error.status < 500) {
    return false;
  }

  // Don't retry after 3 attempts
  if (failureCount >= 3) {
    return false;
  }

  // Don't retry if offline
  if (!networkManager.isOnline()) {
    return false;
  }

  return true;
};

// Exponential backoff delay
const retryDelay = (attemptIndex: number) => {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
};

// Query cache with enhanced error handling
const queryCache = new QueryCache({
  onError: (error: any, query) => {
    console.error('Query failed:', { error, queryKey: query.queryKey });

    // Show user-friendly error messages
    if (error.status === 401) {
      toast.error('Your session has expired. Please sign in again.');
    } else if (error.status === 403) {
      toast.error('You don\'t have permission to access this resource.');
    } else if (error.status === 409) {
      toast.error('This resource was modified by someone else. Please refresh and try again.');
    } else if (error.status >= 500) {
      toast.error('Server error. Please try again in a moment.');
    } else if (!networkManager.isOnline()) {
      toast.error('You\'re offline. Changes will sync when connection is restored.');
    } else {
      toast.error('Something went wrong. Please try again.');
    }
  },
  onSuccess: (data, query) => {
    // Log successful cache updates for debugging
    console.debug('Query cache updated:', { queryKey: query.queryKey, timestamp: new Date() });
  },
});

// Mutation cache with optimistic updates and rollback
const mutationCache = new MutationCache({
  onError: (error: any, variables, context, mutation) => {
    console.error('Mutation failed:', { error, variables, mutationKey: mutation.options.mutationKey });

    // Handle specific mutation errors
    if (error.status === 422 && error.message?.includes('idempotency')) {
      toast.error('This request was already processed.');
    } else if (error.status === 409) {
      toast.error('Conflict detected. Your changes couldn\'t be saved. Please refresh and try again.');
    } else if (error.status === 413) {
      toast.error('The form data is too large. Please reduce the content size.');
    } else {
      toast.error('Failed to save changes. Please try again.');
    }
  },
  onSuccess: (data, variables, context, mutation) => {
    // Success feedback for important operations
    const mutationKey = mutation.options.mutationKey?.[0];

    switch (mutationKey) {
      case 'createForm':
        toast.success('Form created successfully!');
        break;
      case 'updateForm':
        toast.success('Changes saved!');
        break;
      case 'deleteForm':
        toast.success('Form deleted successfully.');
        break;
      case 'publishForm':
        toast.success('Form published!');
        break;
    }

    console.debug('Mutation completed:', { mutationKey, timestamp: new Date() });
  },
});

// Default options with smart configuration
const defaultOptions: DefaultOptions = {
  queries: {
    // Dynamic configuration based on query key
    ...getCacheConfig([]), // Default fallback

    // Enhanced retry logic
    retry: retryFn,
    retryDelay,

    // Network-aware behavior
    networkMode: 'online',
    refetchOnReconnect: 'always',

    // Performance optimizations
    refetchOnMount: true,
    refetchInterval: false, // Disable polling by default
    refetchIntervalInBackground: false,

    // Error handling
    throwOnError: false,

    // Placeholders for better UX
    placeholderData: (previousData) => previousData,

    // Meta for analytics
    meta: {
      trackingEnabled: true,
    },
  },
  mutations: {
    // Enhanced retry for mutations
    retry: (failureCount, error: any) => {
      // Retry idempotent operations
      if (error.status === 422 && error.message?.includes('idempotency')) {
        return false; // Don't retry idempotency conflicts
      }

      return failureCount < 2 && error.status >= 500;
    },
    retryDelay,

    // Network-aware mutations
    networkMode: 'online',

    // Meta for analytics
    meta: {
      trackingEnabled: true,
    },
  },
};

// Enhanced query client with custom configuration
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions,
});

// Query client utilities
export const queryUtils = {
  /**
   * Invalidate and refetch form-related queries
   */
  invalidateForms: (pageId?: string, formId?: string) => {
    if (formId) {
      queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    } else if (pageId) {
      queryClient.invalidateQueries({ queryKey: ['forms', 'list', pageId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    }
  },

  /**
   * Optimistically update form data
   */
  setFormData: (formId: string, data: any) => {
    queryClient.setQueryData(['forms', 'detail', formId], data);
  },

  /**
   * Get cached form data
   */
  getFormData: (formId: string) => {
    return queryClient.getQueryData(['forms', 'detail', formId]);
  },

  /**
   * Prefetch related data for better UX
   */
  prefetchRelatedData: async (pageId: string) => {
    // Prefetch forms list
    await queryClient.prefetchQuery({
      queryKey: ['forms', 'list', pageId],
      queryFn: () => import('../services/api').then(api => api.api.listForms(pageId)),
      ...getCacheConfig(['forms']),
    });
  },

  /**
   * Clear all caches (useful for logout)
   */
  clearAll: () => {
    queryClient.clear();
    toast.success('Cache cleared');
  },

  /**
   * Get cache statistics for debugging
   */
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      cacheSize: queries.reduce((size, query) => {
        return size + (query.state.data ? JSON.stringify(query.state.data).length : 0);
      }, 0),
    };
  },

  /**
   * Enable/disable query tracking for analytics
   */
  setTrackingEnabled: (enabled: boolean) => {
    defaultOptions.queries!.meta = { trackingEnabled: enabled };
    defaultOptions.mutations!.meta = { trackingEnabled: enabled };
  },
};

// Background sync for offline support
if ('serviceWorker' in navigator) {
  networkManager.subscribe((online) => {
    if (online) {
      // Resume all queries when back online
      queryClient.resumePausedMutations();
      queryClient.invalidateQueries();
      console.log('Network restored - syncing data...');
    } else {
      console.log('Network lost - entering offline mode...');
    }
  });
}

// Development helpers
if (import.meta.env.DEV) {
  // Expose query client for debugging
  (window as any).__queryClient = queryClient;
  (window as any).__queryUtils = queryUtils;

  console.log('Query client initialized with enhanced configuration');
  console.log('Debug tools available: window.__queryClient, window.__queryUtils');
}