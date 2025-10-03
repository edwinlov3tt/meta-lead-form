import ExcelJS from 'exceljs';
import type { MetaLeadForm, PreFormBrief } from '@/types/form';
import {
  BRIEF_FIELD_MAPPING,
  SPEC_FIELD_MAPPING,
  EXCEL_SHEET_NAMES,
  ExportErrorException
} from '@/types/export';

export class ExcelExportService {
  private templatePath = '/templates/meta-lead-spec-sheet.xlsx';

  /**
   * Load the Excel template file
   */
  private async loadTemplate(): Promise<ExcelJS.Workbook> {
    try {
      console.log('Loading template from:', this.templatePath);
      const response = await fetch(this.templatePath);
      console.log('Template fetch response:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log('Template loaded, size:', arrayBuffer.byteLength, 'bytes');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      console.log('Template parsed successfully');

      return workbook;
    } catch (error) {
      console.error('Template load error:', error);
      throw new ExportErrorException({
        code: 'TEMPLATE_LOAD_ERROR',
        message: 'Failed to load Excel template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Map form data to Brief sheet values
   */
  private mapBriefData(brief: PreFormBrief | null, form: MetaLeadForm): Record<string, string> {
    const hasScreeningQuestions = form.qualifiers.length >= 2;
    const responseTimeText = brief?.responseTime
      ? `${brief.responseTime.value} ${brief.responseTime.unit}`
      : 'Not specified';

    return {
      [BRIEF_FIELD_MAPPING.monthlyLeadGoal]: brief?.monthlyLeadGoal || 'Not specified',
      [BRIEF_FIELD_MAPPING.adminAndLeadsAccess]: this.formatAdminAccess(brief?.hasAdminAccess),
      [BRIEF_FIELD_MAPPING.hipaaOrHealthRelated]: brief?.isHealthRelated ? 'Yes' : 'No',
      [BRIEF_FIELD_MAPPING.leadDeliveryEmails]: brief?.leadEmailAddresses || 'Not specified',
      [BRIEF_FIELD_MAPPING.responseTimeAwareness]: `Client expects ${responseTimeText} response time`,
      [BRIEF_FIELD_MAPPING.hasPrivacyPolicy]: this.formatPrivacyPolicy(brief),
      [BRIEF_FIELD_MAPPING.hasTwoScreeningQs]: hasScreeningQuestions ? 'Yes' : 'No',
      [BRIEF_FIELD_MAPPING.offersOrPromos]: this.extractOffersFromForm(form),
      [BRIEF_FIELD_MAPPING.specSheetCompleted]: 'Yes'
    };
  }

  /**
   * Map form data to Spec sheet values
   */
  private mapSpecData(form: MetaLeadForm): Record<string, string> {
    const qualifiers = form.qualifiers.slice(0, 3); // Max 3 screening questions
    const contactFieldsList = this.formatContactFields(form.contactFields);

    return {
      [SPEC_FIELD_MAPPING.formName]: form.name || 'Untitled Form',
      [SPEC_FIELD_MAPPING.formType]: this.formatFormType(form.formType),
      [SPEC_FIELD_MAPPING.headline]: form.intro.headline || '',
      [SPEC_FIELD_MAPPING.description]: form.intro.description || '',
      [SPEC_FIELD_MAPPING.screeningQ1]: qualifiers[0]?.question || '',
      [SPEC_FIELD_MAPPING.screeningA1]: this.formatQualifierOptions(qualifiers[0]),
      [SPEC_FIELD_MAPPING.screeningQ2]: qualifiers[1]?.question || '',
      [SPEC_FIELD_MAPPING.screeningA2]: this.formatQualifierOptions(qualifiers[1]),
      [SPEC_FIELD_MAPPING.screeningQ3]: qualifiers[2]?.question || '',
      [SPEC_FIELD_MAPPING.screeningA3]: this.formatQualifierOptions(qualifiers[2]),
      [SPEC_FIELD_MAPPING.contactInfoDescription]: form.contactDescription || 'Please provide your contact information',
      [SPEC_FIELD_MAPPING.selectedContactFields]: contactFieldsList,
      [SPEC_FIELD_MAPPING.privacyPolicyUrl]: form.privacy.businessPrivacyUrl || '',
      [SPEC_FIELD_MAPPING.completionHeadline]: form.thankYou.headline || '',
      [SPEC_FIELD_MAPPING.completionDescription]: form.thankYou.description || '',
      [SPEC_FIELD_MAPPING.ctaText]: form.thankYou.action.label || '',
      [SPEC_FIELD_MAPPING.ctaUrl]: form.thankYou.action.websiteUrl || ''
    };
  }

  /**
   * Format admin access status
   */
  private formatAdminAccess(hasAdminAccess?: 'yes' | 'no' | 'pending'): string {
    switch (hasAdminAccess) {
      case 'yes': return 'Yes, we have full admin access';
      case 'no': return 'No, admin access needed';
      case 'pending': return 'Pending - working on access';
      default: return 'Not specified';
    }
  }

  /**
   * Format privacy policy information
   */
  private formatPrivacyPolicy(brief: PreFormBrief | null): string {
    if (!brief) return 'Not specified';

    const hasPolicy = brief.hasPrivacyPolicy === 'yes';
    const url = brief.privacyPolicyUrl;

    if (hasPolicy && url) {
      return `Yes - ${url}`;
    } else if (hasPolicy) {
      return 'Yes - URL to be provided';
    } else {
      return 'No - needs to be created';
    }
  }

  /**
   * Extract offers/promos from form content
   */
  private extractOffersFromForm(form: MetaLeadForm): string {
    const headline = form.intro.headline || '';
    const description = form.intro.description || '';

    // Look for common offer/promo keywords
    const offerKeywords = ['discount', 'free', 'off', '%', 'special', 'limited', 'offer', 'deal', 'promotion'];
    const content = `${headline} ${description}`.toLowerCase();

    const hasOffer = offerKeywords.some(keyword => content.includes(keyword));

    if (hasOffer) {
      return `Yes - "${headline}"`;
    } else {
      return 'No specific offers mentioned';
    }
  }

  /**
   * Format form type for display
   */
  private formatFormType(formType: string): string {
    switch (formType) {
      case 'more_volume': return 'More Volume (4-step flow)';
      case 'higher_intent': return 'Higher Intent (5-step flow)';
      case 'rich_creative': return 'Rich Creative';
      default: return formType;
    }
  }

  /**
   * Format qualifier options for display
   */
  private formatQualifierOptions(qualifier?: any): string {
    if (!qualifier) return '';

    if (qualifier.type === 'multiple_choice' && qualifier.options) {
      return qualifier.options.join(', ');
    } else if (qualifier.type === 'short_text') {
      return 'Short answer';
    } else if (qualifier.type === 'dropdown') {
      return qualifier.options ? qualifier.options.join(', ') : 'Dropdown options';
    }

    return 'Open response';
  }

  /**
   * Format contact fields list
   */
  private formatContactFields(contactFields: any[]): string {
    const requiredFields = contactFields
      .filter(field => field.required)
      .sort((a, b) => a.order - b.order)
      .map(field => field.name);

    if (requiredFields.length === 0) {
      return 'No required fields specified';
    }

    return requiredFields.join(', ');
  }

  /**
   * Apply data to worksheet cells
   */
  private applyDataToSheet(worksheet: ExcelJS.Worksheet, dataMapping: Record<string, string>): void {
    Object.entries(dataMapping).forEach(([cellRef, value]) => {
      const cell = worksheet.getCell(cellRef);
      if (cell && value) {
        cell.value = value;
      }
    });
  }

  /**
   * Generate populated Excel file
   */
  async generateExcel(form: MetaLeadForm, brief: PreFormBrief | null): Promise<Buffer> {
    try {
      // Load template
      const workbook = await this.loadTemplate();

      // Get worksheets
      const briefSheet = workbook.getWorksheet(EXCEL_SHEET_NAMES.BRIEF);
      const specSheet = workbook.getWorksheet(EXCEL_SHEET_NAMES.SPEC);

      if (!briefSheet || !specSheet) {
        throw new Error('Required worksheets not found in template');
      }

      // Map and apply data
      const briefData = this.mapBriefData(brief, form);
      const specData = this.mapSpecData(form);

      this.applyDataToSheet(briefSheet, briefData);
      this.applyDataToSheet(specSheet, specData);

      // Generate Excel buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);

    } catch (error) {
      if (error instanceof ExportErrorException) {
        throw error;
      }

      throw new ExportErrorException({
        code: 'EXCEL_GENERATION_ERROR',
        message: 'Failed to generate Excel file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate filename for export
   */
  generateFilename(formName: string, includeTimestamp = true): string {
    const sanitizedName = formName.replace(/[^a-z0-9]/gi, '_');
    const timestamp = includeTimestamp ? `_${Date.now()}` : '';
    return `Meta_Lead_Spec_Sheet_${sanitizedName}${timestamp}.xlsx`;
  }

  /**
   * Generate Excel using serverless API (recommended)
   * Falls back to client-side generation if API fails
   */
  async generateExcelServerless(
    form: MetaLeadForm,
    brief: PreFormBrief | null,
    options: { fallbackToClient?: boolean } = { fallbackToClient: true }
  ): Promise<{ buffer: Buffer; source: 'serverless' | 'client' }> {
    try {
      // Prepare data payload
      const exportData = {
        brief: brief ? {
          clientFacebookPage: brief.clientFacebookPage,
          clientWebsite: brief.clientWebsite,
          clientIndustry: brief.industry,
          campaignObjective: brief.campaignObjective,
          campaignBudget: brief.monthlyLeadGoal,
          campaignTimeline: brief.responseTime
            ? `${brief.responseTime.value} ${brief.responseTime.unit}`
            : undefined,
          formType: form.formType,
          formName: form.name,
          privacyPolicyUrl: brief.privacyPolicyUrl || form.privacy.businessPrivacyUrl,
          headlineText: form.intro.headline,
          descriptionText: form.intro.description,
          targetAudience: brief.targetAudience,
          geographicTargeting: brief.geographicTargeting,
          specialRequirements: brief.specialRequirements,
        } : {},
        spec: {
          formName: form.name,
          formType: this.formatFormType(form.formType),
          formLocale: form.locale || 'en_US',
          intro: {
            title: form.intro.headline,
            description: form.intro.description,
            imageUrl: form.intro.imageUrl,
            buttonText: form.intro.buttonText || 'Get Started',
          },
          questions: form.qualifiers.slice(0, 3).map((q, index) => ({
            id: q.id || `q${index + 1}`,
            label: q.question,
            type: q.type,
            required: q.required ?? true,
            options: q.options,
          })),
          contactFields: this.formatContactFields(form.contactFields).split(', '),
          privacy: {
            policyUrl: form.privacy.businessPrivacyUrl,
            customDisclaimer: form.privacy.customDisclaimer,
          },
          thankYou: {
            title: form.thankYou.headline,
            description: form.thankYou.description,
            buttonText: form.thankYou.action.label,
            buttonUrl: form.thankYou.action.websiteUrl,
          },
        },
      };

      // Call serverless API
      const response = await fetch('/api/generate-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          `Serverless API error (${response.status}): ${errorData.error || response.statusText}`
        );
      }

      // Get buffer from response
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return { buffer, source: 'serverless' };

    } catch (error) {
      console.error('Serverless Excel generation failed:', error);

      // Fallback to client-side generation if enabled
      if (options.fallbackToClient) {
        console.log('Falling back to client-side generation...');
        const buffer = await this.generateExcel(form, brief);
        return { buffer, source: 'client' };
      }

      throw new ExportErrorException({
        code: 'SERVERLESS_GENERATION_ERROR',
        message: 'Failed to generate Excel via serverless API',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}