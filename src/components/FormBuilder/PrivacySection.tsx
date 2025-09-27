import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFormStore } from '@/stores/formStore';
import type { Consent } from '@/types/form';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const PrivacySection: React.FC = () => {
  const { activeForm, updateForm } = useFormStore();
  const [newConsentLabel, setNewConsentLabel] = useState('');

  if (!activeForm) return null;

  const handlePrivacyUrlChange = (url: string) => {
    updateForm({
      privacy: {
        ...activeForm.privacy,
        businessPrivacyUrl: url
      }
    });
  };

  const addConsent = () => {
    if (!newConsentLabel.trim() || activeForm.privacy.customNotices.consents.length >= 4) {
      return;
    }

    const newConsent: Consent = {
      id: generateId(),
      label: newConsentLabel.trim(),
      optional: false
    };

    updateForm({
      privacy: {
        ...activeForm.privacy,
        customNotices: {
          ...activeForm.privacy.customNotices,
          consents: [...activeForm.privacy.customNotices.consents, newConsent]
        }
      }
    });

    setNewConsentLabel('');
  };

  const removeConsent = (consentId: string) => {
    updateForm({
      privacy: {
        ...activeForm.privacy,
        customNotices: {
          ...activeForm.privacy.customNotices,
          consents: activeForm.privacy.customNotices.consents.filter(c => c.id !== consentId)
        }
      }
    });
  };

  const updateConsent = (consentId: string, updates: Partial<Consent>) => {
    updateForm({
      privacy: {
        ...activeForm.privacy,
        customNotices: {
          ...activeForm.privacy.customNotices,
          consents: activeForm.privacy.customNotices.consents.map(c =>
            c.id === consentId ? { ...c, ...updates } : c
          )
        }
      }
    });
  };

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-900">Privacy</h3>

      <div>
        <label className="block text-sm font-medium text-surface-700 mb-2">
          Client's Privacy Policy URL
        </label>
        <input
          type="url"
          value={activeForm.privacy.businessPrivacyUrl}
          onChange={(e) => handlePrivacyUrlChange(e.target.value)}
          className="form-input"
          placeholder="https://example.com/privacy"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-surface-700 mb-3">
          Custom notices
          <span className="text-sm text-surface-500 ml-2">(up to 4 consents)</span>
        </label>

        <div className="space-y-3">
          {activeForm.privacy.customNotices.consents.map((consent) => (
            <div key={consent.id} className="flex items-center gap-3 p-3 border border-surface-200 rounded-lg">
              <input
                type="text"
                value={consent.label}
                onChange={(e) => updateConsent(consent.id, { label: e.target.value })}
                className="form-input flex-1"
                placeholder="Consent label (e.g., I agree to receive SMS updates)"
              />
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={consent.optional}
                  onChange={(e) => updateConsent(consent.id, { optional: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                Optional
              </label>
              <button
                onClick={() => removeConsent(consent.id)}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Remove consent"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add new consent form */}
          {activeForm.privacy.customNotices.consents.length < 4 && (
            <div className="flex items-center gap-3 p-3 border-2 border-dashed border-surface-300 rounded-lg">
              <input
                type="text"
                value={newConsentLabel}
                onChange={(e) => setNewConsentLabel(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addConsent()}
                className="form-input flex-1"
                placeholder="Add new consent (e.g., I agree to receive SMS updates)"
              />
              <button
                onClick={addConsent}
                disabled={!newConsentLabel.trim()}
                className="btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {activeForm.privacy.customNotices.consents.length >= 4 && (
          <p className="text-sm text-surface-500">
            Maximum of 4 custom consents allowed
          </p>
        )}
      </div>
    </section>
  );
};