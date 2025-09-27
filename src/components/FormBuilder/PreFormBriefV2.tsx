import React, { useState, useEffect } from 'react';
import { Upload, AlertTriangle, CheckCircle, Info, ArrowRight, Facebook, ExternalLink, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { FormPreview } from '../Preview/FormPreview';
import { FacebookPageService } from '@/services/facebookApi';
import { useFormStore } from '@/stores/formStore';
import { useSmartAutosave } from '@/hooks/useSmartAutosave';
import { RadioGroup, type RadioGroupOption } from '@/components/UI/RadioGroup';
import { api, ApiError } from '@/services/api';
import type { PreFormBrief, MetaLeadForm, FacebookPageData } from '@/types/form';
import type { AIFormGenerationResponse } from '@/services/api';
import { BreadcrumbStepper, type Step } from '@/components/UI/BreadcrumbStepper';
import AIGenerationToggle from '@/components/UI/AIGenerationToggle';
import { DomainSanitizer } from '@/utils/domainSanitizer';

interface PreFormBriefV2Props {
  onComplete: (brief: PreFormBrief) => void;
  onNext: () => void;
  initialData?: Partial<PreFormBrief>;
}

interface AlertProps {
  type: 'error' | 'warning' | 'success' | 'info';
  children: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({ type, children }) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    error: <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
    success: <CheckCircle className="w-4 h-4 flex-shrink-0" />,
    info: <Info className="w-4 h-4 flex-shrink-0" />
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles[type]} mt-3`}>
      {icons[type]}
      <div className="text-sm flex-1">{children}</div>
    </div>
  );
};


// Modern Checkbox Component
const CheckboxOption: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => (
  <label className="flex items-start gap-3 p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors cursor-pointer">
    <div className="pt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary-600 rounded border-2 border-surface-300 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
      />
    </div>
    <div className="flex-1">
      <div className="font-medium text-surface-900 text-sm">{label}</div>
      {description && (
        <div className="text-xs text-surface-600 mt-0.5">{description}</div>
      )}
    </div>
  </label>
);

export const PreFormBriefV2: React.FC<PreFormBriefV2Props> = ({
  onComplete,
  onNext,
  initialData
}) => {
  const { updateForm, preFormBrief, setPreFormBrief, setCurrentView } = useFormStore();
  const [formData, setFormData] = useState<Partial<PreFormBrief>>({
    clientFacebookPage: '',
    campaignObjective: '',
    industry: '',
    creativeFile: null,
    monthlyLeadGoal: '',
    formType: 'more_volume', // Default to more volume
    hasAdminAccess: 'yes',
    leadEmailAddresses: '',
    isHealthRelated: false,
    hasScreeningQuestions: true,
    screeningQuestionSuggestions: '',
    responseTime: { value: '', unit: 'minutes' },
    hasPrivacyPolicy: 'yes',
    privacyPolicyUrl: '',
    clientWebsiteUrl: '',
    additionalNotes: '',
    isComplete: false,
    ...initialData,
    ...preFormBrief
  });

  const [clientWebsiteUrl, setClientWebsiteUrl] = useState('');
  const [isCheckingPrivacy, setIsCheckingPrivacy] = useState(false);

  const [canSubmit, setCanSubmit] = useState(false);
  const [clientPageName, setClientPageName] = useState(preFormBrief?.facebookPageData?.name || 'Your Business Name');
  const [isAdditionalSettingsExpanded, setIsAdditionalSettingsExpanded] = useState(false);
  const [clientPageImage, setClientPageImage] = useState<string | null>(preFormBrief?.facebookPageData?.profile_picture || null);
  const [facebookPageData, setFacebookPageData] = useState<FacebookPageData | null>(preFormBrief?.facebookPageData || null);
  const [isVerifyingPage, setIsVerifyingPage] = useState(false);
  const [pageVerificationMessage, setPageVerificationMessage] = useState<string | null>(null);
  const [pageVerificationStatus, setPageVerificationStatus] = useState<'success' | 'error' | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);
  const [hasGeneratedQuestions, setHasGeneratedQuestions] = useState(false);
  const [aiGenerationEnabled, setAiGenerationEnabled] = useState(true); // Default enabled
  const [isGeneratingCompleteForm, setIsGeneratingCompleteForm] = useState(false);

  // Initialize autosave functionality
  const { status: autosaveStatus } = useSmartAutosave({
    enabled: true,
    debounceMs: 3000,
    showNotifications: false
  });

  // Update form when brief data changes
  useEffect(() => {
    if (formData.campaignObjective) {
      updateForm({
        meta: {
          objective: formData.campaignObjective,
          industry: '',
          priority: 'balanced',
          tone: '',
          audience: ''
        },
        intro: {
          headline: 'Get your free estimate',
          description: 'Answer a few quick questions and we\'ll match you with a pro.'
        }
      });
    }
  }, [formData.campaignObjective, updateForm]);

  // Handle Facebook page verification
  const handleVerifyFacebookPage = async () => {
    const facebookUrl = formData.clientFacebookPage?.trim();
    if (!facebookUrl) return;

    if (!FacebookPageService.isValidFacebookUrl(facebookUrl)) {
      setPageVerificationMessage('Please enter a valid Facebook page URL');
      setPageVerificationStatus('error');
      return;
    }

    setIsVerifyingPage(true);
    setPageVerificationMessage(null);
    setPageVerificationStatus(null);

    try {
      const result = await FacebookPageService.fetchPageData(facebookUrl);

      if (result.success && result.data) {
        const sanitizedData = FacebookPageService.sanitizePageData(result.data);
        setFacebookPageData(sanitizedData);
        setClientPageName(sanitizedData.name);
        setClientPageImage(sanitizedData.profile_picture);

        // Auto-populate website URL if available
        if (sanitizedData.website && !clientWebsiteUrl) {
          setClientWebsiteUrl(sanitizedData.website);
        }

        setPageVerificationMessage(`Successfully verified "${sanitizedData.name}" page`);
        setPageVerificationStatus('success');

        // Save Facebook page data to form store for AI context and persistence
        const updatedFormData = {
          ...formData,
          facebookPageData: sanitizedData
        };
        setFormData(updatedFormData);

        // Update form data with fetched page data
        updateField('facebookPageData', sanitizedData);

        // Immediately save to store for persistence across tab switches
        const briefToSave = preFormBrief ? {
          ...preFormBrief,
          facebookPageData: sanitizedData
        } : {
          id: Date.now().toString(),
          clientFacebookPage: formData.clientFacebookPage || facebookUrl,
          facebookPageData: sanitizedData,
          campaignObjective: formData.campaignObjective || '',
          monthlyLeadGoal: formData.monthlyLeadGoal || '',
          hasAdminAccess: formData.hasAdminAccess || 'yes',
          leadEmailAddresses: formData.leadEmailAddresses || '',
          targetAudience: formData.targetAudience || '',
          businessType: formData.businessType || '',
          industry: formData.industry || '',
          conversionGoals: formData.conversionGoals || [],
          screeningQuestionSuggestions: formData.screeningQuestionSuggestions || '',
          responseTime: formData.responseTime || { value: '', unit: 'minutes' },
          hasPrivacyPolicy: formData.hasPrivacyPolicy || 'yes',
          privacyPolicyUrl: formData.privacyPolicyUrl || '',
          additionalNotes: formData.additionalNotes || '',
          isComplete: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setPreFormBrief(briefToSave);
      } else {
        setPageVerificationMessage(result.error || 'Failed to verify Facebook page');
        setPageVerificationStatus('error');

        // Fallback to manual page name extraction
        const username = FacebookPageService.extractPageUsername(facebookUrl);
        if (username) {
          const fallbackName = username.charAt(0).toUpperCase() + username.slice(1).replace(/[-_]/g, ' ');
          setClientPageName(fallbackName);
          setClientPageImage(FacebookPageService.getFallbackProfilePicture(fallbackName));
        }
      }
    } catch (error) {
      console.error('Facebook verification error:', error);
      setPageVerificationMessage('Network error occurred while verifying page');
      setPageVerificationStatus('error');
    } finally {
      setIsVerifyingPage(false);
    }
  };

  // Validation and submission logic
  useEffect(() => {
    const isValid =
      formData.clientFacebookPage?.trim() &&
      formData.industry?.trim() &&
      formData.campaignObjective?.trim() &&
      formData.monthlyLeadGoal?.trim() &&
      formData.hasAdminAccess !== 'no' &&
      (formData.hasAdminAccess === 'yes' || formData.isHealthRelated || formData.leadEmailAddresses?.trim()) &&
      formData.responseTime?.value &&
      parseFloat(formData.responseTime.value) > 0 &&
      getResponseTimeInMinutes() <= 720 && // 12 hours max
      (formData.hasPrivacyPolicy === 'yes' ? formData.privacyPolicyUrl?.trim() : true);

    setCanSubmit(!!isValid);
  }, [formData]);

  // Auto-select/unselect HIPAA compliance based on industry
  useEffect(() => {
    const healthcareIndustries = [
      'Dentists & Dental Services',
      'Health & Fitness',
      'Physicians & Surgeons'
    ];

    if (formData.industry) {
      if (healthcareIndustries.includes(formData.industry)) {
        // Auto-select HIPAA for healthcare industries
        if (!formData.isHealthRelated) {
          updateField('isHealthRelated', true);
        }
      } else {
        // Auto-uncheck HIPAA for non-healthcare industries
        if (formData.isHealthRelated) {
          updateField('isHealthRelated', false);
        }
      }
    }
  }, [formData.industry]);

  const updateField = <K extends keyof PreFormBrief>(field: K, value: PreFormBrief[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateField('creativeFile', file);
    }
  };

  const getResponseTimeInMinutes = () => {
    const value = parseFloat(formData.responseTime?.value || '0');
    return formData.responseTime?.unit === 'hours' ? value * 60 : value;
  };

  const getResponseTimeAlert = () => {
    const totalMinutes = getResponseTimeInMinutes();

    if (totalMinutes <= 5) {
      return { type: 'success' as const, message: 'Excellent! Your response time is optimal for maximum conversion rates.' };
    } else if (totalMinutes <= 15) {
      return { type: 'success' as const, message: 'Great response time! You\'re within Meta\'s recommended window.' };
    } else if (totalMinutes <= 120) {
      return { type: 'warning' as const, message: 'Good response time, but faster responses typically see higher conversion rates.' };
    } else if (totalMinutes <= 720) {
      return { type: 'error' as const, message: 'Response time is approaching the maximum. Consider improving response processes.' };
    } else {
      return { type: 'error' as const, message: 'Response time exceeds 12 hours. Campaigns cannot run without faster response times.' };
    }
  };

  const [privacyCheckMessage, setPrivacyCheckMessage] = useState<string | null>(null);
  const [privacyCheckType, setPrivacyCheckType] = useState<'success' | 'warning' | null>(null);
  const [privacyFoundViaApi, setPrivacyFoundViaApi] = useState(false);

  const handleCheckPrivacyPolicy = async () => {
    if (!clientWebsiteUrl.trim()) return;

    setIsCheckingPrivacy(true);
    setPrivacyCheckMessage(null);

    try {
      // Sanitize the domain before making API call
      const sanitizedResult = DomainSanitizer.sanitizeDomain(clientWebsiteUrl.trim());

      if (!sanitizedResult.isValid) {
        setPrivacyCheckMessage(`Invalid URL format: ${sanitizedResult.cleanedDomain}. Please enter a valid website URL.`);
        setPrivacyCheckType('warning');
        return;
      }

      // Use the cleaned domain for the API call
      const domainToCheck = sanitizedResult.cleanedDomain;

      if (!domainToCheck || domainToCheck === 'undefined' || domainToCheck.trim().length === 0) {
        setPrivacyCheckMessage('Please enter a valid website URL before checking for privacy policy.');
        setPrivacyCheckType('warning');
        return;
      }

      const apiUrl = `https://privacy.edwinlovett.com/?site=${encodeURIComponent(domainToCheck)}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.found && data.result) {
        // Privacy policy found
        updateField('hasPrivacyPolicy', 'yes');
        updateField('privacyPolicyUrl', data.result);
        setPrivacyCheckMessage(`Privacy policy found and validated: ${data.result}`);
        setPrivacyCheckType('success');
        setPrivacyFoundViaApi(true);
      } else {
        // Privacy policy not found
        setPrivacyCheckMessage(`Privacy policy not found on ${domainToCheck}. You will need to obtain the privacy policy URL from the client before campaign launch.`);
        setPrivacyCheckType('warning');
        setPrivacyFoundViaApi(false);
      }
    } catch (error) {
      console.error('Privacy policy check failed:', error);

      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setPrivacyCheckMessage('Network error: Unable to connect to privacy policy service. Please check your internet connection and try again.');
      } else if (error instanceof Error && error.name === 'AbortError') {
        setPrivacyCheckMessage('Request timed out: The privacy policy check is taking too long. Please try again or verify the URL manually.');
      } else {
        setPrivacyCheckMessage('Error checking for privacy policy. Please verify the website URL is correct and try again, or obtain the privacy policy URL manually from the client.');
      }
      setPrivacyCheckType('warning');
    } finally {
      setIsCheckingPrivacy(false);
    }
  };

  // AI Question Generation
  const handleGenerateQuestions = async () => {
    if (!formData.campaignObjective || !formData.industry) {
      setAiGenerationError('Please complete the campaign objective and industry selection first.')
      return
    }

    setIsGeneratingQuestions(true)
    setAiGenerationError(null)

    try {
      const briefData = {
        objective: formData.campaignObjective,
        industry: formData.industry,
        priority: 'balanced' as const,
        tone: 'professional and friendly',
        audience: 'potential customers',
        monthlyLeadGoal: formData.monthlyLeadGoal,
        formType: formData.formType || 'more_volume',
        hasScreeningQuestions: formData.hasScreeningQuestions,
        responseTime: formData.responseTime
      }

      const response = await api.generateQuestions(briefData)

      // Add generated questions to the form
      const generatedQualifiers = response.questions.map((q, index) => ({
        ...q,
        id: `ai_${Date.now()}_${index}`,
        conditional: undefined
      }))

      // Get current form from store
      const currentForm = useFormStore.getState().activeForm

      // Update the form with AI-generated questions
      updateForm({
        qualifiers: [...(currentForm?.qualifiers || []), ...generatedQualifiers]
      })

      setHasGeneratedQuestions(true)

    } catch (error) {
      console.error('AI Generation Error:', error)

      if (error instanceof ApiError) {
        setAiGenerationError(`AI service error: ${error.message}`)
      } else {
        setAiGenerationError('Failed to generate questions. Please try again.')
      }
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  // Comprehensive AI Form Generation
  const handleGenerateCompleteForm = async () => {
    if (!isReadyForAIGeneration()) {
      setAiGenerationError('Please complete Campaign Objective, Industry, and Form Type fields first.')
      return
    }

    setIsGeneratingCompleteForm(true)
    setAiGenerationError(null)

    try {
      const briefData = {
        objective: formData.campaignObjective!,
        industry: formData.industry!,
        priority: 'balanced' as const,
        tone: 'professional',
        audience: 'potential customers',
        monthlyLeadGoal: formData.monthlyLeadGoal,
        formType: formData.formType || 'more_volume',
        hasScreeningQuestions: formData.hasScreeningQuestions,
        screeningQuestionSuggestions: formData.screeningQuestionSuggestions,
        isHealthRelated: formData.isHealthRelated,
        additionalNotes: formData.additionalNotes,
        facebookPageData: facebookPageData ? {
          name: facebookPageData.name,
          website: facebookPageData.website,
          profile_picture: facebookPageData.profile_picture,
          categories: facebookPageData.categories
        } : undefined,
        responseTime: formData.responseTime
      }

      const response = await api.generateCompleteForm(briefData)

      // Apply generated content to form
      await applyAIGeneratedForm(response)

      setHasGeneratedQuestions(true)
    } catch (error) {
      console.error('AI Form Generation error:', error)
      if (error instanceof ApiError) {
        setAiGenerationError(`AI generation failed: ${error.message}`)
      } else {
        setAiGenerationError('AI service temporarily unavailable. Please try again later.')
      }
    } finally {
      setIsGeneratingCompleteForm(false)
    }
  }

  // Check if form is ready for AI generation
  const isReadyForAIGeneration = (): boolean => {
    return !!(formData.campaignObjective?.trim() &&
              formData.industry?.trim() &&
              formData.formType)
  }

  // Apply AI-generated form content to the form store
  const applyAIGeneratedForm = async (aiResponse: AIFormGenerationResponse) => {
    try {
      // Get current form from store
      const currentForm = useFormStore.getState().activeForm
      if (!currentForm) return

      // Convert AI questions to form qualifiers
      const aiQualifiers = aiResponse.questions.map((q, index: number) => ({
        id: `ai_generated_${Date.now()}_${index}`,
        question: q.question,
        type: q.type,
        options: q.options || [],
        required: q.required,
        order: index + 1,
        allowMultipleResponses: false,
        confirmationMessage: '',
        showConfirmationMessage: false
      }))

      // Convert AI contact fields to form contact fields
      const aiContactFields = aiResponse.contactInfo.recommendedFields
        .sort((a, b) => a.priority - b.priority)
        .map((field, index: number) => ({
          id: `ai_contact_${Date.now()}_${index}`,
          name: field.name,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder,
          autofill: field.autofill,
          order: index + 1
        }))

      // Update the form with AI-generated content
      const updatedForm = {
        ...currentForm,
        name: aiResponse.formName,
        intro: {
          headline: aiResponse.intro.headline,
          description: aiResponse.intro.description
        },
        qualifiers: aiQualifiers,
        contactDescription: aiResponse.contactInfo.description,
        contactFields: aiContactFields,
        thankYou: {
          headline: aiResponse.completion.headline,
          description: aiResponse.completion.description,
          action: {
            type: aiResponse.additionalAction.type,
            label: aiResponse.additionalAction.buttonText,
            websiteUrl: aiResponse.additionalAction.websiteUrl,
            phoneNumber: aiResponse.additionalAction.phoneNumber
          }
        }
      }

      // Update the form in the store
      updateForm(updatedForm)

    } catch (error) {
      console.error('Error applying AI-generated form:', error)
      throw new Error('Failed to apply AI-generated content to form')
    }
  }

  const handleSubmit = async () => {
    if (canSubmit) {
      // If AI generation is enabled and hasn't been done yet, generate first
      if (aiGenerationEnabled && !hasGeneratedQuestions && isReadyForAIGeneration()) {
        setIsGeneratingCompleteForm(true);
        try {
          await handleGenerateCompleteForm();
        } catch (error) {
          console.error('AI generation failed during submit:', error);
          // Continue with submission even if AI generation fails
        }
      }

      const brief: PreFormBrief = {
        id: Date.now().toString(),
        clientFacebookPage: formData.clientFacebookPage!,
        facebookPageData: formData.facebookPageData || facebookPageData,
        industry: formData.industry,
        campaignObjective: formData.campaignObjective!,
        creativeFile: formData.creativeFile ? {
          name: formData.creativeFile.name,
          size: formData.creativeFile.size,
          type: formData.creativeFile.type,
          // Could add base64 data here for full export capability
        } : null,
        monthlyLeadGoal: formData.monthlyLeadGoal!,
        formType: formData.formType!,
        hasAdminAccess: formData.hasAdminAccess!,
        leadEmailAddresses: formData.leadEmailAddresses || '',
        isHealthRelated: formData.isHealthRelated!,
        hasScreeningQuestions: formData.hasScreeningQuestions!,
        screeningQuestionSuggestions: formData.screeningQuestionSuggestions || '',
        responseTime: formData.responseTime!,
        hasPrivacyPolicy: formData.hasPrivacyPolicy!,
        privacyPolicyUrl: formData.privacyPolicyUrl || '',
        clientWebsiteUrl: clientWebsiteUrl || '',
        additionalNotes: formData.additionalNotes || '',
        isComplete: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      onComplete(brief);
      onNext();

      // Scroll to top when moving to Form Builder
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const responseTimeAlert = getResponseTimeAlert();

  return (
    <div className="flex-1 flex">
      {/* Form Section */}
      <div className="w-1/2 min-w-0 border-r border-surface-200 bg-white overflow-y-auto">
        {/* Breadcrumb Stepper - Full width within the left panel */}
        <div className="px-6 pt-6">
          <div className="max-w-[42rem] mx-auto">
            <BreadcrumbStepper
              steps={[
                { id: 'brief', label: 'Campaign Brief', status: 'active' },
                { id: 'builder', label: 'Form Builder', status: (formData.isComplete || import.meta.env.VITE_DEV_MODE === 'true') ? 'enabled' : 'locked' },
                { id: 'review', label: 'Review & Export', status: import.meta.env.VITE_DEV_MODE === 'true' ? 'enabled' : 'locked' }
              ]}
              onStepClick={(stepId) => {
                if (stepId === 'builder') {
                  // Allow navigation if complete OR in dev mode
                  if (formData.isComplete || import.meta.env.VITE_DEV_MODE === 'true') {
                    setCurrentView('builder');
                  }
                } else if (stepId === 'review' && import.meta.env.VITE_DEV_MODE === 'true') {
                  setCurrentView('review');
                }
              }}
            />
          </div>
        </div>

        <div className="p-6 space-y-6 max-w-[42rem] mx-auto">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-surface-900 mb-2">Campaign Brief</h1>
              <p className="text-sm text-surface-600">
                Provide campaign details to generate optimized lead form questions
              </p>
            </div>
          </div>

          {/* Basic Info Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Campaign Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Client Facebook Page URL *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.clientFacebookPage}
                    onChange={(e) => {
                      updateField('clientFacebookPage', e.target.value);
                      // Reset verification state when URL changes
                      setPageVerificationMessage(null);
                      setPageVerificationStatus(null);
                      setFacebookPageData(null);
                    }}
                    className="form-input w-full pr-28"
                    placeholder="https://facebook.com/businessname"
                    disabled={isVerifyingPage}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyFacebookPage}
                    disabled={!formData.clientFacebookPage?.trim() || isVerifyingPage}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      pageVerificationStatus === 'success'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-surface-100 text-surface-700 border border-surface-200 hover:bg-surface-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isVerifyingPage ? (
                      'Verifying...'
                    ) : pageVerificationStatus === 'success' ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1 inline" />
                        Verified
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3 h-3 mr-1 inline" />
                        Verify
                      </>
                    )}
                  </button>
                </div>
                {pageVerificationMessage && (
                  <Alert type={pageVerificationStatus || 'info'}>
                    {pageVerificationMessage}
                  </Alert>
                )}
                {facebookPageData && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={facebookPageData.profile_picture}
                        alt={facebookPageData.name}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = FacebookPageService.getFallbackProfilePicture(facebookPageData.name);
                        }}
                      />
                      <div>
                        <div className="font-semibold text-sm text-green-900">
                          {facebookPageData.name}
                          {facebookPageData.verified && <span className="ml-1 text-blue-500">✓</span>}
                        </div>
                        {facebookPageData.categories && facebookPageData.categories.length > 0 && (
                          <div className="text-xs text-green-700">
                            {facebookPageData.categories.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Industry/Vertical *
                </label>
                <select
                  value={formData.industry || ''}
                  onChange={(e) => updateField('industry', e.target.value)}
                  className="form-select w-full"
                  required
                >
                  <option value="">Select your industry</option>
                  <option value="Arts & Entertainment">Arts & Entertainment</option>
                  <option value="Attorneys & Legal Services">Attorneys & Legal Services</option>
                  <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                  <option value="Career & Employment">Career & Employment</option>
                  <option value="Dentists & Dental Services">Dentists & Dental Services</option>
                  <option value="Education & Instruction">Education & Instruction</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                  <option value="Home & Home Improvement">Home & Home Improvement</option>
                  <option value="Industrial & Commercial">Industrial & Commercial</option>
                  <option value="Personal Services">Personal Services</option>
                  <option value="Physicians & Surgeons">Physicians & Surgeons</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Restaurants & Food">Restaurants & Food</option>
                  <option value="Sports & Recreation">Sports & Recreation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Campaign Objective *
                </label>
                <textarea
                  value={formData.campaignObjective}
                  onChange={(e) => updateField('campaignObjective', e.target.value)}
                  className="form-textarea w-full"
                  rows={2}
                  placeholder="e.g., Generate qualified leads for home renovation services in the Seattle area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Upload Creative (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-surface-100 hover:bg-surface-200 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Choose File</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/*,video/*"
                      className="hidden"
                    />
                  </label>
                  {formData.creativeFile && (
                    <span className="text-sm text-surface-600">{formData.creativeFile.name}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Monthly Lead Goal *
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyLeadGoal}
                    onChange={(e) => updateField('monthlyLeadGoal', e.target.value)}
                    className="form-input w-full"
                    placeholder="500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Form Type *
                  </label>
                  <select
                    value={formData.formType || 'more_volume'}
                    onChange={(e) => updateField('formType', e.target.value)}
                    className="form-select w-full"
                    required
                  >
                    <option value="more_volume">More Volume</option>
                    <option value="higher_intent">Higher Intent</option>
                    <option value="rich_creative">Rich Creative</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Form Generation Toggle */}
          <AIGenerationToggle
            enabled={aiGenerationEnabled}
            onToggle={setAiGenerationEnabled}
            hasGenerated={hasGeneratedQuestions}
            generationError={aiGenerationError}
          />

          {/* Access & Permissions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Access & Permissions</h3>

            <div className="space-y-4">
              <div>
                <RadioGroup
                  name="hasAdminAccess"
                  value={formData.hasAdminAccess || ''}
                  onChange={(value) => updateField('hasAdminAccess', value)}
                  label="Facebook Page Admin Access Status *"
                  containerWidth="wide"
                  options={[
                    {
                      value: 'yes',
                      label: 'Full access confirmed',
                      description: 'Admin and Leads access granted'
                    },
                    {
                      value: 'pending',
                      label: 'Pending access',
                      description: 'Waiting for permissions'
                    },
                    {
                      value: 'no',
                      label: 'Limited access',
                      description: 'Missing required permissions'
                    }
                  ]}
                />

                {formData.hasAdminAccess === 'no' && (
                  <Alert type="error">
                    <strong>Access Required:</strong> Full Admin and Leads access to the Facebook page is needed. Lead delivery cannot be automated without proper permissions.
                  </Alert>
                )}

                {formData.hasAdminAccess === 'pending' && (
                  <Alert type="warning">
                    <strong>Pending Access:</strong> Please ensure full admin access is granted before campaign launch to enable automated lead delivery.
                  </Alert>
                )}
              </div>

              {(formData.hasAdminAccess === 'pending' || formData.hasAdminAccess === 'yes') && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${formData.isHealthRelated ? 'text-surface-400' : 'text-surface-700'}`}>
                    Lead Delivery Email Addresses *
                  </label>
                  <textarea
                    value={formData.leadEmailAddresses}
                    onChange={(e) => updateField('leadEmailAddresses', e.target.value)}
                    className={`form-textarea w-full min-h-20 ${formData.isHealthRelated ? 'bg-surface-100 text-surface-400 cursor-not-allowed' : ''}`}
                    placeholder="email1@company.com, email2@company.com"
                    disabled={formData.isHealthRelated}
                  />
                  {formData.isHealthRelated ? (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      HIPAA related - speak to buying team for proper lead delivery instructions
                    </p>
                  ) : (
                    <p className="text-xs text-surface-500 mt-1">Separate multiple emails with commas</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Compliance & HIPAA */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Compliance</h3>

            <CheckboxOption
              checked={formData.isHealthRelated || false}
              onChange={(checked) => updateField('isHealthRelated', checked)}
              label="Health-related or HIPAA compliance required"
              description="Check if this campaign involves healthcare services or patient data"
            />

            {formData.isHealthRelated && (
              <Alert type="error">
                <strong>HIPAA Compliance Notice:</strong> We cannot store or access leads for health-related campaigns. The client must pull leads themselves via the Leads Center in Meta Business Suite.
              </Alert>
            )}
          </Card>

          {/* Lead Qualification */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Lead Qualification</h3>

            <CheckboxOption
              checked={formData.hasScreeningQuestions || false}
              onChange={(checked) => updateField('hasScreeningQuestions', checked)}
              label="Include screening questions"
              description="Add qualifying questions to filter lead quality (Budget, Services, Timeline, etc.)"
            />

            {formData.hasScreeningQuestions && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Suggested Screening Questions
                </label>
                <textarea
                  value={formData.screeningQuestionSuggestions}
                  onChange={(e) => updateField('screeningQuestionSuggestions', e.target.value)}
                  className="form-textarea w-full min-h-24"
                  placeholder="Example: What's your budget range? What services are you interested in? When are you looking to start?"
                />
                <p className="text-xs text-surface-500 mt-1">
                  AI will use these suggestions to generate optimized questions
                </p>
              </div>
            )}
          </Card>

          {/* Response Time */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Response Time</h3>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Average Response Time to Leads *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.responseTime?.value}
                  onChange={(e) => updateField('responseTime', {
                    ...formData.responseTime,
                    value: e.target.value
                  })}
                  className="form-input w-3/5"
                  placeholder="5"
                  min="1"
                />
                <select
                  value={formData.responseTime?.unit}
                  onChange={(e) => updateField('responseTime', {
                    ...formData.responseTime,
                    unit: e.target.value as 'minutes' | 'hours'
                  })}
                  className="form-select w-2/5"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>

              {formData.responseTime?.value && (
                <Alert type={responseTimeAlert.type}>
                  {responseTimeAlert.message}
                </Alert>
              )}
            </div>
          </Card>

          {/* Privacy Policy */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Privacy Policy</h3>

            <RadioGroup
              name="hasPrivacyPolicy"
              value={formData.hasPrivacyPolicy || ''}
              onChange={(value) => {
                updateField('hasPrivacyPolicy', value);
                setPrivacyFoundViaApi(false);
              }}
              containerWidth="full"
              options={[
                {
                  value: 'yes',
                  label: 'Published and accessible'
                },
                {
                  value: 'not_sure',
                  label: 'Need to verify'
                },
                {
                  value: 'no',
                  label: 'Not published'
                }
              ]}
            />

            {formData.hasPrivacyPolicy === 'yes' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Privacy Policy URL *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.privacyPolicyUrl}
                    onChange={(e) => {
                      updateField('privacyPolicyUrl', e.target.value);
                      setPrivacyFoundViaApi(false);
                    }}
                    className={`form-input w-full ${formData.privacyPolicyUrl ? 'pr-20' : ''}`}
                    placeholder="https://website.com/privacy-policy"
                  />
                  {formData.privacyPolicyUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(formData.privacyPolicyUrl, '_blank')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium rounded transition-colors bg-success-100 text-success-700 border border-success-200 hover:bg-success-200"
                      title="Open privacy policy in new tab"
                    >
                      Open
                    </button>
                  )}
                </div>
                {privacyFoundViaApi && formData.privacyPolicyUrl && (
                  <Alert type="success" className="mt-3">
                    <strong>Privacy policy found!</strong> We've automatically detected and populated your privacy policy URL. You can review it by clicking the "Open" button.
                  </Alert>
                )}
              </div>
            )}

            {formData.hasPrivacyPolicy === 'not_sure' && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Client Website URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={clientWebsiteUrl}
                      onChange={(e) => {
                        setClientWebsiteUrl(e.target.value);
                        setPrivacyCheckMessage(null); // Clear previous messages when URL changes
                      }}
                      className="form-input w-full pr-28"
                      placeholder="https://clientwebsite.com"
                      disabled={isCheckingPrivacy}
                    />
                    <button
                      type="button"
                      onClick={handleCheckPrivacyPolicy}
                      disabled={!clientWebsiteUrl.trim() || isCheckingPrivacy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium rounded transition-colors bg-surface-100 text-surface-700 border border-surface-200 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCheckingPrivacy ? 'Checking...' : 'Check Site'}
                    </button>
                  </div>
                  {!clientWebsiteUrl.trim() ? (
                    <p className="text-xs text-surface-500 mt-1">
                      Enter the client's website URL to automatically check for privacy policy
                    </p>
                  ) : clientWebsiteUrl.trim() && !DomainSanitizer.sanitizeDomain(clientWebsiteUrl.trim()).isValid ? (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ URL format may be invalid. Click "Check Site" to validate and sanitize.
                    </p>
                  ) : null}
                </div>

                {/* Show check results */}
                {privacyCheckMessage && (
                  <Alert type={privacyCheckType === 'success' ? 'success' : 'warning'}>
                    <strong>{privacyCheckType === 'success' ? 'Found!' : 'Not Found:'}</strong> {privacyCheckMessage}
                  </Alert>
                )}

                {/* Default info message when no check has been performed */}
                {!privacyCheckMessage && !isCheckingPrivacy && (
                  <Alert type="info">
                    <strong>Verification Process:</strong> Enter the client's website URL above and click "Check Site". We'll scan for privacy policies automatically. If not found, you'll need to confirm with the client before campaign launch.
                  </Alert>
                )}
              </div>
            )}

            {formData.hasPrivacyPolicy === 'no' && (
              <Alert type="error">
                <strong>Privacy Policy Required:</strong> A published privacy policy is mandatory for Meta lead campaigns. The campaign cannot run without one.
              </Alert>
            )}
          </Card>

          {/* Additional Notes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Additional Notes</h3>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => updateField('additionalNotes', e.target.value)}
              className="form-textarea w-full min-h-24"
              placeholder="Any additional context, requirements, or notes..."
            />

            {/* Additional Form Settings - Collapsed Section */}
            <div className="mt-6 border-t border-surface-200 pt-4">
              <button
                onClick={() => setIsAdditionalSettingsExpanded(!isAdditionalSettingsExpanded)}
                className="flex items-center justify-between w-full text-left p-0 bg-transparent border-0 cursor-pointer hover:text-primary transition-colors"
              >
                <h4 className="meta-section-title">Additional Form Settings</h4>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isAdditionalSettingsExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isAdditionalSettingsExpanded && (
                <div className="mt-4 space-y-6">
                  {/* Language Setting */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="meta-label">Language</label>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-surface-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          This is the language the audience will see when they view the form
                        </div>
                      </div>
                    </div>
                    <select
                      value={formData.language || 'English'}
                      onChange={(e) => updateField('language', e.target.value)}
                      className="meta-input w-48"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>

                  {/* Sharing Setting */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="meta-label">Sharing</label>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-surface-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-surface-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-80">
                          By default, only people who are delivered your ad directly will be able to see and submit this form. Select "Open" to let people share this form with friends and allow submissions from people tagged in the comments.
                        </div>
                      </div>
                    </div>
                    <RadioGroup
                      name="sharing"
                      value={formData.sharing || 'Restricted'}
                      onChange={(value) => updateField('sharing', value)}
                      containerWidth="full"
                      options={[
                        {
                          value: 'Restricted',
                          label: 'Restricted',
                          description: 'Only people who are delivered the ad directly can submit this form.'
                        },
                        {
                          value: 'Open',
                          label: 'Open',
                          description: 'Ad can be shared and anyone can submit this form.'
                        }
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>


          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white border-t border-surface-200 px-6 py-4 -mx-6">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isGeneratingCompleteForm}
              size="lg"
              className="w-full flex items-center justify-center gap-2"
            >
              {isGeneratingCompleteForm ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating AI Content...
                </>
              ) : (
                <>
                  Complete Brief & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="w-1/2 min-w-0 bg-surface-50 sticky top-0 h-screen overflow-y-auto">
        <FormPreview />
      </div>
    </div>
  );
};