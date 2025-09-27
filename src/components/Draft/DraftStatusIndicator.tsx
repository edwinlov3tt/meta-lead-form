import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';

interface DraftStatusIndicatorProps {
  isDraftSaving?: boolean;
  lastSaved?: string | null;
  saveError?: Error | null;
  getRelativeTime?: (timestamp: string) => string;
  className?: string;
}

export function DraftStatusIndicator({
  isDraftSaving = false,
  lastSaved = null,
  saveError = null,
  getRelativeTime = (timestamp) => new Date(timestamp).toLocaleTimeString(),
  className = '',
}: DraftStatusIndicatorProps) {
  if (saveError) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Save failed</span>
      </div>
    );
  }

  if (isDraftSaving) {
    return (
      <div className={`flex items-center gap-2 text-blue-600 ${className}`}>
        <Loader className="w-4 h-4 animate-spin" />
        <span className="text-sm">Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">
          Saved {getRelativeTime(lastSaved)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
      <Clock className="w-4 h-4" />
      <span className="text-sm">Not saved</span>
    </div>
  );
}