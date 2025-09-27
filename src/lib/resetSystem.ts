import localforage from 'localforage';
import { queryClient } from './queryClient';
import { destroyAllDraftManagers } from './draftManager';

/**
 * Comprehensive Reset System
 * Purges all application data and provides a clean slate
 */

export interface ResetOptions {
  /** Force reset without confirmation dialog */
  skipConfirmation?: boolean;
  /** Reload page after reset (recommended) */
  reloadPage?: boolean;
  /** Custom callback after reset but before page reload */
  onResetComplete?: () => void;
  /** Show detailed progress during reset */
  showProgress?: boolean;
}

export interface ResetProgress {
  step: string;
  completed: number;
  total: number;
  isComplete: boolean;
  error?: string;
}

/**
 * Application-wide hard reset function
 * Clears all local data and caches
 */
export async function hardReset(options: ResetOptions = {}): Promise<void> {
  const {
    skipConfirmation = false,
    reloadPage = true,
    onResetComplete,
    showProgress = false,
  } = options;

  // Show confirmation dialog unless skipped
  if (!skipConfirmation) {
    const shouldReset = await showResetConfirmation();
    if (!shouldReset) {
      return;
    }
  }

  const progressCallback = showProgress ?
    (progress: ResetProgress) => {
      console.log(`Reset Progress: ${progress.step} (${progress.completed}/${progress.total})`);
      window.dispatchEvent(new CustomEvent('reset:progress', { detail: progress }));
    } :
    undefined;

  try {
    await performReset(progressCallback);

    // Call custom callback if provided
    onResetComplete?.();

    // Dispatch completion event
    window.dispatchEvent(new CustomEvent('reset:complete'));

    // Reload page for clean slate
    if (reloadPage) {
      window.location.reload();
    }
  } catch (error) {
    console.error('Hard reset failed:', error);
    window.dispatchEvent(new CustomEvent('reset:error', {
      detail: { error: error instanceof Error ? error.message : 'Unknown error' }
    }));
    throw error;
  }
}

/**
 * Core reset implementation
 */
async function performReset(
  onProgress?: (progress: ResetProgress) => void
): Promise<void> {
  const steps = [
    'Clearing localForage data',
    'Clearing TanStack Query cache',
    'Clearing sessionStorage',
    'Clearing localStorage',
    'Destroying draft managers',
    'Resetting in-memory state',
  ];

  let completed = 0;
  const total = steps.length;

  const updateProgress = (step: string, error?: string) => {
    onProgress?.({
      step,
      completed,
      total,
      isComplete: completed === total,
      error,
    });
  };

  try {
    // Step 1: Clear all localForage data with mlfb: prefix
    updateProgress(steps[0]);
    await clearLocalForageData();
    completed++;

    // Step 2: Clear TanStack Query cache
    updateProgress(steps[1]);
    await clearQueryCache();
    completed++;

    // Step 3: Clear sessionStorage (wizard breadcrumbs, etc.)
    updateProgress(steps[2]);
    await clearSessionStorage();
    completed++;

    // Step 4: Clear localStorage with mlfb: prefix
    updateProgress(steps[3]);
    await clearLocalStorage();
    completed++;

    // Step 5: Destroy draft managers
    updateProgress(steps[4]);
    await clearDraftManagers();
    completed++;

    // Step 6: Reset in-memory state
    updateProgress(steps[5]);
    await resetInMemoryState();
    completed++;

    updateProgress('Reset complete');
  } catch (error) {
    updateProgress(`Failed at step: ${steps[completed]}`,
      error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Clear all localForage data with mlfb: prefix
 */
async function clearLocalForageData(): Promise<void> {
  try {
    const keys = await localforage.keys();
    const mlfbKeys = keys.filter(key => key.startsWith('mlfb:'));

    if (mlfbKeys.length > 0) {
      await Promise.all(mlfbKeys.map(key => localforage.removeItem(key)));
      console.log(`Cleared ${mlfbKeys.length} localForage items:`, mlfbKeys);
    }
  } catch (error) {
    console.error('Failed to clear localForage:', error);
    // Continue with reset even if this fails
  }
}

/**
 * Clear TanStack Query cache
 */
async function clearQueryCache(): Promise<void> {
  try {
    queryClient.clear();
    console.log('Cleared TanStack Query cache');
  } catch (error) {
    console.error('Failed to clear query cache:', error);
    // Continue with reset even if this fails
  }
}

/**
 * Clear sessionStorage
 */
async function clearSessionStorage(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      // Clear all sessionStorage (could be more selective if needed)
      window.sessionStorage.clear();
      console.log('Cleared sessionStorage');
    }
  } catch (error) {
    console.error('Failed to clear sessionStorage:', error);
    // Continue with reset even if this fails
  }
}

/**
 * Clear localStorage items with mlfb: prefix
 */
async function clearLocalStorage(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];

      // Collect keys with mlfb: prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('mlfb:') || key.startsWith('meta-form-'))) {
          keysToRemove.push(key);
        }
      }

      // Remove collected keys
      keysToRemove.forEach(key => localStorage.removeItem(key));

      if (keysToRemove.length > 0) {
        console.log(`Cleared ${keysToRemove.length} localStorage items:`, keysToRemove);
      }
    }
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    // Continue with reset even if this fails
  }
}

/**
 * Destroy draft managers
 */
async function clearDraftManagers(): Promise<void> {
  try {
    destroyAllDraftManagers();
    console.log('Destroyed all draft managers');
  } catch (error) {
    console.error('Failed to destroy draft managers:', error);
    // Continue with reset even if this fails
  }
}

/**
 * Reset in-memory state (this will be extended based on stores used)
 */
async function resetInMemoryState(): Promise<void> {
  try {
    // Dispatch reset events for any stores to pick up
    window.dispatchEvent(new CustomEvent('app:reset'));
    console.log('Reset in-memory state');
  } catch (error) {
    console.error('Failed to reset in-memory state:', error);
    // Continue with reset even if this fails
  }
}

/**
 * Show confirmation dialog with modifier key requirement
 */
async function showResetConfirmation(): Promise<boolean> {
  return new Promise((resolve) => {
    // Create and show custom confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';

    dialog.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div class="flex items-start gap-4 mb-6">
          <div class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Reset All Data?</h3>
            <p class="text-sm text-gray-600 mb-4">
              This will permanently delete:
            </p>
            <ul class="text-sm text-gray-600 space-y-1 mb-4">
              <li>• All saved forms and drafts</li>
              <li>• Campaign briefs and configurations</li>
              <li>• Cache and temporary data</li>
              <li>• User preferences and settings</li>
            </ul>
            <p class="text-sm font-medium text-red-600">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div class="flex items-center gap-2 text-amber-800 text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium">Safety Check:</span>
              <span>Hold ⌘ (Cmd) or Ctrl and click "Reset All Data"</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <button id="confirmReset" disabled
              class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-700 disabled:hover:bg-gray-300 transition-colors">
              Reset All Data
            </button>
            <button id="cancelReset"
              class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const confirmBtn = dialog.querySelector('#confirmReset') as HTMLButtonElement;
    const cancelBtn = dialog.querySelector('#cancelReset') as HTMLButtonElement;

    let isModifierPressed = false;

    // Monitor modifier keys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        isModifierPressed = true;
        confirmBtn.disabled = false;
        confirmBtn.classList.remove('disabled:bg-gray-300');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) {
        isModifierPressed = false;
        confirmBtn.disabled = true;
        confirmBtn.classList.add('disabled:bg-gray-300');
      }
    };

    const cleanup = () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.body.removeChild(dialog);
    };

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    confirmBtn.addEventListener('click', (e) => {
      if (isModifierPressed || (e.metaKey || e.ctrlKey)) {
        cleanup();
        resolve(true);
      }
    });

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    // Close on escape
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
      }
    });

    // Focus the dialog
    dialog.focus();
  });
}

/**
 * Quick reset for development/testing (skips confirmation)
 */
export async function devReset(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    await hardReset({ skipConfirmation: true, showProgress: true });
  } else {
    console.warn('devReset() is only available in development mode');
  }
}