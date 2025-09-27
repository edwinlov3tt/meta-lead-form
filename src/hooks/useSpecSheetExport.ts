import { useState, useCallback } from 'react';
import { ZipExportService } from '@/services/zipExportService';
import { useFormStore } from '@/stores/formStore';
import type { ExportProgress, ExportResult, ExportOptions, ExportError } from '@/types/export';

interface UseSpecSheetExportResult {
  isExporting: boolean;
  progress: ExportProgress | null;
  error: ExportError | null;
  exportSpecSheet: (options?: ExportOptions, includeCreative?: boolean) => Promise<ExportResult>;
  clearError: () => void;
  validateExportData: () => string[];
}

export const useSpecSheetExport = (): UseSpecSheetExportResult => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<ExportError | null>(null);

  const { activeForm, preFormBrief } = useFormStore();
  const zipService = new ZipExportService();

  const updateProgress = useCallback((stage: ExportProgress['stage'], progressValue: number, message: string) => {
    setProgress({
      stage,
      progress: progressValue,
      message
    });
  }, []);

  const exportSpecSheet = useCallback(async (
    options: ExportOptions = {
      includeJson: true,
      timestamp: true
    },
    includeCreative = false
  ): Promise<ExportResult> => {
    if (!activeForm) {
      const error: ExportError = {
        code: 'DATA_MAPPING_ERROR',
        message: 'No active form data available for export'
      };
      setError(error);
      return { success: false, error };
    }

    try {
      setIsExporting(true);
      setError(null);

      // Stage 1: Initializing
      updateProgress('initializing', 10, 'Initializing export process...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UX

      // Stage 2: Processing data
      updateProgress('processing_data', 25, 'Processing form data...');

      // Validate export data
      const warnings = zipService.validateExportData(activeForm, preFormBrief);
      if (warnings.length > 0) {
        console.warn('Export validation warnings:', warnings);
      }

      // Stage 3: Generating Excel
      updateProgress('generating_excel', 50, 'Generating Excel spec sheet...');
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for UX

      // Stage 4: Creating ZIP
      updateProgress('creating_zip', 75, 'Creating download package...');

      const result = await zipService.createAndDownloadZip(activeForm, preFormBrief, options, includeCreative);

      if (result.success) {
        // Stage 5: Complete
        updateProgress('complete', 100, 'Export completed successfully!');

        // Clear progress after a delay
        setTimeout(() => {
          setProgress(null);
        }, 2000);
      } else {
        setError(result.error || {
          code: 'DOWNLOAD_ERROR',
          message: 'Unknown export error occurred'
        });
      }

      return result;

    } catch (err) {
      console.error('Export error:', err);

      const exportError: ExportError = {
        code: 'DOWNLOAD_ERROR',
        message: 'Failed to export spec sheet',
        details: err instanceof Error ? err.message : 'Unknown error'
      };

      setError(exportError);
      return { success: false, error: exportError };

    } finally {
      setIsExporting(false);
    }
  }, [activeForm, preFormBrief, updateProgress, zipService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const validateExportData = useCallback((): string[] => {
    if (!activeForm) {
      return ['No active form data available'];
    }

    return zipService.validateExportData(activeForm, preFormBrief);
  }, [activeForm, preFormBrief, zipService]);

  return {
    isExporting,
    progress,
    error,
    exportSpecSheet,
    clearError,
    validateExportData
  };
};