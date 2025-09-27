import React from 'react';
import { useFormStore } from '@/stores/formStore';
import { Card } from '@/components/UI/Card';
import { RadioGroup } from '@/components/UI/RadioGroup';

export const ThankYouSection: React.FC = () => {
  const { activeForm, updateForm } = useFormStore();

  if (!activeForm) return null;

  const handleThankYouChange = (field: keyof typeof activeForm.thankYou, value: unknown) => {
    updateForm({
      thankYou: {
        ...activeForm.thankYou,
        [field]: value
      }
    });
  };

  const handleActionChange = (field: string, value: string) => {
    updateForm({
      thankYou: {
        ...activeForm.thankYou,
        action: {
          ...activeForm.thankYou.action,
          [field]: value
        }
      }
    });
  };

  const handleActionTypeChange = (type: 'website' | 'phone') => {
    updateForm({
      thankYou: {
        ...activeForm.thankYou,
        action: {
          type,
          label: type === 'website' ? 'View website' : 'Call now',
          websiteUrl: type === 'website' ? activeForm.thankYou.action.websiteUrl : '',
          phoneNumber: type === 'phone' ? activeForm.thankYou.action.phoneNumber : ''
        }
      }
    });
  };

  return (
    <section className="meta-card-grid">
      <h3 className="meta-section-title">Ending (Thank you)</h3>

      <Card className="meta-card-padding">
        <div className="space-y-sp-4">
          <div>
            <label className="block meta-label mb-sp-2">
              Completion Headline (&le;60)
            </label>
            <input
              type="text"
              value={activeForm.thankYou.headline}
              onChange={(e) => handleThankYouChange('headline', e.target.value)}
              maxLength={60}
              className="meta-input"
              placeholder="Thanks, you're all set."
            />
          </div>

          <div>
            <label className="block meta-label mb-sp-2">
              Thank you description (REQUIRED)
            </label>
            <textarea
              value={activeForm.thankYou.description}
              onChange={(e) => handleThankYouChange('description', e.target.value)}
              className="meta-textarea min-h-24"
              placeholder="Tell people what happens next"
            />
            {!activeForm.thankYou.description.trim() && (
              <p className="meta-error-text">
                A description is required for thank you page.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Additional Action Section */}
      <Card className="meta-card-padding">
        <div className="space-y-sp-4">
          <h4 className="meta-section-title">Additional action</h4>

          {/* Action Type Radio Buttons */}
          <RadioGroup
            name="actionType"
            value={activeForm.thankYou.action.type}
            onChange={(value) => handleActionTypeChange(value as 'website' | 'phone')}
            containerWidth="full"
            options={[
              {
                value: 'website',
                label: 'Go to website',
                description: 'Share a URL for people to visit your website.'
              },
              {
                value: 'phone',
                label: 'Call business',
                description: 'Allow people to call your business instantly.'
              }
            ]}
          />

          {/* Conditional Fields Based on Action Type */}
          {activeForm.thankYou.action.type === 'website' && (
            <div className="space-y-sp-4 ml-sp-6">
              <div>
                <label className="block meta-label mb-sp-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={activeForm.thankYou.action.websiteUrl || ''}
                  onChange={(e) => handleActionChange('websiteUrl', e.target.value)}
                  className="meta-input"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block meta-label mb-sp-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={activeForm.thankYou.action.label}
                  onChange={(e) => handleActionChange('label', e.target.value)}
                  className="meta-input"
                  placeholder="View website"
                />
              </div>
            </div>
          )}

          {activeForm.thankYou.action.type === 'phone' && (
            <div className="space-y-sp-4 ml-sp-6">
              <div>
                <label className="block meta-label mb-sp-2">
                  Phone number
                </label>
                <div className="flex gap-sp-2">
                  <select className="meta-input w-24">
                    <option value="US +1">US +1</option>
                    <option value="UK +44">UK +44</option>
                    <option value="CA +1">CA +1</option>
                  </select>
                  <input
                    type="tel"
                    value={activeForm.thankYou.action.phoneNumber || ''}
                    onChange={(e) => handleActionChange('phoneNumber', e.target.value)}
                    className="meta-input flex-1"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <label className="block meta-label mb-sp-2">
                  Call to action
                  <span className="meta-label ml-sp-2">
                    ({(activeForm.thankYou.action.label || '').length}/60)
                  </span>
                </label>
                <input
                  type="text"
                  value={activeForm.thankYou.action.label}
                  onChange={(e) => handleActionChange('label', e.target.value)}
                  maxLength={60}
                  className="meta-input"
                  placeholder="Call now"
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
};