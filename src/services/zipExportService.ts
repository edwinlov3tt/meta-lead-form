import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ExcelExportService } from './excelExportService';
import type { MetaLeadForm, PreFormBrief } from '@/types/form';
import type { ExportOptions, ExportResult, ExportError } from '@/types/export';

export class ZipExportService {
  private excelService: ExcelExportService;

  constructor() {
    this.excelService = new ExcelExportService();
  }

  /**
   * Generate campaign JSON data
   */
  private generateCampaignJson(form: MetaLeadForm, brief: PreFormBrief | null): string {
    const campaign = {
      id: this.generateId(),
      name: form.name || 'Untitled Campaign',
      version: '1.0.0',
      brief: brief ? {
        ...brief,
        createdAt: brief.createdAt instanceof Date ? brief.createdAt.toISOString() : brief.createdAt,
        updatedAt: brief.updatedAt instanceof Date ? brief.updatedAt.toISOString() : brief.updatedAt,
      } : null,
      form: {
        ...form,
        createdAt: form.createdAt instanceof Date ? form.createdAt.toISOString() : form.createdAt,
        updatedAt: form.updatedAt instanceof Date ? form.updatedAt.toISOString() : form.updatedAt,
      },
      exportedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return JSON.stringify(campaign, null, 2);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate sanitized filename
   */
  private generateFilename(baseName: string, extension: string, includeTimestamp = true): string {
    const sanitizedName = baseName.replace(/[^a-z0-9]/gi, '_');
    const timestamp = includeTimestamp ? `_${Date.now()}` : '';
    return `${sanitizedName}${timestamp}.${extension}`;
  }

  /**
   * Create and download ZIP package
   */
  async createAndDownloadZip(
    form: MetaLeadForm,
    brief: PreFormBrief | null,
    options: ExportOptions = { includeJson: true, timestamp: true },
    includeCreative = false
  ): Promise<ExportResult> {
    try {
      // Initialize ZIP
      const zip = new JSZip();

      // Generate Excel file
      const excelBuffer = await this.excelService.generateExcel(form, brief);
      const excelFilename = this.excelService.generateFilename(form.name || 'Form', options.timestamp);

      // Add Excel file to ZIP
      zip.file(excelFilename, excelBuffer);

      // Add JSON file if requested
      if (options.includeJson) {
        const campaignJson = this.generateCampaignJson(form, brief);
        const jsonFilename = this.generateFilename(
          `Campaign_Data_${form.name || 'Form'}`,
          'json',
          options.timestamp
        );
        zip.file(jsonFilename, campaignJson);
      }

      // Add creative file if available and requested
      if (includeCreative && brief?.creativeFile) {
        const creativeExt = this.getFileExtension(brief.creativeFile.name);
        const creativeFilename = this.generateFilename(
          `Creative_${form.name || 'Form'}`,
          creativeExt,
          false // Don't add timestamp to creative files
        );

        if (brief.creativeFile.data) {
          // If creative file has base64 data, convert it back to binary
          const creativeData = this.base64ToArrayBuffer(brief.creativeFile.data);
          zip.file(creativeFilename, creativeData);
        }
      }

      // Add README file
      const readmeContent = this.generateReadmeContent(form, brief, includeCreative);
      zip.file('README.txt', readmeContent);

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });

      // Generate ZIP filename
      const zipFilename = options.filename ||
        this.generateFilename(`Meta_Lead_Spec_Package_${form.name || 'Form'}`, 'zip', options.timestamp);

      // Download ZIP file
      saveAs(zipBlob, zipFilename);

      return {
        success: true,
        filename: zipFilename
      };

    } catch (error) {
      console.error('ZIP export failed:', error);

      let exportError: ExportError;

      if (error instanceof Error && error.message.includes('Excel')) {
        exportError = {
          code: 'EXCEL_GENERATION_ERROR',
          message: 'Failed to generate Excel file',
          details: error.message
        };
      } else if (error instanceof Error && error.message.includes('ZIP')) {
        exportError = {
          code: 'ZIP_CREATION_ERROR',
          message: 'Failed to create ZIP package',
          details: error.message
        };
      } else {
        exportError = {
          code: 'DOWNLOAD_ERROR',
          message: 'Failed to download export package',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      return {
        success: false,
        error: exportError
      };
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64.split(',')[1] || base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate README content for the ZIP package
   */
  private generateReadmeContent(form: MetaLeadForm, brief: PreFormBrief | null, includeCreative = false): string {
    const timestamp = new Date().toISOString();
    const formName = form.name || 'Untitled Form';

    return `Meta Lead Form Spec Sheet Export Package
========================================

Export Date: ${timestamp}
Form Name: ${formName}
Form Type: ${form.formType}

Contents:
---------
1. Meta_Lead_Spec_Sheet_*.xlsx - Populated spec sheet for buying team review
2. Campaign_Data_*.json - Complete form configuration for re-import${includeCreative && brief?.creativeFile ? '\n3. Creative_* - Uploaded creative file for campaign' : ''}
${includeCreative && brief?.creativeFile ? '4' : '3'}. README.txt - This file

Instructions:
-------------
Excel File (.xlsx):
- Share this file with your buying team for review and approval
- Contains all form specifications in the required template format
- Can be opened in Microsoft Excel, Google Sheets, or similar applications

JSON File (.json):
- Use this file to re-import your form configuration back into the builder
- Contains complete campaign data including brief and form settings
- Import via the "Import" button in the application header

Notes:
------
- Keep both files together for complete workflow management
- The JSON file ensures you can continue editing after review
- Excel file maintains all original template formatting and structure

Export Settings:
----------------
Form Fields: ${form.contactFields.length} contact fields
Screening Questions: ${form.qualifiers.length} questions
Privacy Policy: ${form.privacy.businessPrivacyUrl ? 'Configured' : 'Not configured'}
Thank You Action: ${form.thankYou.action.type}

Generated by Meta Lead Form Builder
For questions or support, please contact your development team.`;
  }

  /**
   * Validate export data before processing
   */
  validateExportData(form: MetaLeadForm, brief: PreFormBrief | null): string[] {
    const warnings: string[] = [];

    // Check required form fields
    if (!form.name || form.name.trim() === '' || form.name === 'Untitled Form') {
      warnings.push('Form name is not set - using default name');
    }

    if (!form.intro.headline || form.intro.headline.trim() === '') {
      warnings.push('Form headline is empty');
    }

    if (!form.thankYou.headline || form.thankYou.headline.trim() === '') {
      warnings.push('Thank you page headline is empty');
    }

    if (!form.privacy.businessPrivacyUrl || form.privacy.businessPrivacyUrl.trim() === '') {
      warnings.push('Privacy policy URL is not configured');
    }

    // Check brief data
    if (!brief) {
      warnings.push('Campaign brief data is missing - some fields will be empty');
    } else {
      if (!brief.monthlyLeadGoal || brief.monthlyLeadGoal.trim() === '') {
        warnings.push('Monthly lead goal is not specified');
      }

      if (!brief.leadEmailAddresses || brief.leadEmailAddresses.trim() === '') {
        warnings.push('Lead delivery email addresses are not configured');
      }
    }

    // Check contact fields
    const requiredFields = form.contactFields.filter(field => field.required);
    if (requiredFields.length < 2) {
      warnings.push('Less than 2 required contact fields - consider adding more');
    }

    return warnings;
  }
}