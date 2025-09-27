import React from 'react';
import type { MetaLeadForm, FacebookPageData } from '@/types/form';

interface MetaFormCardProps {
  form: MetaLeadForm;
  currentStep: number;
  facebookPageData?: FacebookPageData | null;
}

export const MetaFormCard: React.FC<MetaFormCardProps> = ({ form, currentStep, facebookPageData }) => {
  const renderStepContent = () => {
    // Handle intro step
    if (currentStep === 0) {
      return (
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary-100 border-2 border-white -mt-8 shadow flex items-center justify-center overflow-hidden">
              {facebookPageData?.profile_picture ? (
                <img
                  src={facebookPageData.profile_picture}
                  alt={facebookPageData.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials on image load error
                    const initials = (facebookPageData.name || 'FB').split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.style.display = 'flex';
                  }}
                />
              ) : null}
              <span
                className="text-primary-600 font-bold text-lg flex items-center justify-center w-full h-full"
                style={{ display: facebookPageData?.profile_picture ? 'none' : 'flex' }}
              >
                {facebookPageData?.name ?
                  facebookPageData.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) :
                  'U'
                }
              </span>
            </div>
          </div>
          <div>
            <div className="text-meta-gray-500 text-sm flex items-center justify-center gap-1">
              {facebookPageData?.name || 'Your Facebook Page Name'}
              {facebookPageData?.verified && <span className="text-blue-500 text-xs">✓</span>}
            </div>
            <h3 className="font-bold text-xl mt-1 text-surface-900">
              {form.intro.headline || 'Your form headline'}
            </h3>
            {form.intro.description && (
              <p className="text-meta-gray-600 text-sm mt-1">
                {form.intro.description}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Handle questions step
    if (currentStep === 1 && form.qualifiers.length > 0) {
      return (
        <div className="space-y-3">
          <div className="text-surface-800 font-semibold">Questions</div>
          {form.qualifiers.slice(0, 1).map((qualifier) => (
            <div key={qualifier.id} className="space-y-2">
              <div className="text-sm font-medium text-surface-900">
                {qualifier.question || 'Sample question'}
              </div>
              {qualifier.type === 'multiple_choice' && qualifier.options && qualifier.options.length > 0 ? (
                <div className="space-y-2">
                  {qualifier.options.filter(opt => opt).slice(0, 4).map((option, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-sm">
                      <input
                        type={qualifier.allowMultipleResponses ? 'checkbox' : 'radio'}
                        name={`question-${qualifier.id}`}
                        className="text-meta-blue focus:ring-meta-blue"
                        disabled
                      />
                      <span className="text-surface-700">{option || `Option ${idx + 1}`}</span>
                    </label>
                  ))}
                </div>
              ) : qualifier.type === 'appointment_request' ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm text-meta-gray-500 bg-white border border-meta-gray-300 rounded text-left">
                      Select date range
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm text-meta-gray-500 bg-white border border-meta-gray-300 rounded text-left">
                      Select time
                    </button>
                  </div>
                  {qualifier.showConfirmationMessage && qualifier.confirmationMessage && (
                    <div className="text-xs text-meta-gray-600 bg-meta-gray-50 p-2 rounded">
                      {qualifier.confirmationMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-meta-gray-400 p-2 border border-meta-gray-200 rounded">
                  Your answer here...
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Handle contact fields step
    if ((currentStep === 1 && form.qualifiers.length === 0) || currentStep === 2) {
      return (
        <div className="space-y-3">
          <div className="text-surface-800 font-semibold">Contact information</div>
          {form.contactDescription && (
            <p className="text-sm text-meta-gray-600">{form.contactDescription}</p>
          )}
          <div className="space-y-2">
            {form.contactFields.slice(0, 3).map((field) => (
              <div key={field.id} className="text-sm text-meta-gray-400">
                {field.name}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Handle review step (higher intent only)
    if (currentStep === 3 && form.formType === 'higher_intent') {
      return (
        <div className="space-y-3">
          <div className="text-surface-800 font-semibold">Review your information</div>
          <div className="text-sm text-meta-gray-600 space-y-1">
            <div>Please review your information before submitting</div>
            <div className="mt-2 p-2 bg-meta-gray-50 rounded text-xs">
              {form.contactFields.map(f => f.name).join(', ')}
            </div>
          </div>
        </div>
      );
    }

    // Handle privacy step
    if ((currentStep === 3 && form.formType !== 'higher_intent') || currentStep === 4) {
      return (
        <div className="space-y-3">
          <div className="text-surface-900 font-semibold">Privacy policy</div>
          <p className="text-sm text-meta-gray-600">
            By clicking Submit, you agree to send your info to{' '}
            <span className="font-medium">Top Contractor Near Me</span> who agrees to use it
            according to their privacy policy. Facebook will also use it subject to our Data Policy.
          </p>
          <div className="space-y-1 text-xs">
            <a href="#" className="text-meta-blue underline block">
              View Facebook Data Policy
            </a>
            {form.privacy.businessPrivacyUrl && (
              <a href={form.privacy.businessPrivacyUrl} className="text-meta-blue underline block">
                Visit Business Privacy Policy
              </a>
            )}
          </div>
          {form.privacy.customNotices.consents.length > 0 && (
            <div className="space-y-2 pt-2">
              {form.privacy.customNotices.consents.map((consent) => (
                <label key={consent.id} className="flex items-start gap-2 text-xs">
                  <input type="checkbox" className="mt-0.5 rounded-sm" />
                  <span className="text-meta-gray-600">{consent.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Handle thank you step (default)
    return (
      <div className="text-center space-y-3">
        <div className="text-meta-gray-500 text-sm">Top Contractor Near Me</div>
        <div className="font-semibold text-surface-900">
          {form.thankYou.headline}
        </div>
        {form.thankYou.description && (
          <p className="text-meta-gray-600 text-sm">
            {form.thankYou.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 space-y-4">
      {renderStepContent()}
    </div>
  );
};