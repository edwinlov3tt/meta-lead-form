import React from 'react';
import { AlertTriangle, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import type { DraftSnapshot } from '@/lib/draftManager';

interface DraftRestoreModalProps {
  isOpen: boolean;
  draft: DraftSnapshot | null;
  onRestore: () => void;
  onDiscard: () => void;
  onClose: () => void;
  getRelativeTime: (timestamp: string) => string;
}

export function DraftRestoreModal({
  isOpen,
  draft,
  onRestore,
  onDiscard,
  onClose,
  getRelativeTime,
}: DraftRestoreModalProps) {
  if (!draft) return null;

  const hasForm = draft.payload.form !== null;
  const hasBrief = draft.payload.brief !== null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Draft Found
            </h2>
            <p className="text-sm text-gray-600">
              We found unsaved changes from your last session. Would you like to restore them?
            </p>
          </div>
        </div>

        {/* Draft Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Last saved: {getRelativeTime(draft.updatedAt)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Campaign Brief:</span>
              <span className={`font-medium ${hasBrief ? 'text-green-600' : 'text-gray-400'}`}>
                {hasBrief ? 'Saved' : 'Not started'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Form Configuration:</span>
              <span className={`font-medium ${hasForm ? 'text-green-600' : 'text-gray-400'}`}>
                {hasForm ? 'In progress' : 'Not started'}
              </span>
            </div>
            {draft.formId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Form ID:</span>
                <span className="font-mono text-xs text-gray-500">
                  {draft.formId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Choose carefully</p>
              <p>
                Restoring will replace any current work with the saved draft.
                Discarding will permanently delete the draft and cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            onClick={onRestore}
            className="flex-1 justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restore Draft
          </Button>
          <Button
            variant="secondary"
            onClick={onDiscard}
            className="flex-1 justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Discard Draft
          </Button>
        </div>

        {/* Cancel Option */}
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cancel and decide later
          </button>
        </div>
      </div>
    </Modal>
  );
}