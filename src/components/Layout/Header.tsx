import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Settings,
  Facebook,
  ChevronDown,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useFormStore } from '@/stores/formStore';
import { useSpecSheetExport } from '@/hooks/useSpecSheetExport';
import { Button } from '@/components/UI/Button';
import { ExportProgressModal } from '@/components/Export/ExportProgressModal';

export const Header: React.FC = () => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    activeForm,
    isDirty,
    resetForm,
    exportCampaign,
    importCampaign,
    setCurrentView
  } = useFormStore();

  const {
    isExporting,
    progress,
    error,
    exportSpecSheet,
    clearError,
    validateExportData
  } = useSpecSheetExport();


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
    setShowExportDropdown(false);
  };

  const handleExportSpecSheet = async () => {
    setShowExportDropdown(false);

    // Validate export data and show warnings if any
    const warnings = validateExportData();
    if (warnings.length > 0) {
      const proceed = window.confirm(
        `Export validation warnings:\n${warnings.join('\n')}\n\nDo you want to continue with the export?`
      );
      if (!proceed) return;
    }

    await exportSpecSheet({
      includeJson: true,
      timestamp: true
    });
  };

  const handleCloseExportModal = () => {
    clearError();
  };

  const handleRetryExport = () => {
    clearError();
    handleExportSpecSheet();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            importCampaign(content);
            // Auto-detect view based on imported data structure
            const data = JSON.parse(content);
            if (data.brief && data.form) {
              // Unified campaign - default to brief view
              setCurrentView('brief');
            } else if (data.clientFacebookPage) {
              // Legacy brief format
              setCurrentView('brief');
            } else {
              // Legacy form format
              setCurrentView('builder');
            }
          } catch (error) {
            alert('Invalid JSON file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };


  return (
    <header className="bg-white border-b border-surface-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-meta-blue rounded-lg flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-surface-900">
                Meta Lead Form Builder
              </h1>
              <p className="text-sm text-surface-600">
                {activeForm?.name || 'Untitled Form'}
                {isDirty && <span className="text-yellow-600 ml-2">• Unsaved changes</span>}
              </p>
            </div>
          </div>
        </div>


        <div className="flex items-center space-x-4">
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleImport}
              variant="ghost"
              size="sm"
              title="Import JSON"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import</span>
            </Button>

            {/* Export Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                variant="outline"
                size="sm"
                title="Export Options"
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>

              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    <button
                      onClick={handleExportSpecSheet}
                      disabled={isExporting}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-3 text-green-600" />
                      <div>
                        <div className="font-medium">Export Spec Sheet</div>
                        <div className="text-xs text-gray-500">Excel + JSON package</div>
                      </div>
                    </button>
                    <button
                      onClick={handleExportJson}
                      disabled={isExporting}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-3 text-blue-600" />
                      <div>
                        <div className="font-medium">Export JSON</div>
                        <div className="text-xs text-gray-500">Campaign data only</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={resetForm}
              variant="ghost"
              size="sm"
              title="Reset Form"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Reset</span>
            </Button>


            <Button
              variant="ghost"
              size="icon"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Export Progress Modal */}
      <ExportProgressModal
        isOpen={isExporting || !!progress || !!error}
        progress={progress}
        error={error}
        onClose={handleCloseExportModal}
        onRetry={handleRetryExport}
      />
    </header>
  );
};