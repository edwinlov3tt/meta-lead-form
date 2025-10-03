import React from 'react';
import { ChevronRight, Info } from 'lucide-react';
import type { MetaLeadForm, FacebookPageData } from '@/types/form';

interface MetaFormCardV2Props {
  form: MetaLeadForm;
  currentStep: number;
  facebookPageData?: FacebookPageData | null;
}

// Meta Design Tokens (exact from Facebook specifications)
const TOKENS = {
  colors: {
    canvas: '#F0F2F5',
    surface: '#FFFFFF',
    text: '#1C1E21',
    text2: '#65676B',
    label: '#8A8D91',
    divider: '#E4E6EB',
    border: '#DADDE1',
    blue: '#1877F2',
    blueHover: '#166FE5',
    link: '#1B74E4',
  },
  shadows: {
    card: '0 12px 28px rgba(0,0,0,0.20), 0 2px 4px rgba(0,0,0,0.10)',
    avatar: '0 1px 2px rgba(0,0,0,0.10)',
  },
  fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Noto Sans", "Liberation Sans", sans-serif',
};

// Icon Components
const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} className="text-white">
    <path fill="currentColor" d="M10 17l5-5-5-5v10z" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} className="text-current">
    <path fill="currentColor" d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.3 10.59 10.6 16.89 4.3z" />
  </svg>
);

// Main Card Component
const MetaCard: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children,
  className = '',
  style
}) => (
  <div
    className={`bg-white rounded-[12px] mx-auto ${className}`}
    style={{
      boxShadow: TOKENS.shadows.card,
      fontFamily: TOKENS.fontFamily,
      ...style
    }}
  >
    {children}
  </div>
);

// Phone Frame Component
const PhoneFrame: React.FC<{
  children: React.ReactNode;
  footer?: React.ReactNode;
  progress?: number;
  onClose?: () => void;
}> = ({ children, footer, progress, onClose }) => (
  <div
    className="w-80 h-[34.63rem] rounded-[12px] border-2 overflow-hidden"
    style={{
      borderColor: TOKENS.colors.border,
      background: TOKENS.colors.canvas,
      fontFamily: TOKENS.fontFamily
    }}
  >
    {/* Screen body */}
    <div
      className="relative w-80 h-[30.5rem] overflow-hidden"
      style={{ background: TOKENS.colors.canvas }}
    >
      {onClose && (
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 h-6 w-6 inline-flex items-center justify-center rounded z-10"
          style={{ color: TOKENS.colors.text }}
        >
          <CloseIcon />
        </button>
      )}
      {children}
    </div>

    {/* Footer bar */}
    {footer && (
      <div className="w-full h-16 border-t-2" style={{ borderColor: TOKENS.colors.border }}>
        <div className="bg-white w-full h-full px-3 pt-3 pb-2">
          {typeof progress === 'number' && (
            <div className="w-full h-1 mb-2 rounded-full" style={{ background: TOKENS.colors.divider }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress * 100}%`,
                  background: TOKENS.colors.link
                }}
              />
            </div>
          )}
          {footer}
        </div>
      </div>
    )}
  </div>
);

// Button Components
const PillButton: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="h-10 px-4 inline-flex items-center gap-2 text-white text-sm font-semibold rounded-[24px] transition-all duration-200 hover:scale-105"
    style={{ background: TOKENS.colors.blue }}
  >
    {children}
    <ArrowRightIcon />
  </button>
);

const PrimaryButton: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="w-full h-10 text-white text-sm font-bold rounded-[8px] transition-all duration-200"
    style={{ background: TOKENS.colors.blue }}
  >
    {children}
  </button>
);

// Form Field Component
const UnderlineField: React.FC<{ label: string; optional?: boolean; placeholder?: string }> = ({
  label,
  optional,
  placeholder = "Enter your answer."
}) => (
  <label className="block pl-4 w-64 mx-auto">
    <div
      className="mb-1 text-[12px] leading-[18px]"
      style={{ color: TOKENS.colors.label }}
    >
      {label} {optional && <span className="ml-1">(Optional)</span>}
    </div>
    <div
      className="h-8 leading-8 border-b-2 cursor-text"
      style={{
        borderColor: TOKENS.colors.border,
        color: TOKENS.colors.label
      }}
    >
      {placeholder}
    </div>
  </label>
);

export const MetaFormCardV2: React.FC<MetaFormCardV2Props> = ({ form, currentStep, facebookPageData }) => {
  const getBusinessName = () => facebookPageData?.name || 'Your Facebook Page Name';
  const getProfileImage = () => facebookPageData?.profile_picture;

  const renderStepContent = () => {
    // Step 0: Intro Screen
    if (currentStep === 0) {
      return (
        <PhoneFrame
          progress={0.25}
          onClose={() => {}}
          footer={
            <div className="flex items-center justify-center">
              <PillButton>Continue</PillButton>
            </div>
          }
        >
          {/* Brand avatar - positioned absolutely relative to PhoneFrame */}
          <div
            className="absolute left-1/2 -translate-x-1/2 mt-16 w-14 h-14 rounded-full border-2 border-white overflow-hidden"
            style={{
              background: '#E5E7EB',
              boxShadow: TOKENS.shadows.avatar
            }}
          >
            {getProfileImage() ? (
              <img
                src={getProfileImage()}
                alt={getBusinessName()}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg">
                {facebookPageData?.name ?
                  facebookPageData.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) :
                  'U'
                }
              </div>
            )}
          </div>

          <div className="px-5">
            <MetaCard className="w-full mt-24" style={{ minHeight: '112px' }}>
            <div className="h-16 w-full text-center">
              <div
                className="pt-9 mx-auto w-36 text-[14px] leading-[14px] text-ellipsis overflow-hidden flex items-center justify-center gap-1"
                style={{ color: TOKENS.colors.label }}
              >
                {getBusinessName()}
                {facebookPageData?.verified && (
                  <span className="text-blue-500 text-xs">✓</span>
                )}
              </div>
            </div>
            <div
              className="px-4 mx-auto w-60 text-center text-[20px] leading-[28px] font-bold pb-4"
              style={{ color: TOKENS.colors.text }}
            >
              {form.intro.headline || 'We need your help to get you the best service of your dreams'}
            </div>
            {form.intro.description && (
              <div
                className="px-4 mx-auto w-60 text-center text-[14px] leading-[20px] pb-4"
                style={{ color: TOKENS.colors.text2 }}
              >
                {form.intro.description}
              </div>
            )}
          </MetaCard>
          </div>
        </PhoneFrame>
      );
    }

    // Step 1: Contact Information
    if (currentStep === 1) {
      return (
        <PhoneFrame
          progress={0.50}
          onClose={() => {}}
          footer={<PrimaryButton>Continue</PrimaryButton>}
        >
          <div className="pt-24 pb-16 px-5">
            <MetaCard className="w-full" style={{ paddingBottom: '24px' }}>
              <div className="pt-5 pl-4 flex items-center gap-2">
                <div
                  className="text-[16px] leading-[22px] font-semibold"
                  style={{ color: TOKENS.colors.text }}
                >
                  Contact information
                </div>
                <Info className="w-4 h-4" style={{ color: TOKENS.colors.text }} />
              </div>
              <div className="mt-2" />
              <div className="space-y-6 pt-1">
                {form.contactFields
                  .sort((a, b) => a.order - b.order)
                  .slice(0, 3)
                  .map((field) => (
                    <UnderlineField
                      key={field.id}
                      label={field.name}
                      optional={!field.required}
                      placeholder={field.placeholder || 'Enter your answer.'}
                    />
                  ))}
              </div>
            </MetaCard>
          </div>
        </PhoneFrame>
      );
    }

    // Step 2: Questions (if any)
    if (currentStep === 2 && form.qualifiers.length > 0) {
      const question = form.qualifiers[0];
      return (
        <PhoneFrame
          progress={0.75}
          onClose={() => {}}
          footer={<PrimaryButton>Continue</PrimaryButton>}
        >
          <div className="pt-24 pb-16 px-5">
            <MetaCard className="w-full p-5">
              <div
                className="text-[16px] leading-[22px] font-semibold mb-4"
                style={{ color: TOKENS.colors.text }}
              >
                {question.question}
              </div>
              {question.type === 'multiple_choice' && question.options && (
                <div className="space-y-3">
                  {question.options.filter(Boolean).map((option, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 rounded border-gray-300" />
                      <span className="text-[14px]" style={{ color: TOKENS.colors.text }}>
                        {option}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </MetaCard>
          </div>
        </PhoneFrame>
      );
    }

    // Step 3: Privacy Policy
    if (currentStep === 3 || (currentStep === 2 && form.qualifiers.length === 0)) {
      return (
        <PhoneFrame
          progress={0.75}
          onClose={() => {}}
          footer={<PrimaryButton>Submit</PrimaryButton>}
        >
          <div className="pt-24 pb-16 px-5">
            <MetaCard className="w-full p-5">
              <div
                className="text-[14px] font-semibold mb-4"
                style={{ color: TOKENS.colors.text }}
              >
                Privacy policy
              </div>
              <div className="text-[12px] leading-[18px]" style={{ color: TOKENS.colors.label }}>
                <p className="mb-2" style={{ color: TOKENS.colors.text2 }}>
                  By clicking Submit, you agree to send your info to {getBusinessName()} who agrees to use it according to their
                  privacy policy. Facebook will also use it subject to our Data Policy, including to auto‑fill forms for ads.
                </p>
                <p className="font-semibold mb-1" style={{ color: TOKENS.colors.link }}>
                  View Facebook Data Policy.
                </p>
                <p className="font-semibold" style={{ color: TOKENS.colors.link }}>
                  Visit {getBusinessName()}'s Privacy Policy.
                </p>
              </div>
            </MetaCard>
          </div>
        </PhoneFrame>
      );
    }

    // Step 4: Thank You
    return (
      <PhoneFrame
        progress={1}
        onClose={() => {}}
        footer={
          <PrimaryButton>
            {form.thankYou.action.label || 'View website'}
          </PrimaryButton>
        }
      >
        <div className="pt-24 px-5">
          {/* Brand avatar */}
          <div
            className="absolute left-1/2 -translate-x-1/2 mt-16 w-14 h-14 rounded-full border-2 border-white overflow-hidden"
            style={{
              background: '#E5E7EB',
              boxShadow: TOKENS.shadows.avatar
            }}
          >
            {getProfileImage() ? (
              <img
                src={getProfileImage()}
                alt={getBusinessName()}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg">
                {facebookPageData?.name ?
                  facebookPageData.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) :
                  'U'
                }
              </div>
            )}
          </div>

          <MetaCard className="w-full" style={{ minHeight: '160px' }}>
            <div
              className="pt-9 mx-auto w-44 text-center text-[14px] leading-[18px] text-ellipsis overflow-hidden"
              style={{ color: TOKENS.colors.label }}
            >
              {getBusinessName()}
            </div>
            <div
              className="px-4 mx-auto w-60 text-center text-[14px] leading-[18px] font-bold mt-2"
              style={{ color: TOKENS.colors.text }}
            >
              {form.thankYou.headline || "Thanks, you're all set."}
            </div>
            <div
              className="px-4 mx-auto w-60 text-center text-[14px] leading-[20px] mt-2"
              style={{ color: TOKENS.colors.text2 }}
            >
              {form.thankYou.description || 'You can visit our website or exit the form now.'}
              <div className="my-3 border-b-2" style={{ borderColor: TOKENS.colors.border }} />
              <div
                className="text-[10.5px] leading-[14px]"
                style={{ color: TOKENS.colors.label }}
              >
                You successfully submitted your responses.
              </div>
            </div>
          </MetaCard>
        </div>
      </PhoneFrame>
    );
  };

  return (
    <div
      className="w-full flex items-start justify-center"
      style={{
        background: TOKENS.colors.canvas,
        color: TOKENS.colors.text,
        fontFamily: TOKENS.fontFamily
      }}
    >
      {renderStepContent()}
    </div>
  );
};