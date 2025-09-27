import React, { useState, useEffect } from 'react';
import { X, Key, Globe, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { aiFormGenerator } from '@/services/aiFormGenerator';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose }) => {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [serperKey, setSerperKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load existing keys
      const existingAnthropicKey = localStorage.getItem('anthropic_api_key') || '';
      const existingSerperKey = localStorage.getItem('serper_api_key') || '';

      setAnthropicKey(existingAnthropicKey);
      setSerperKey(existingSerperKey);
      setIsConfigured(aiFormGenerator.isConfigured());
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!anthropicKey.trim()) {
      alert('Anthropic API key is required');
      return;
    }

    setIsSaving(true);
    try {
      aiFormGenerator.configure(anthropicKey.trim(), serperKey.trim() || undefined);
      setIsConfigured(true);

      // Test the configuration
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch (error) {
      setIsSaving(false);
      alert('Failed to configure AI service');
    }
  };

  const handleClearKeys = () => {
    if (confirm('Are you sure you want to clear all API keys?')) {
      localStorage.removeItem('anthropic_api_key');
      localStorage.removeItem('serper_api_key');
      setAnthropicKey('');
      setSerperKey('');
      setIsConfigured(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">AI Configuration</h2>
              <p className="text-sm text-surface-600">Configure API keys for intelligent form generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className={`flex items-center gap-3 p-4 rounded-lg ${
            isConfigured
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            {isConfigured ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            <div className="flex-1">
              <div className={`font-medium ${isConfigured ? 'text-green-800' : 'text-yellow-800'}`}>
                {isConfigured ? 'AI Service Configured' : 'Configuration Required'}
              </div>
              <div className={`text-sm ${isConfigured ? 'text-green-700' : 'text-yellow-700'}`}>
                {isConfigured
                  ? 'AI form generation is ready to use with web search capabilities'
                  : 'Configure your API keys to enable intelligent form generation'
                }
              </div>
            </div>
          </div>

          {/* Anthropic API Key */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Anthropic API Key *
                  </label>
                  <p className="text-xs text-surface-500">
                    Required for AI form generation using Claude 3.5 Sonnet
                  </p>
                </div>
                <a
                  href="https://console.anthropic.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  Get API Key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="form-input"
                placeholder="sk-ant-api03-..."
              />
            </div>
          </Card>

          {/* Serper API Key */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Serper API Key (Optional)
                  </label>
                  <p className="text-xs text-surface-500">
                    Enables web search for latest industry best practices and trends
                  </p>
                </div>
                <a
                  href="https://serper.dev/api-key"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  Get API Key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                value={serperKey}
                onChange={(e) => setSerperKey(e.target.value)}
                className="form-input"
                placeholder="Your Serper API key..."
              />
              <p className="text-xs text-surface-500">
                💡 Without web search, the AI will use its training data for best practices
              </p>
            </div>
          </Card>

          {/* Security Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Security Note</h4>
                <p className="text-sm text-blue-700">
                  API keys are stored locally in your browser and never sent to our servers.
                  In production, use environment variables or secure key management.
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showKeys}
                  onChange={(e) => setShowKeys(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                Show API keys
              </label>
              {isConfigured && (
                <Button
                  onClick={handleClearKeys}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Clear Keys
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!anthropicKey.trim() || isSaving}
                className="min-w-24"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};