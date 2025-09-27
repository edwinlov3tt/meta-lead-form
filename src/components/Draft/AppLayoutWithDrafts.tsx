import React from 'react';
import { Header } from '../Layout/Header';
import { FormBuilder } from '../FormBuilder/FormBuilder';
import { FormPreview } from '../Preview/FormPreview';
import { PreFormBriefV2 } from '../FormBuilder/PreFormBriefV2';
import { ResizablePanels } from '../UI/ResizablePanels';
import { AutoSave } from '../FormBuilder/AutoSave';
import { DraftProvider } from './DraftProvider';
import { useDraftEnabledFormStore } from '@/stores/draftEnabledFormStore';

/**
 * Example integration of draft system with existing AppLayout
 * This shows how to replace the existing formStore with the draft-enabled version
 */

export const AppLayoutWithDrafts: React.FC = () => {
  const {
    activeForm,
    currentView,
    preFormBrief,
    setPreFormBrief,
    setCurrentView
  } = useDraftEnabledFormStore();

  // Generate pageKey from user/session data
  // In a real app, this would come from authentication or URL params
  const pageKey = 'demo-user'; // Could be Facebook page ID or user identifier
  const formSlug = activeForm?.id || 'new-form';
  const formId = activeForm?.id; // Server-side form ID if it exists
  const serverUpdatedAt = activeForm?.updatedAt?.toISOString();

  if (!preFormBrief) {
    return (
      <DraftProvider
        pageKey={pageKey}
        formSlug={formSlug}
        formId={formId}
        serverUpdatedAt={serverUpdatedAt}
      >
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="pt-16">
            <PreFormBriefV2 onComplete={(brief) => {
              setPreFormBrief(brief);
              setCurrentView('builder');
            }} />
          </div>
        </div>
      </DraftProvider>
    );
  }

  const handleBriefComplete = (brief: any) => {
    setPreFormBrief(brief);
    setCurrentView('builder');
  };

  return (
    <DraftProvider
      pageKey={pageKey}
      formSlug={formSlug}
      formId={formId}
      serverUpdatedAt={serverUpdatedAt}
      showStatusIndicator={true}
      statusIndicatorClassName="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-200"
    >
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="pt-16 h-screen">
          {currentView === 'brief' && (
            <PreFormBriefV2 onComplete={handleBriefComplete} />
          )}

          {(currentView === 'builder' || currentView === 'preview') && (
            <ResizablePanels
              leftPanel={
                <div className="h-full overflow-hidden">
                  <FormBuilder />
                </div>
              }
              rightPanel={
                <div className="h-full overflow-hidden">
                  <FormPreview />
                </div>
              }
              leftDefaultSize={50}
              rightDefaultSize={50}
            />
          )}
        </div>

        {/* Keep existing AutoSave component for server-side saves */}
        <AutoSave />
      </div>
    </DraftProvider>
  );
};