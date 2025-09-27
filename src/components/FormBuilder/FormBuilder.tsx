import React, { useState, useEffect } from 'react';
import { ArrowRight, Package, CheckCircle } from 'lucide-react';
import { FormBasics } from './FormBasics';
import { IntroSection } from './IntroSection';
import { QuestionsSection } from './QuestionsSection';
import { ContactInfoSection } from './ContactInfoSection';
import { PrivacySection } from './PrivacySection';
import { ThankYouSection } from './ThankYouSection';
import { ValidationFeedback } from './ValidationFeedback';
import { Card, CardContent } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { BreadcrumbStepper, type Step } from '@/components/UI/BreadcrumbStepper';
import { ConflictResolutionModal } from '@/components/UI/ConflictResolutionModal';
import { useFormStore } from '@/stores/formStore';
import { useSmartAutosave } from '@/hooks/useSmartAutosave';

export const FormBuilder: React.FC = () => {
  const [showValidation, setShowValidation] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const { preFormBrief, setCurrentView, activeForm } = useFormStore();

  // Initialize autosave functionality
  const {
    status: autosaveStatus,
    checkForConflicts,
    resolveConflict
  } = useSmartAutosave({
    enabled: true,
    debounceMs: 3000, // Save after 3 seconds of inactivity
    showNotifications: false
  });

  // Check for conflicts on component mount
  useEffect(() => {
    const initConflictCheck = async () => {
      try {
        const conflict = await checkForConflicts();
        if (conflict.hasConflict && conflict.latestEntry) {
          setConflictData({
            current: {
              form: activeForm,
              brief: preFormBrief,
              timestamp: new Date()
            },
            autosaved: {
              form: conflict.latestEntry.data.form,
              brief: conflict.latestEntry.data.brief,
              timestamp: new Date(conflict.latestEntry.timestamp)
            }
          });
          setShowConflictModal(true);
        }
      } catch (error) {
        console.error('Failed to check for conflicts on mount:', error);
      }
    };

    initConflictCheck();
  }, []); // Only run on mount

  const handleSave = () => {
    setShowValidation(true);
    // Scroll to top to show validation feedback
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReviewExport = () => {
    setCurrentView('review');
  };

  const handleConflictResolve = async (strategy: 'local' | 'remote') => {
    try {
      await resolveConflict(strategy);
      setShowConflictModal(false);
      setConflictData(null);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  const handleStepClick = (stepId: string) => {
    if (stepId === 'brief') {
      setCurrentView('brief');
    } else if (stepId === 'review') {
      setCurrentView('review');
    }
  };

  const steps: Step[] = [
    {
      id: 'brief',
      label: 'Campaign Brief',
      status: preFormBrief?.isComplete ? 'done' : (isDevMode ? 'enabled' : 'enabled')
    },
    {
      id: 'builder',
      label: 'Form Builder',
      status: 'active'
    },
    {
      id: 'review',
      label: 'Review & Export',
      status: isDevMode ? 'enabled' : 'locked' // Enable in dev mode for testing
    }
  ];

  return (
    <div className="h-full bg-white">
      {/* Breadcrumb Stepper - Full width outside of the content container */}
      <div className="px-6 pt-6">
        <div className="max-w-[42rem] mx-auto">
          <BreadcrumbStepper
            steps={steps}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[42rem] mx-auto">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-surface-900 mb-2">Form Builder</h1>
            <p className="text-sm text-surface-600">
              Customize your lead form fields, questions, and privacy settings
            </p>
          </div>
        </div>

        {showValidation && <ValidationFeedback />}

        <Card>
          <CardContent className="pt-6">
            <FormBasics />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <IntroSection />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <QuestionsSection />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <ContactInfoSection />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <PrivacySection />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <ThankYouSection />
          </CardContent>
        </Card>

        {/* Action Buttons - Full Width with Divider */}
        <div className="border-t border-surface-200 pt-6 pb-8 -mx-6 px-6 space-y-3">
          <Button
            onClick={handleSave}
            size="lg"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Save Form & Validate
          </Button>

          <Button
            onClick={handleReviewExport}
            size="lg"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Package className="w-4 h-4" />
            Review & Export Campaign
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-xs text-center text-gray-500 mt-2">
            🎉 Ready to complete your Meta Lead Form campaign!
          </p>
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      {showConflictModal && conflictData && (
        <ConflictResolutionModal
          isOpen={showConflictModal}
          onClose={() => setShowConflictModal(false)}
          conflictData={conflictData}
          onResolve={handleConflictResolve}
        />
      )}
    </div>
  );
};