import React, { useState } from 'react';
import { Sparkles, Loader, AlertTriangle, CheckCircle, Settings, Globe } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Card, CardContent } from '@/components/UI/Card';
import { AIConfigModal } from './AIConfigModal';
import { aiFormGenerator } from '@/services/aiFormGenerator';
import { useFormStore } from '@/stores/formStore';

export const AIFormGenerator: React.FC = () => {
  const { preFormBrief, setActiveForm, setCurrentView } = useFormStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const isConfigured = aiFormGenerator.isConfigured();

  const handleGenerateForm = async (useMockData = false) => {
    if (!useMockData && !isConfigured) {
      setShowConfig(true);
      return;
    }

    if (!preFormBrief) {
      setGenerationStatus({
        type: 'error',
        message: 'Please complete the campaign brief first'
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStatus({ type: 'idle', message: 'Generating optimized form...' });

    try {
      let generatedForm;

      if (useMockData || !isConfigured) {
        // Use mock generation for testing
        setGenerationStatus({ type: 'idle', message: 'Generating form with sample data...' });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
        generatedForm = aiFormGenerator.generateMockForm(preFormBrief);
      } else {
        // Use real AI generation
        setGenerationStatus({ type: 'idle', message: 'Researching industry best practices...' });
        generatedForm = await aiFormGenerator.generateForm(preFormBrief);
      }

      // Update the form store
      setActiveForm(generatedForm);

      setGenerationStatus({
        type: 'success',
        message: `Form generated successfully! ${generatedForm.contactFields.length} contact fields and ${generatedForm.qualifiers.length} qualifying questions created.`
      });

      // Auto-switch to form builder view
      setTimeout(() => {
        setCurrentView('builder');
      }, 1500);

    } catch (error) {
      console.error('Form generation failed:', error);
      setGenerationStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate form. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = preFormBrief?.campaignObjective && preFormBrief?.industry;

  return (
    <>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900">AI Form Generator</h3>
                  <p className="text-sm text-surface-600">
                    Generate an optimized lead form based on your campaign brief and industry best practices
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowConfig(true)}
                variant="ghost"
                size="sm"
                title="Configure AI Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            {/* Configuration Status */}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              isConfigured
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              {isConfigured ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    AI configured with web search capabilities
                  </span>
                  <Globe className="w-4 h-4 text-green-600" />
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">
                    AI not configured - using sample data mode
                  </span>
                </>
              )}
            </div>

            {/* Prerequisites Check */}
            {!canGenerate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">Complete Campaign Brief Required</h4>
                    <p className="text-sm text-blue-700">
                      Please provide at least a campaign objective and industry before generating a form.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Generation Status */}
            {generationStatus.type !== 'idle' && (
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                generationStatus.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {generationStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm ${
                    generationStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {generationStatus.message}
                  </p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <div className="flex-1">
                  <div className="font-medium text-blue-800">Generating Your Form</div>
                  <div className="text-sm text-blue-700">{generationStatus.message}</div>
                </div>
              </div>
            )}

            {/* Generation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => handleGenerateForm(false)}
                disabled={!canGenerate || isGenerating}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isConfigured ? 'Generate with AI' : 'Generate Sample Form'}
              </Button>

              {/* Mock/Test Button */}
              <Button
                onClick={() => handleGenerateForm(true)}
                disabled={!canGenerate || isGenerating}
                variant="outline"
                className="min-w-32"
              >
                Test Mode
              </Button>
            </div>

            {/* Feature Info */}
            <div className="text-xs text-surface-500 space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                <span>AI analyzes your campaign objective and industry</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3" />
                <span>Researches current lead generation best practices</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                <span>Optimizes for conversion rate and lead quality</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AIConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />
    </>
  );
};