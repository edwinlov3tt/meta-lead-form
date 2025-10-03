import type { VercelRequest, VercelResponse } from '@vercel/node';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

/**
 * Serverless API endpoint for generating Meta Lead Form Spec Sheets
 *
 * POST /api/generate-excel
 *
 * Request body: ExportData (same format as client-side service)
 * Response: Binary Excel file
 */

// Field mappings matching client-side implementation
const BRIEF_FIELD_MAPPING = {
  // Client Information
  clientFacebookPage: 'B3',
  clientWebsite: 'B4',
  clientIndustry: 'B5',

  // Campaign Details
  campaignObjective: 'B7',
  campaignBudget: 'B8',
  campaignTimeline: 'B9',

  // Form Configuration
  formType: 'B11',
  formName: 'B12',
  privacyPolicyUrl: 'B13',

  // Creative Assets
  headlineText: 'B15',
  descriptionText: 'B16',
  imageUrl: 'B17',

  // Targeting & Audience
  targetAudience: 'B19',
  geographicTargeting: 'B20',
  ageRange: 'B21',

  // Additional Notes
  specialRequirements: 'B23',
  internalNotes: 'B24',
} as const;

const SPEC_FIELD_MAPPING = {
  // Form Header
  formName: 'B3',
  formType: 'B4',
  formLocale: 'B5',

  // Intro Card
  introTitle: 'B8',
  introDescription: 'B9',
  introImageUrl: 'B10',
  introButtonText: 'B11',

  // Questions Section (Dynamic - starts at row 14)
  questionsStartRow: 14,

  // Contact Fields Section (starts after questions)
  contactFieldsLabel: 'B', // Column B, row calculated dynamically

  // Privacy Section
  privacyPolicyUrl: 'B', // Row calculated
  customDisclaimerText: 'B',

  // Thank You Card
  thankYouTitle: 'B',
  thankYouDescription: 'B',
  thankYouButtonText: 'B',
  thankYouButtonUrl: 'B',
} as const;

interface ExportData {
  brief: {
    clientFacebookPage?: string;
    clientWebsite?: string;
    clientIndustry?: string;
    campaignObjective?: string;
    campaignBudget?: string;
    campaignTimeline?: string;
    formType?: string;
    formName?: string;
    privacyPolicyUrl?: string;
    headlineText?: string;
    descriptionText?: string;
    imageUrl?: string;
    targetAudience?: string;
    geographicTargeting?: string;
    ageRange?: string;
    specialRequirements?: string;
    internalNotes?: string;
  };
  spec: {
    formName?: string;
    formType?: string;
    formLocale?: string;
    intro?: {
      title?: string;
      description?: string;
      imageUrl?: string;
      buttonText?: string;
    };
    questions?: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
    }>;
    contactFields?: string[];
    privacy?: {
      policyUrl?: string;
      customDisclaimer?: string;
    };
    thankYou?: {
      title?: string;
      description?: string;
      buttonText?: string;
      buttonUrl?: string;
    };
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: ExportData = req.body;

    // Validate request body
    if (!data || !data.brief || !data.spec) {
      return res.status(400).json({
        error: 'Invalid request body. Expected: { brief: {...}, spec: {...} }'
      });
    }

    // Load template
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'meta-lead-spec-sheet.xlsx');

    if (!fs.existsSync(templatePath)) {
      console.error('Template not found at:', templatePath);
      return res.status(500).json({
        error: 'Template file not found',
        path: templatePath
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // Populate Brief sheet
    const briefSheet = workbook.getWorksheet('Brief');
    if (briefSheet && data.brief) {
      Object.entries(BRIEF_FIELD_MAPPING).forEach(([key, cellRef]) => {
        const value = data.brief[key as keyof typeof data.brief];
        if (value !== undefined && value !== null) {
          const cell = briefSheet.getCell(cellRef);
          cell.value = value;
        }
      });
    }

    // Populate Spec sheet
    const specSheet = workbook.getWorksheet('Spec');
    if (specSheet && data.spec) {
      // Basic fields
      if (data.spec.formName) specSheet.getCell('B3').value = data.spec.formName;
      if (data.spec.formType) specSheet.getCell('B4').value = data.spec.formType;
      if (data.spec.formLocale) specSheet.getCell('B5').value = data.spec.formLocale;

      // Intro section
      if (data.spec.intro) {
        if (data.spec.intro.title) specSheet.getCell('B8').value = data.spec.intro.title;
        if (data.spec.intro.description) specSheet.getCell('B9').value = data.spec.intro.description;
        if (data.spec.intro.imageUrl) specSheet.getCell('B10').value = data.spec.intro.imageUrl;
        if (data.spec.intro.buttonText) specSheet.getCell('B11').value = data.spec.intro.buttonText;
      }

      // Questions section (dynamic)
      let currentRow = SPEC_FIELD_MAPPING.questionsStartRow;
      if (data.spec.questions && data.spec.questions.length > 0) {
        data.spec.questions.forEach((question, index) => {
          const questionRow = currentRow + (index * 3); // Each question takes 3 rows

          specSheet.getCell(`A${questionRow}`).value = `Question ${index + 1}`;
          specSheet.getCell(`B${questionRow}`).value = question.label;
          specSheet.getCell(`B${questionRow + 1}`).value = question.type;
          specSheet.getCell(`B${questionRow + 2}`).value = question.required ? 'Yes' : 'No';

          if (question.options && question.options.length > 0) {
            specSheet.getCell(`B${questionRow + 3}`).value = question.options.join(', ');
          }
        });

        currentRow += data.spec.questions.length * 4; // Update row counter
      }

      // Contact fields section
      currentRow += 2; // Add spacing
      if (data.spec.contactFields && data.spec.contactFields.length > 0) {
        specSheet.getCell(`A${currentRow}`).value = 'Contact Fields';
        specSheet.getCell(`B${currentRow}`).value = data.spec.contactFields.join(', ');
        currentRow += 2;
      }

      // Privacy section
      if (data.spec.privacy) {
        if (data.spec.privacy.policyUrl) {
          specSheet.getCell(`A${currentRow}`).value = 'Privacy Policy URL';
          specSheet.getCell(`B${currentRow}`).value = data.spec.privacy.policyUrl;
          currentRow++;
        }
        if (data.spec.privacy.customDisclaimer) {
          specSheet.getCell(`A${currentRow}`).value = 'Custom Disclaimer';
          specSheet.getCell(`B${currentRow}`).value = data.spec.privacy.customDisclaimer;
          currentRow++;
        }
        currentRow += 1;
      }

      // Thank You section
      if (data.spec.thankYou) {
        specSheet.getCell(`A${currentRow}`).value = 'Thank You Card';
        currentRow++;

        if (data.spec.thankYou.title) {
          specSheet.getCell(`A${currentRow}`).value = 'Title';
          specSheet.getCell(`B${currentRow}`).value = data.spec.thankYou.title;
          currentRow++;
        }
        if (data.spec.thankYou.description) {
          specSheet.getCell(`A${currentRow}`).value = 'Description';
          specSheet.getCell(`B${currentRow}`).value = data.spec.thankYou.description;
          currentRow++;
        }
        if (data.spec.thankYou.buttonText) {
          specSheet.getCell(`A${currentRow}`).value = 'Button Text';
          specSheet.getCell(`B${currentRow}`).value = data.spec.thankYou.buttonText;
          currentRow++;
        }
        if (data.spec.thankYou.buttonUrl) {
          specSheet.getCell(`A${currentRow}`).value = 'Button URL';
          specSheet.getCell(`B${currentRow}`).value = data.spec.thankYou.buttonUrl;
          currentRow++;
        }
      }
    }

    // Generate Excel file as buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const formName = data.spec?.formName || 'form';
    const filename = `${formName.replace(/[^a-z0-9]/gi, '_')}_spec_${timestamp}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send file
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('Excel generation error:', error);

    return res.status(500).json({
      error: 'Failed to generate Excel file',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}
