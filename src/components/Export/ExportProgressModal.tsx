import React from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { ExportProgress, ExportError } from '@/types/export';

interface ExportProgressModalProps {
  isOpen: boolean;
  progress: ExportProgress | null;
  error: ExportError | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  progress,
  error,
  onClose,
  onRetry
}) => {
  if (!isOpen) return null;

  const getStageLabel = (stage: ExportProgress['stage']): string => {
    switch (stage) {
      case 'initializing': return 'Initializing';
      case 'processing_data': return 'Processing Data';
      case 'generating_excel': return 'Generating Excel';
      case 'creating_zip': return 'Creating Package';
      case 'complete': return 'Complete';
      default: return 'Processing';
    }
  };

  const getProgressColor = (stage: ExportProgress['stage']): string => {
    switch (stage) {
      case 'complete': return 'bg-green-500';
      case 'creating_zip': return 'bg-blue-500';
      case 'generating_excel': return 'bg-indigo-500';
      case 'processing_data': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {error ? 'Export Failed' : progress?.stage === 'complete' ? 'Export Complete' : 'Exporting Spec Sheet'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error ? (
            // Error State
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Export Failed
              </h3>
              <p className="text-gray-600 mb-4">
                {error.message}
              </p>
              {error.details && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">
                    <strong>Details:</strong> {error.details}
                  </p>
                </div>
              )}
              <div className="flex space-x-3">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : progress?.stage === 'complete' ? (
            // Success State
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Export Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                Your spec sheet has been downloaded and is ready for review.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Package Contents:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Excel spec sheet for buying team review</li>
                  <li>• JSON file for re-importing to the builder</li>
                  <li>• README with instructions</li>
                </ul>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : progress ? (
            // Progress State
            <div>
              <div className="flex items-center mb-4">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-3" />
                <span className="text-sm font-medium text-gray-700">
                  {getStageLabel(progress.stage)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{progress.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.stage)}`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>

              {/* Current Message */}
              <p className="text-sm text-gray-600">
                {progress.message}
              </p>

              {/* Stage Indicators */}
              <div className="mt-6 space-y-2">
                {['initializing', 'processing_data', 'generating_excel', 'creating_zip'].map((stage, index) => {
                  const isCurrentStage = progress.stage === stage;
                  const isCompletedStage = ['initializing', 'processing_data', 'generating_excel', 'creating_zip'].indexOf(progress.stage) > index;

                  return (
                    <div key={stage} className={`flex items-center text-sm ${
                      isCurrentStage ? 'text-blue-600' : isCompletedStage ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        isCurrentStage ? 'bg-blue-500 animate-pulse' : isCompletedStage ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      {getStageLabel(stage as ExportProgress['stage'])}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};