import React, { useState } from 'react';
import { AlertTriangle, Clock, FileText, User, Download } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent } from './Card';

interface ConflictData {
  current: {
    form?: any;
    brief?: any;
    timestamp: Date;
  };
  autosaved: {
    form?: any;
    brief?: any;
    timestamp: Date;
  };
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictData: ConflictData;
  onResolve: (strategy: 'local' | 'remote', mergedData?: any) => Promise<void>;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflictData,
  onResolve
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'local' | 'remote' | null>(null);

  if (!isOpen) return null;

  const handleResolve = async (strategy: 'local' | 'remote') => {
    setIsResolving(true);
    try {
      await onResolve(strategy);
      onClose();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangesSummary = (data: any) => {
    const changes = [];
    if (data.form) {
      changes.push(`Form: ${data.form.name || 'Untitled'}`);
    }
    if (data.brief) {
      changes.push(`Brief: ${data.brief.campaignObjective || 'Untitled'}`);
    }
    return changes.join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Resolve Data Conflict
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Multiple versions detected. Choose one to continue.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isResolving}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-white/50"
              title="Close (will ask again later)"
            >
              ×
            </button>
          </div>
        </div>

        {/* Conflict Comparison */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Version */}
            <Card className="border-2 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Your Current Version</h3>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(conflictData.current.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    <span>{getChangesSummary(conflictData.current)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleResolve('local')}
                  disabled={isResolving}
                  className="w-full mt-4"
                  variant={selectedStrategy === 'local' ? 'default' : 'outline'}
                >
                  {isResolving && selectedStrategy === 'local' ? (
                    'Applying...'
                  ) : (
                    'Keep Current Version'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Autosaved Version */}
            <Card className="border-2 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="w-4 h-4 text-green-600" />
                  <h3 className="font-medium text-green-900">Auto-saved Version</h3>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(conflictData.autosaved.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    <span>{getChangesSummary(conflictData.autosaved)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleResolve('remote')}
                  disabled={isResolving}
                  className="w-full mt-4"
                  variant={selectedStrategy === 'remote' ? 'default' : 'outline'}
                >
                  {isResolving && selectedStrategy === 'remote' ? (
                    'Applying...'
                  ) : (
                    'Use Auto-saved Version'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Warning Message */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Important</h4>
                <p className="text-sm text-amber-800 mt-1">
                  Choosing one version will completely replace the other. Make sure you select
                  the version that contains your most recent and important changes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isResolving}
            >
              Cancel
            </Button>
            <p className="text-xs text-gray-500">
              This action cannot be undone. Choose carefully.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};