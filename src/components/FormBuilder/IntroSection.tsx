import React from 'react';
import { useFormStore } from '@/stores/formStore';

export const IntroSection: React.FC = () => {
  const { activeForm, updateForm } = useFormStore();

  if (!activeForm) return null;

  const handleIntroChange = (field: 'headline' | 'description', value: string) => {
    updateForm({
      intro: {
        ...activeForm.intro,
        [field]: value
      }
    });
  };

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-900">Intro</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Headline
            <span className="text-xs text-surface-500 ml-2">
              ({activeForm.intro.headline.length}/60)
            </span>
          </label>
          <input
            type="text"
            value={activeForm.intro.headline}
            onChange={(e) => handleIntroChange('headline', e.target.value)}
            maxLength={60}
            className="form-input"
            placeholder="e.g. Get your free estimate"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Description
          </label>
          <textarea
            value={activeForm.intro.description}
            onChange={(e) => handleIntroChange('description', e.target.value)}
            className="form-textarea min-h-24"
            placeholder="Tell people why they should complete your form"
          />
        </div>
      </div>
    </section>
  );
};