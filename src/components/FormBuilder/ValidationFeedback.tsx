import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useFormStore } from '@/stores/formStore';

export const ValidationFeedback: React.FC = () => {
  const { validation, frictionScore } = useFormStore();

  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-green-800">Form looks good!</h4>
          <p className="text-sm text-green-700">
            All required fields are configured. Friction score: {frictionScore.total} ({frictionScore.level})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Errors */}
      {validation.errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-2">
                {validation.errors.length} Error{validation.errors.length > 1 ? 's' : ''} Found
              </h4>
              <ul className="space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">
                    <span className="font-medium">{error.field}:</span> {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800 mb-2">
                {validation.warnings.length} Recommendation{validation.warnings.length > 1 ? 's' : ''}
              </h4>
              <ul className="space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-700">
                    <span className="font-medium">{warning.field}:</span> {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Friction Score Recommendations */}
      {frictionScore.recommendations.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 mb-2">
                Friction Score Insights (Score: {frictionScore.total})
              </h4>
              <ul className="space-y-1">
                {frictionScore.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-blue-700">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};