import React, { useEffect, useState } from 'react';
import { Check, Save, AlertCircle } from 'lucide-react';
import { useFormStore } from '@/stores/formStore';

export const AutoSave: React.FC = () => {
  const { isDirty, exportCampaign } = useFormStore();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (!isDirty) return;

    const autoSaveTimer = setTimeout(async () => {
      setIsSaving(true);
      setSaveError(null);

      try {
        // Simulate auto-save to localStorage
        const campaignData = exportCampaign();
        if (campaignData) {
          localStorage.setItem('meta-form-autosave', campaignData);
          localStorage.setItem('meta-form-autosave-timestamp', Date.now().toString());
          setLastSaved(new Date());
        }
      } catch (error) {
        setSaveError('Failed to auto-save');
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [isDirty, exportCampaign]);

  // Load auto-saved data on mount
  useEffect(() => {
    const savedTimestamp = localStorage.getItem('meta-form-autosave-timestamp');
    if (savedTimestamp) {
      setLastSaved(new Date(parseInt(savedTimestamp)));
    }
  }, []);

  // Don't show if nothing to display
  if (!isDirty && !lastSaved && !saveError) return null;

  return (
    <div className="flex items-center gap-2 text-xs">
      {isSaving ? (
        <>
          <Save className="w-3 h-3 text-blue-600 animate-pulse" />
          <span className="text-surface-600">Saving...</span>
        </>
      ) : saveError ? (
        <>
          <AlertCircle className="w-3 h-3 text-red-600" />
          <span className="text-red-600">{saveError}</span>
        </>
      ) : lastSaved ? (
        <>
          <Check className="w-3 h-3 text-green-600" />
          <span className="text-surface-600">
            Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </>
      ) : null}
    </div>
  );
};