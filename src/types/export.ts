// Export-specific type definitions
export interface ExportProgress {
  stage: 'initializing' | 'processing_data' | 'generating_excel' | 'creating_zip' | 'complete';
  progress: number;
  message: string;
}

export interface ExportError {
  code: 'TEMPLATE_LOAD_ERROR' | 'DATA_MAPPING_ERROR' | 'EXCEL_GENERATION_ERROR' | 'ZIP_CREATION_ERROR' | 'DOWNLOAD_ERROR';
  message: string;
  details?: string;
}

export class ExportErrorException extends Error {
  public readonly code: ExportError['code'];
  public readonly details?: string;

  constructor(error: ExportError) {
    super(error.message);
    this.name = 'ExportErrorException';
    this.code = error.code;
    this.details = error.details;
  }
}

export interface ExportOptions {
  includeJson: boolean;
  filename?: string;
  timestamp?: boolean;
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: ExportError;
}

// Field mapping constants for Excel export
export const BRIEF_FIELD_MAPPING = {
  monthlyLeadGoal: 'B3',
  adminAndLeadsAccess: 'B4',
  hipaaOrHealthRelated: 'B5',
  leadDeliveryEmails: 'B6',
  responseTimeAwareness: 'B7',
  hasPrivacyPolicy: 'B8',
  hasTwoScreeningQs: 'B9',
  offersOrPromos: 'B10',
  specSheetCompleted: 'B11'
} as const;

export const SPEC_FIELD_MAPPING = {
  formName: 'B3',
  formType: 'B4',
  headline: 'B5',
  description: 'B6',
  screeningQ1: 'B7',
  screeningA1: 'B8',
  screeningQ2: 'B9',
  screeningA2: 'B10',
  screeningQ3: 'B11',
  screeningA3: 'B12',
  contactInfoDescription: 'B13',
  selectedContactFields: 'B15',
  privacyPolicyUrl: 'B16',
  completionHeadline: 'B17',
  completionDescription: 'B18',
  ctaText: 'B19',
  ctaUrl: 'B20'
} as const;

// Sheet names in the template
export const EXCEL_SHEET_NAMES = {
  BRIEF: 'Facebook Lead Gen Brief',
  SPEC: 'Facebook Lead Form Spec Sheet'
} as const;