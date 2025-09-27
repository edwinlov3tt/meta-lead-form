# Reset System

A comprehensive "hard reset" system that purges all application data and provides a clean slate, perfect for troubleshooting and fresh starts.

## 🚮 What Gets Cleared

### **Local Storage**
- ✅ **localForage data** - All `mlfb:*` prefixed keys (forms, drafts, cache)
- ✅ **localStorage** - All `mlfb:*` and `meta-form-*` prefixed keys
- ✅ **sessionStorage** - All wizard breadcrumbs and temporary data

### **Application Caches**
- ✅ **TanStack Query cache** - All cached API responses and query data
- ✅ **Draft managers** - All active auto-save instances destroyed
- ✅ **In-memory state** - All Zustand stores reset to initial values

### **Safety Features**
- ✅ **Modifier key requirement** - Must hold ⌘ (Cmd) or Ctrl while clicking
- ✅ **Confirmation dialog** - Clear warning about permanent data loss
- ✅ **Progress visualization** - Step-by-step progress indication
- ✅ **Error handling** - Graceful recovery from partial reset failures

## 🗂️ File Structure

```
src/components/Reset/
├── README.md                 # This file
├── ResetButton.tsx           # Main reset trigger button
└── ResetProgressModal.tsx    # Detailed progress visualization

src/lib/
└── resetSystem.ts           # Core reset functionality

src/hooks/
├── useReset.ts              # React hook for reset operations
└── useStoreReset.ts         # Store connection for reset events
```

## 🚀 Quick Integration

### 1. Add Reset Button to Your App

```tsx
import { ResetButton } from '@/components/Reset/ResetButton';

function SettingsPage() {
  return (
    <div className="p-6">
      <h2>Danger Zone</h2>

      {/* Standard reset button */}
      <ResetButton variant="danger" size="md">
        Reset All Data
      </ResetButton>

      {/* Icon-only version */}
      <ResetButton iconOnly className="ml-2" />
    </div>
  );
}
```

### 2. Add to Header/Navigation

```tsx
import { ResetButton } from '@/components/Reset/ResetButton';

function AppHeader() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1>Meta Lead Form Builder</h1>

      <div className="flex items-center gap-2">
        {/* Other header buttons */}

        {/* Development reset (only shows in dev mode) */}
        <ResetButton
          variant="secondary"
          size="sm"
          showDevReset={true}
        />
      </div>
    </header>
  );
}
```

### 3. Programmatic Reset

```tsx
import { useReset } from '@/hooks/useReset';

function TroubleshootingPage() {
  const { reset, devReset, isResetting, progress, error } = useReset();

  const handleFullReset = async () => {
    await reset({
      skipConfirmation: false,  // Show confirmation dialog
      reloadPage: true,         // Reload after reset
      showProgress: true,       // Show progress modal
      onResetComplete: () => {
        console.log('Reset completed successfully');
      }
    });
  };

  const handleQuickReset = async () => {
    // Development only - no confirmation
    await devReset();
  };

  return (
    <div>
      <button onClick={handleFullReset}>
        Full Reset (with confirmation)
      </button>

      <button onClick={handleQuickReset}>
        Quick Reset (dev only)
      </button>

      {isResetting && (
        <div>
          Resetting: {progress?.step}
          ({progress?.completed} / {progress?.total})
        </div>
      )}

      {error && (
        <div className="error">Reset failed: {error}</div>
      )}
    </div>
  );
}
```

## ⚙️ Advanced Configuration

### Custom Reset Options

```tsx
import { hardReset } from '@/lib/resetSystem';

// Custom reset with callbacks
await hardReset({
  skipConfirmation: false,
  reloadPage: false,  // Handle reload manually
  showProgress: true,
  onResetComplete: () => {
    // Custom cleanup logic
    console.log('All data cleared');

    // Custom navigation
    window.location.href = '/welcome';
  }
});
```

### Store Integration

```tsx
// Add to your main App component
import { StoreResetProvider } from '@/hooks/useStoreReset';

function App() {
  return (
    <StoreResetProvider>
      <YourAppContent />
    </StoreResetProvider>
  );
}
```

### Custom Store Reset Handling

```tsx
// In your custom store
const useCustomStore = create((set, get) => ({
  // Your store state...
  data: [],

  // Reset handler
  reset: () => {
    set({
      data: [],
      // Reset all state to initial values
    });
  }
}));

// Listen for reset events
useEffect(() => {
  const handleReset = () => {
    useCustomStore.getState().reset();
  };

  window.addEventListener('app:reset', handleReset);
  return () => window.removeEventListener('app:reset', handleReset);
}, []);
```

## 🔍 Monitoring Reset Events

```tsx
// Listen for all reset events
useEffect(() => {
  const handleProgress = (e: CustomEvent<ResetProgress>) => {
    console.log('Reset progress:', e.detail);
  };

  const handleComplete = () => {
    console.log('Reset completed successfully');
    // Show success toast
  };

  const handleError = (e: CustomEvent<{error: string}>) => {
    console.error('Reset failed:', e.detail.error);
    // Show error notification
  };

  window.addEventListener('reset:progress', handleProgress);
  window.addEventListener('reset:complete', handleComplete);
  window.addEventListener('reset:error', handleError);

  return () => {
    window.removeEventListener('reset:progress', handleProgress);
    window.removeEventListener('reset:complete', handleComplete);
    window.removeEventListener('reset:error', handleError);
  };
}, []);
```

## 🧪 Testing

### Manual Testing

1. **Create test data**:
   ```tsx
   // Add some forms, drafts, and cached data
   const testForm = { id: 'test', name: 'Test Form' };
   setActiveForm(testForm);
   ```

2. **Trigger reset**:
   ```tsx
   // Use dev reset for quick testing
   await devReset();
   ```

3. **Verify cleanup**:
   ```javascript
   // Check localStorage
   console.log('LocalStorage keys:', Object.keys(localStorage));

   // Check localForage
   const keys = await localforage.keys();
   console.log('LocalForage keys:', keys);

   // Check store state
   console.log('Store state:', useFormStore.getState());
   ```

### Automated Testing

```tsx
import { hardReset } from '@/lib/resetSystem';

describe('Reset System', () => {
  beforeEach(async () => {
    // Set up test data
    localStorage.setItem('mlfb:test:data', 'test');
    await localforage.setItem('mlfb:test:form', { id: 'test' });
  });

  it('should clear all mlfb: prefixed data', async () => {
    await hardReset({
      skipConfirmation: true,
      reloadPage: false
    });

    // Verify localStorage
    const lsKeys = Object.keys(localStorage);
    expect(lsKeys.filter(k => k.startsWith('mlfb:'))).toHaveLength(0);

    // Verify localForage
    const lfKeys = await localforage.keys();
    expect(lfKeys.filter(k => k.startsWith('mlfb:'))).toHaveLength(0);
  });

  it('should reset store state', async () => {
    // Set some state
    useFormStore.getState().setActiveForm(testForm);

    await hardReset({
      skipConfirmation: true,
      reloadPage: false
    });

    // Verify reset
    const state = useFormStore.getState();
    expect(state.activeForm.name).toBe('Untitled Form');
  });
});
```

## 🔒 Security Considerations

### What's NOT Cleared

- **Server data** - Only local data is affected
- **Authentication tokens** - May persist in HTTP-only cookies
- **Browser cache** - HTTP cache remains intact
- **IndexedDB from other apps** - Only `mlfb:*` prefixed data

### Production Safeguards

```tsx
// Only enable reset in development/staging
const canReset = process.env.NODE_ENV !== 'production' ||
                 window.location.hostname.includes('staging');

{canReset && <ResetButton />}
```

### Audit Logging

```tsx
// Add reset events to your analytics
window.addEventListener('reset:complete', () => {
  analytics.track('app_reset_completed', {
    timestamp: new Date().toISOString(),
    user_id: getCurrentUserId(),
  });
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Reset hangs on specific step**:
   ```tsx
   // Check browser console for specific error
   // Each step logs its progress
   ```

2. **Stores not resetting**:
   ```tsx
   // Ensure StoreResetProvider is wrapping your app
   // Check that stores have reset() methods
   ```

3. **LocalForage quota exceeded**:
   ```tsx
   // The system handles quota errors gracefully
   // Check browser storage settings
   ```

### Recovery Options

```tsx
// If reset fails, try individual cleanup steps
import localforage from 'localforage';
import { queryClient } from '@/lib/queryClient';

// Manual cleanup
const manualReset = async () => {
  try {
    // Clear localForage
    const keys = await localforage.keys();
    await Promise.all(
      keys
        .filter(k => k.startsWith('mlfb:'))
        .map(k => localforage.removeItem(k))
    );

    // Clear query cache
    queryClient.clear();

    // Clear localStorage
    Object.keys(localStorage)
      .filter(k => k.startsWith('mlfb:'))
      .forEach(k => localStorage.removeItem(k));

    console.log('Manual reset completed');
  } catch (error) {
    console.error('Manual reset failed:', error);
  }
};
```

## 📊 Performance Impact

- **Reset time**: ~100-500ms depending on data volume
- **Memory usage**: Temporary spike during cleanup, then drops to baseline
- **Network impact**: None (purely local operation)
- **UI blocking**: Minimal due to async operations and progress indication

The reset system is designed for occasional use and won't impact normal application performance.