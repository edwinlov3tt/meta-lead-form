# Enhanced Libraries Integration

This directory contains the integration of modern React libraries to improve the Meta Lead Form Builder application's performance, reliability, and developer experience.

## 📦 Libraries Added

### 1. **TanStack Query (React Query)** - `@tanstack/react-query`
**Purpose**: Advanced data fetching, caching, and synchronization

**Benefits**:
- ✅ Automatic background refetching
- ✅ Intelligent caching with configurable TTL
- ✅ Optimistic updates
- ✅ Error retry logic
- ✅ Loading states management
- ✅ Query invalidation strategies

### 2. **Zustand** - `zustand`
**Purpose**: Lightweight state management (alternative to existing store)

**Benefits**:
- ✅ Minimal boilerplate
- ✅ TypeScript-first design
- ✅ Persistence middleware support
- ✅ DevTools integration
- ✅ No providers needed

### 3. **localForage** - `localforage`
**Purpose**: Enhanced local storage with IndexedDB support

**Benefits**:
- ✅ Automatic IndexedDB/WebSQL/localStorage fallback
- ✅ Async API
- ✅ Better performance for large data
- ✅ Cross-browser compatibility
- ✅ Support for complex data types

### 4. **Zod** - `zod`
**Purpose**: TypeScript-first schema validation

**Benefits**:
- ✅ Runtime type validation
- ✅ Schema-based validation
- ✅ Excellent TypeScript integration
- ✅ Detailed error messages
- ✅ Parse and transform data

### 5. **XState** - `xstate` + `@xstate/react`
**Purpose**: State machines for complex UI flows

**Benefits**:
- ✅ Predictable state transitions
- ✅ Guards for validation
- ✅ Hierarchical states
- ✅ Visual state charts
- ✅ Prevents impossible states

## 🗂️ File Structure

```
src/lib/
├── README.md                 # This file
├── providers.tsx            # Root providers setup
├── queryClient.ts           # TanStack Query configuration
├── storage.ts               # localForage setup and utilities
├── validation.ts            # Zod schemas and validation utilities
├── enhancedFormStore.ts     # Enhanced Zustand store
├── formStateMachine.ts      # XState machine for form flow
└── hooks/
    └── useFormQueries.ts    # TanStack Query hooks
```

## 🚀 Quick Start

### 1. Wrap your app with providers

```tsx
// In your main.tsx or App.tsx
import { Providers } from '@/lib/providers';

function App() {
  return (
    <Providers>
      <YourAppContent />
    </Providers>
  );
}
```

### 2. Use the enhanced Zustand store

```tsx
import { useEnhancedFormStore } from '@/lib/enhancedFormStore';

function MyComponent() {
  const {
    activeForm,
    setActiveForm,
    saveToStorage,
    enableAutoSave,
  } = useEnhancedFormStore();

  // Enable auto-save on mount
  React.useEffect(() => {
    enableAutoSave();
    return () => disableAutoSave();
  }, []);
}
```

### 3. Use TanStack Query hooks

```tsx
import { useCurrentForm, useSaveForm } from '@/hooks/useFormQueries';

function FormComponent() {
  const { data: form, isLoading, error } = useCurrentForm();
  const saveForm = useSaveForm();

  const handleSave = () => {
    if (form) {
      saveForm.mutate(form);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{form?.name}</h1>
      <button
        onClick={handleSave}
        disabled={saveForm.isPending}
      >
        {saveForm.isPending ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
```

### 4. Validate data with Zod

```tsx
import { validate, safeValidate } from '@/lib/validation';

// Throw on validation error
try {
  const validForm = validate.form(formData);
  // Use validForm...
} catch (error) {
  console.error('Validation failed:', error);
}

// Safe validation (returns result)
const result = safeValidate.form(formData);
if (result.success) {
  // Use result.data...
} else {
  console.error('Validation errors:', result.error.issues);
}
```

### 5. Use XState for complex flows

```tsx
import { useMachine } from '@xstate/react';
import { formBuilderMachine } from '@/lib/formStateMachine';

function FormBuilderFlow() {
  const [state, send] = useMachine(formBuilderMachine);

  const handleCompleteBrief = (brief: PreFormBrief) => {
    send({ type: 'COMPLETE_BRIEF', brief });
  };

  return (
    <div>
      <h2>Current Step: {state.value}</h2>

      {state.matches('briefing') && (
        <BriefingComponent onComplete={handleCompleteBrief} />
      )}

      {state.matches('building') && (
        <FormBuilderComponent />
      )}

      {state.context.error && (
        <ErrorMessage error={state.context.error} />
      )}
    </div>
  );
}
```

## 🔄 Migration Strategy

### Option 1: Gradual Migration
- Keep existing store alongside new enhanced store
- Migrate components one by one
- Use both systems during transition period

### Option 2: Full Migration
- Replace existing formStore with enhancedFormStore
- Update all components to use new hooks
- Migrate all data validation to Zod schemas

### Option 3: Hybrid Approach
- Use TanStack Query for API calls and caching
- Keep existing Zustand store for local state
- Add Zod validation to critical data flows
- Use XState only for complex multi-step flows

## 🛠️ Configuration

### TanStack Query Settings
```tsx
// In queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Storage Configuration
```tsx
// In storage.ts
export const formStorage = localforage.createInstance({
  name: 'MetaLeadFormBuilder',
  storeName: 'forms',
  driver: [
    localforage.INDEXEDDB,
    localforage.WEBSQL,
    localforage.LOCALSTORAGE
  ]
});
```

## 🧪 Testing

### Testing with TanStack Query
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('useCurrentForm hook', async () => {
  const { result } = renderHook(() => useCurrentForm(), {
    wrapper: createWrapper(),
  });

  // Test your hook...
});
```

## 📊 Performance Benefits

1. **Reduced Bundle Size**: Zustand is much smaller than Redux
2. **Better Caching**: TanStack Query prevents unnecessary re-fetches
3. **Faster Storage**: IndexedDB via localForage for large data
4. **Type Safety**: Zod ensures runtime type safety
5. **Predictable State**: XState prevents impossible states

## 🔗 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [localForage Docs](https://localforage.github.io/localForage/)
- [Zod Docs](https://zod.dev/)
- [XState Docs](https://stately.ai/docs)