import React from 'react';
import { Sparkles, Check, AlertTriangle } from 'lucide-react';

interface AIGenerationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  hasGenerated: boolean;
  generationError?: string | null;
  className?: string;
}

export const AIGenerationToggle: React.FC<AIGenerationToggleProps> = ({
  enabled,
  onToggle,
  hasGenerated,
  generationError,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toggle Switch */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900">AI Form Generation</h3>
            <p className="text-sm text-surface-600">
              Automatically generate optimized form content based on your campaign details
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only"
            aria-label="Toggle AI form generation"
          />
          <div
            className={`relative w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${
              enabled
                ? 'bg-blue-600'
                : 'bg-surface-300'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 transition-transform duration-200 ease-in-out transform bg-white rounded-full ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </label>
      </div>

      {/* Status Messages - Show when enabled */}
      {enabled && (
        <div className="space-y-3">
          {generationError && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <strong>Generation Failed:</strong> {generationError}
              </div>
            </div>
          )}

          {hasGenerated && !generationError && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <strong>Form Generated Successfully!</strong> Your form has been populated with AI-generated content. Continue to the Form Builder to review and customize.
              </div>
            </div>
          )}

          {/* Information about what gets generated */}
          {!hasGenerated && !generationError && (
            <div className="text-center text-sm text-surface-600 bg-surface-50 rounded-lg p-3">
              <strong>When you complete the brief, AI will generate:</strong>
              <ul className="mt-2 text-xs space-y-1 text-left max-w-md mx-auto">
                <li>• Form name and introduction (headline & description)</li>
                <li>• Up to 3 optimized qualifying questions</li>
                <li>• Contact field recommendations with descriptions</li>
                <li>• Thank you page content with next steps</li>
                <li>• Call-to-action setup with UTM tracking</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIGenerationToggle;