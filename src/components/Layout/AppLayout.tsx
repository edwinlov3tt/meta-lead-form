import React from 'react';
import { Header } from './Header';
import { FormBuilder } from '../FormBuilder/FormBuilder';
import { FormPreview } from '../Preview/FormPreview';
import { PreFormBriefV2 } from '../FormBuilder/PreFormBriefV2';
import { ReviewExportPage } from '../ReviewExport/ReviewExportPage';
import { ResizablePanels } from '../UI/ResizablePanels';
import { AutoSave } from '../FormBuilder/AutoSave';
import { useFormStore } from '@/stores/formStore';
import { PreFormBrief } from '@/types/form';

export const AppLayout: React.FC = () => {
  const { activeForm, currentView, preFormBrief, setPreFormBrief, setCurrentView, syncBriefToForm } = useFormStore();

  if (!activeForm) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-surface-900 mb-2">Loading...</h2>
          <p className="text-surface-600">Initializing form builder</p>
        </div>
      </div>
    );
  }

  const handleBriefComplete = (brief: PreFormBrief) => {
    setPreFormBrief(brief);
    // Sync brief data to form
    syncBriefToForm();
  };

  const handleBriefNext = () => {
    // Ensure data is synced before switching views
    syncBriefToForm();
    setCurrentView('builder');
  };

  const handleBackFromReview = () => {
    setCurrentView('builder');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Header />

      {currentView === 'brief' ? (
        // Campaign Brief View - Split view with preview
        <PreFormBriefV2
          onComplete={handleBriefComplete}
          onNext={handleBriefNext}
          initialData={preFormBrief || undefined}
        />
      ) : currentView === 'review' ? (
        // Review & Export View
        <div className="flex-1 p-6">
          <ReviewExportPage onBack={handleBackFromReview} />
        </div>
      ) : (
        // Form Builder View with Resizable Panels
        <div className="flex-1">
          <ResizablePanels
            leftPanel={<FormBuilder />}
            rightPanel={<FormPreview />}
            initialLeftWidth={50}
            minLeftWidth={35}
            maxLeftWidth={80}
          />
        </div>
      )}

      <AutoSave />
    </div>
  );
};