import React from 'react';
import { useFormStore } from '@/stores/formStore';

export const FormBasics: React.FC = () => {
  const { activeForm, updateFormField } = useFormStore();

  if (!activeForm) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-900">Form Basics</h3>

      <div>
        <label className="block text-sm font-medium text-surface-700 mb-2">
          Form Name
        </label>
        <input
          type="text"
          value={activeForm.name}
          onChange={(e) => updateFormField('name', e.target.value)}
          className="form-input"
          placeholder="Untitled form"
        />
        <p className="text-xs text-surface-500 mt-1">
          Only visible in Ads Manager
        </p>
      </div>
    </section>
  );
};