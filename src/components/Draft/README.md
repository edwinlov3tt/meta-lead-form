# Draft Management System

A comprehensive auto-save and draft restoration system to prevent data loss on browser refresh or unexpected exits.

## 🚀 Features

- ✅ **Auto-save with debouncing** - Saves drafts every 750ms after changes
- ✅ **Change detection** - Only writes when data actually changes
- ✅ **IndexedDB storage** - Uses localForage for large JSON payloads
- ✅ **Smart restoration** - Prompts user when draft is newer than server data
- ✅ **Visual feedback** - Shows save status and timestamps
- ✅ **Type-safe** - Full TypeScript support with Zod validation
- ✅ **Error handling** - Graceful fallbacks and error recovery

## 📁 File Structure

```
src/components/Draft/
├── README.md                    # This file
├── DraftProvider.tsx            # Main provider component
├── DraftRestoreModal.tsx        # Modal for draft restoration
└── DraftStatusIndicator.tsx     # Save status indicator

src/lib/
├── draftManager.ts              # Core draft management logic
└── storage.ts                   # Storage utilities (already exists)

src/hooks/
└── useDraftManager.ts           # React hook for draft operations

src/stores/
└── draftEnabledFormStore.ts     # Enhanced store with draft integration
```

## 🔧 Integration

### 1. Wrap your app with DraftProvider

```tsx
// In your main App.tsx or route component
import { DraftProvider } from '@/components/Draft/DraftProvider';

function FormBuilderPage() {
  const pageKey = "user123"; // or page_id from FB API
  const formSlug = "campaign-form"; // unique identifier
  const formId = "server-form-id"; // if exists in database
  const serverUpdatedAt = "2024-01-01T10:00:00Z"; // from server

  return (
    <DraftProvider
      pageKey={pageKey}
      formSlug={formSlug}
      formId={formId}
      serverUpdatedAt={serverUpdatedAt}
    >
      <YourFormBuilderComponents />
    </DraftProvider>
  );
}
```

### 2. Use the draft-enabled store

```tsx
// In your form components
import { useDraftEnabledFormStore } from '@/stores/draftEnabledFormStore';

function FormBuilderComponent() {
  const {
    activeForm,
    preFormBrief,
    setActiveForm,
    setPreFormBrief,
    updateForm,
    updateBrief,
  } = useDraftEnabledFormStore();

  // Updates will automatically trigger draft saves
  const handleFormChange = (updates: Partial<MetaLeadForm>) => {
    updateForm(updates); // Auto-saves after 750ms
  };

  const handleBriefChange = (updates: Partial<PreFormBrief>) => {
    updateBrief(updates); // Auto-saves after 750ms
  };

  return (
    <div>
      {/* Your form components */}
      <input
        value={activeForm?.name || ''}
        onChange={(e) => handleFormChange({ name: e.target.value })}
      />
    </div>
  );
}
```

### 3. Access draft status (optional)

```tsx
import { useDraftStatus } from '@/components/Draft/DraftProvider';

function SaveIndicator() {
  const {
    isDraftEnabled,
    isDraftSaving,
    lastDraftSaved,
    draftError,
    saveDraftNow,
  } = useDraftStatus();

  if (draftError) {
    return <div className="text-red-600">Save failed: {draftError.message}</div>;
  }

  return (
    <div className="flex items-center gap-2">
      {isDraftSaving ? (
        <span>Saving...</span>
      ) : lastDraftSaved ? (
        <span>Saved at {new Date(lastDraftSaved).toLocaleTimeString()}</span>
      ) : (
        <span>Not saved</span>
      )}

      <button onClick={saveDraftNow}>Save Now</button>
    </div>
  );
}
```

## 🔄 Draft Flow

### 1. Auto-Save Process

```
User makes change → Store updated → Draft save triggered → 750ms debounce →
Check if content changed → Write to IndexedDB → Update UI status
```

### 2. Restoration Process

```
Page loads → Check for draft → Compare timestamps →
Show restoration modal → User chooses → Apply or discard
```

## 🗂️ Storage Structure

### Draft Storage Key Format
```
mlfb:<pageKey>:<formSlug>:draft
```

### Draft Data Structure
```typescript
interface DraftSnapshot {
  v: number;                    // Schema version (1)
  updatedAt: string;           // ISO timestamp
  pageKey: string;             // page_id or username
  formId?: string;             // server form ID if exists
  payload: {
    form: MetaLeadForm | null;
    brief: PreFormBrief | null;
  };
  meta: {
    pageMetadata?: unknown;    // FB page data
    permissions?: unknown;     // FB permissions
    [key: string]: unknown;
  };
}
```

## ⚙️ Configuration

### DraftProvider Props
```typescript
interface DraftProviderProps {
  children: React.ReactNode;
  pageKey: string;                    // Required: unique page identifier
  formSlug?: string;                  // Optional: form identifier (default: 'default')
  formId?: string;                    // Optional: server form ID
  serverUpdatedAt?: string;           // Optional: server timestamp for comparison
  showStatusIndicator?: boolean;      // Optional: show save status (default: true)
  statusIndicatorClassName?: string;  // Optional: custom styling
}
```

### DraftManager Options
```typescript
interface DraftManagerOptions {
  pageKey: string;
  formSlug?: string;     // Default: 'default'
  debounceMs?: number;   // Default: 750ms
}
```

## 🎨 UI Components

### DraftRestoreModal
- Shows when newer draft found
- Displays draft details and timestamps
- Restore/Discard/Cancel options
- Warning about data replacement

### DraftStatusIndicator
- Shows current save status
- Displays last saved time
- Indicates saving in progress
- Shows error states

## 🧪 Testing Draft System

```tsx
// Test draft creation
function TestDraftSave() {
  const { setActiveForm, saveDraftNow } = useDraftEnabledFormStore();

  const createTestDraft = () => {
    setActiveForm({
      id: 'test-form',
      name: 'Test Form',
      // ... other required fields
    });

    // Force immediate save (bypasses debounce)
    saveDraftNow();
  };

  return <button onClick={createTestDraft}>Create Test Draft</button>;
}

// Test draft restoration
function TestDraftRestore() {
  const { checkForDraft } = useDraftEnabledFormStore();

  return <button onClick={checkForDraft}>Check for Draft</button>;
}
```

## 🔍 Debugging

### Enable Console Logging
The draft system logs save/load operations:
```
📝 Draft saved: mlfb:user123:form1:draft
🗑️ Draft cleared: mlfb:user123:form1:draft
```

### Draft Events
Listen for custom events:
```tsx
useEffect(() => {
  const handleDraftSaved = (e: CustomEvent) => {
    console.log('Draft saved at:', e.detail.timestamp);
  };

  window.addEventListener('draft:saved', handleDraftSaved);
  return () => window.removeEventListener('draft:saved', handleDraftSaved);
}, []);
```

Available events:
- `draft:saved` - Draft successfully saved
- `draft:save-error` - Draft save failed
- `draft:cleared` - Draft was deleted
- `draft:restored` - Draft was restored

## 🚨 Error Handling

### Common Issues

1. **Storage Full**: IndexedDB quota exceeded
   - Falls back to localStorage automatically
   - Shows error in status indicator

2. **Invalid Data**: Draft fails validation
   - Logs warning and continues
   - Clears invalid portions

3. **Network Issues**: Can't reach server for timestamp comparison
   - Assumes draft is newer
   - Shows restoration prompt

### Error Recovery
```tsx
const { draftError, clearAll } = useDraftEnabledFormStore();

if (draftError) {
  // Show error message
  // Option to clear all drafts and restart
  return (
    <div>
      <p>Draft error: {draftError.message}</p>
      <button onClick={clearAll}>Clear All & Restart</button>
    </div>
  );
}
```

## 📊 Performance

- **Debounced writes**: Only saves after 750ms of inactivity
- **Change detection**: Compares JSON strings to avoid unnecessary writes
- **Lazy initialization**: Draft manager created only when needed
- **Memory cleanup**: Automatic cleanup on component unmount
- **IndexedDB**: Async operations don't block UI

## 🔒 Privacy & Security

- **Local only**: Drafts stored locally, never sent to server
- **Namespaced keys**: Isolated by pageKey and formSlug
- **Validation**: All draft data validated before use
- **Cleanup**: Drafts can be manually cleared
- **No sensitive data**: Only form configuration, no user PII