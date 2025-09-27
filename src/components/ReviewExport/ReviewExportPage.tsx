import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  FileSpreadsheet,
  FileText,
  Package,
  Download,
  Image,
  Users,
  MessageCircle,
  Shield,
  Heart,
  Zap
} from 'lucide-react';
import { useFormStore } from '@/stores/formStore';
import { useSpecSheetExport } from '@/hooks/useSpecSheetExport';
import { ZipExportService } from '@/services/zipExportService';
import { Button } from '@/components/UI/Button';
import { BreadcrumbStepper, type Step } from '@/components/UI/BreadcrumbStepper';
import { ExportProgressModal } from '@/components/Export/ExportProgressModal';

interface ReviewExportPageProps {
  onBack: () => void;
}

export const ReviewExportPage: React.FC<ReviewExportPageProps> = ({ onBack }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const { activeForm, preFormBrief, exportCampaign, setCurrentView } = useFormStore();
  const {
    isExporting,
    progress,
    error,
    exportSpecSheet,
    clearError,
    validateExportData
  } = useSpecSheetExport();

  const zipService = new ZipExportService();

  // Get window size for confetti
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);

    // Trigger celebration on page load
    setTimeout(() => {
      setShowConfetti(true);
      triggerCelebration();
    }, 500);

    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  const triggerCelebration = () => {
    // Canvas confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1877f2', '#42d392', '#ffd93d', '#ff6b6b']
    });

    // Additional burst after delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#1877f2', '#42d392']
      });
    }, 300);

    // Hide react-confetti after animation
    setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
  };

  const handleExportSpecSheet = async () => {
    await exportSpecSheet({
      includeJson: true,
      timestamp: true
    });
  };

  const handleExportJson = () => {
    const campaignJson = exportCampaign();
    if (!campaignJson) return;

    const blob = new Blob([campaignJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeForm?.name || 'campaign'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCreativeOnly = async () => {
    if (!preFormBrief?.creativeFile) return;

    const filename = preFormBrief.creativeFile.name || 'creative-file';

    if (preFormBrief.creativeFile.data) {
      // Convert base64 back to blob and download
      const base64Data = preFormBrief.creativeFile.data.split(',')[1] || preFormBrief.creativeFile.data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: preFormBrief.creativeFile.type });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportComplete = async () => {
    if (!activeForm) return;

    try {
      await zipService.createAndDownloadZip(
        activeForm,
        preFormBrief,
        {
          includeJson: true,
          timestamp: true,
          filename: `Complete_Meta_Campaign_${activeForm.name || 'Package'}_${Date.now()}.zip`
        },
        true // Include creative file
      );

      // Trigger another celebration for complete export
      setTimeout(() => {
        triggerCelebration();
      }, 1000);

    } catch (error) {
      console.error('Complete export failed:', error);
    }
  };

  const handleCloseModal = () => {
    clearError();
  };

  const handleRetryExport = () => {
    clearError();
    handleExportSpecSheet();
  };

  const handleStepClick = (stepId: string) => {
    if (stepId === 'brief') {
      setCurrentView('brief');
    } else if (stepId === 'builder') {
      setCurrentView('builder');
    }
  };

  const steps: Step[] = [
    {
      id: 'brief',
      label: 'Campaign Brief',
      status: preFormBrief?.isComplete ? 'done' : 'enabled'
    },
    {
      id: 'builder',
      label: 'Form Builder',
      status: 'done'
    },
    {
      id: 'review',
      label: 'Review & Export',
      status: 'active'
    }
  ];

  if (!activeForm) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No form data available for review.</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const formStats = {
    contactFields: activeForm.contactFields.length,
    screeningQuestions: activeForm.qualifiers.length,
    hasPrivacyPolicy: !!activeForm.privacy.businessPrivacyUrl,
    hasCreative: !!preFormBrief?.creativeFile
  };

  const warnings = validateExportData();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#1877f2', '#42d392', '#ffd93d', '#ff6b6b']}
        />
      )}

      {/* Breadcrumb Navigation */}
      <div className="mb-8">
        <BreadcrumbStepper
          steps={steps}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 Campaign Complete!
        </h1>
        <p className="text-lg text-gray-600">
          Your Meta Lead Form campaign is ready for review and export.
        </p>
      </div>

      {/* Campaign Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Form Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <span className="font-medium w-24">Name:</span>
                <span>{activeForm.name}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="font-medium w-24">Type:</span>
                <span className="capitalize">{activeForm.formType.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="font-medium w-24">Headline:</span>
                <span className="truncate">{activeForm.intro.headline}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Campaign Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-blue-500 mr-2" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">{formStats.contactFields}</div>
                  <div className="text-xs text-gray-500">Contact Fields</div>
                </div>
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 text-purple-500 mr-2" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">{formStats.screeningQuestions}</div>
                  <div className="text-xs text-gray-500">Screening Q's</div>
                </div>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 text-green-500 mr-2" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formStats.hasPrivacyPolicy ? '✓' : '✗'}
                  </div>
                  <div className="text-xs text-gray-500">Privacy Policy</div>
                </div>
              </div>
              <div className="flex items-center">
                <Image className="w-4 h-4 text-orange-500 mr-2" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formStats.hasCreative ? '✓' : '✗'}
                  </div>
                  <div className="text-xs text-gray-500">Creative File</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Review Recommended</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Export Options</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Spec Sheet Export */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
            <div className="flex items-center mb-3">
              <FileSpreadsheet className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="font-medium text-gray-900">Spec Sheet</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Excel template for buying team review + JSON backup
            </p>
            <Button
              onClick={handleExportSpecSheet}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel + JSON
            </Button>
          </div>

          {/* JSON Only */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center mb-3">
              <FileText className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="font-medium text-gray-900">Campaign Data</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              JSON file with complete form configuration for backup
            </p>
            <Button
              onClick={handleExportJson}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export JSON Only
            </Button>
          </div>

          {/* Creative File */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
            <div className="flex items-center mb-3">
              <Image className="w-6 h-6 text-orange-600 mr-3" />
              <h3 className="font-medium text-gray-900">Creative File</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {formStats.hasCreative
                ? 'Download your uploaded creative asset'
                : 'No creative file uploaded'
              }
            </p>
            <Button
              onClick={handleExportCreativeOnly}
              disabled={isExporting || !formStats.hasCreative}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {formStats.hasCreative ? 'Download Creative' : 'No Creative'}
            </Button>
          </div>
        </div>

        {/* Complete Package Export */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Complete Package</h3>
                <p className="text-sm text-gray-600">
                  Everything in one ZIP: Excel spec sheet, JSON backup
                  {formStats.hasCreative && ', creative file'}, and instructions
                </p>
              </div>
            </div>
            <Button
              onClick={handleExportComplete}
              disabled={isExporting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              <Package className="w-5 h-5 mr-2" />
              <Zap className="w-4 h-4 mr-1" />
              Export Complete Package
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          disabled={isExporting}
        >
          ← Back to Edit
        </Button>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Heart className="w-4 h-4 text-red-500" />
          <span>Ready to launch your Meta campaign!</span>
        </div>
      </div>

      {/* Export Progress Modal */}
      <ExportProgressModal
        isOpen={isExporting || !!progress || !!error}
        progress={progress}
        error={error}
        onClose={handleCloseModal}
        onRetry={handleRetryExport}
      />
    </div>
  );
};