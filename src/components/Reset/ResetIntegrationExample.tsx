import React, { useState } from 'react';
import { Settings, AlertTriangle, Info } from 'lucide-react';
import { ResetButton } from './ResetButton';
import { ResetProgressModal } from './ResetProgressModal';
import { useReset } from '@/hooks/useReset';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';

/**
 * Example component showing different ways to integrate the reset system
 * This demonstrates various use cases and configurations
 */

export function ResetIntegrationExample() {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const { reset, devReset, isResetting, progress, error, clearError } = useReset();

  const handleCustomReset = async () => {
    setShowProgressModal(true);

    await reset({
      showProgress: true,
      reloadPage: false, // Don't auto-reload for demo
      onResetComplete: () => {
        console.log('Custom reset completed');
        // Keep modal open to show completion state
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Reset System Integration Examples
        </h1>
        <p className="text-gray-600">
          Different ways to integrate the comprehensive reset functionality
        </p>
      </div>

      {/* Basic Reset Button */}
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Settings className="w-6 h-6 text-gray-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Basic Reset Button</h3>
              <p className="text-gray-600 mb-4">
                Standard reset button with built-in confirmation dialog and safety checks.
                Requires holding ⌘ (Cmd) or Ctrl while clicking.
              </p>

              <div className="flex gap-3">
                <ResetButton variant="danger" size="md">
                  Reset All Data
                </ResetButton>

                <ResetButton
                  variant="secondary"
                  size="md"
                  iconOnly
                  className="w-auto"
                />
              </div>

              <div className="mt-3 text-sm text-gray-500">
                ⚠️ Hold ⌘/Ctrl + Click to activate
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Custom Reset with Progress Modal */}
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Custom Reset with Progress</h3>
              <p className="text-gray-600 mb-4">
                Programmatic reset with custom progress modal and completion handling.
                Shows detailed step-by-step progress.
              </p>

              <Button
                variant="danger"
                onClick={handleCustomReset}
                disabled={isResetting}
              >
                {isResetting ? 'Resetting...' : 'Custom Reset'}
              </Button>

              {progress && (
                <div className="mt-3 text-sm text-blue-600">
                  Progress: {progress.step} ({progress.completed}/{progress.total})
                </div>
              )}

              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Error: {error}</span>
                  <Button variant="secondary" size="sm" onClick={clearError}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Development Tools */}
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Development Tools</h3>
              <p className="text-gray-600 mb-4">
                Quick reset tools for development and testing. No confirmation required.
                Only available in development mode.
              </p>

              <div className="flex gap-3">
                <ResetButton
                  variant="secondary"
                  showDevReset={true}
                  size="md"
                >
                  Dev Tools
                </ResetButton>

                <Button
                  variant="secondary"
                  onClick={() => devReset()}
                  disabled={process.env.NODE_ENV === 'production'}
                >
                  Quick Dev Reset
                </Button>
              </div>

              <div className="mt-3 text-sm text-gray-500">
                {process.env.NODE_ENV === 'development' ? (
                  '✅ Development mode - Tools available'
                ) : (
                  '🚫 Production mode - Dev tools disabled'
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Integration Code Examples */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Integration Code Examples</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Basic Usage</h4>
              <pre className="bg-gray-100 rounded-lg p-3 text-sm overflow-x-auto">
{`import { ResetButton } from '@/components/Reset/ResetButton';

<ResetButton variant="danger">
  Reset All Data
</ResetButton>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Programmatic Reset</h4>
              <pre className="bg-gray-100 rounded-lg p-3 text-sm overflow-x-auto">
{`import { useReset } from '@/hooks/useReset';

const { reset } = useReset();

await reset({
  showProgress: true,
  onResetComplete: () => {
    console.log('Reset complete!');
  }
});`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Store Integration</h4>
              <pre className="bg-gray-100 rounded-lg p-3 text-sm overflow-x-auto">
{`import { StoreResetProvider } from '@/hooks/useStoreReset';

function App() {
  return (
    <StoreResetProvider>
      <YourApp />
    </StoreResetProvider>
  );
}`}
              </pre>
            </div>
          </div>
        </div>
      </Card>

      {/* What Gets Reset */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">What Gets Reset</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-700 mb-3">✅ Cleared</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• LocalForage data (mlfb:* keys)</li>
                <li>• LocalStorage (mlfb:* and meta-form-* keys)</li>
                <li>• SessionStorage (all data)</li>
                <li>• TanStack Query cache</li>
                <li>• Draft managers and auto-saves</li>
                <li>• In-memory store state</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-red-700 mb-3">❌ Preserved</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Server-side data</li>
                <li>• Authentication tokens</li>
                <li>• Browser HTTP cache</li>
                <li>• Other app's storage</li>
                <li>• Cookies (unless manually cleared)</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Modal */}
      <ResetProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
      />
    </div>
  );
}

export default ResetIntegrationExample;