/**
 * AI API Integration Audit Script
 * Tests the AI form generation API to ensure:
 * 1. Request schema matches API expectations
 * 2. Response schema is correctly parsed
 * 3. Generated questions have proper format
 */

import { api, type AIFormGenerationRequest, type AIFormGenerationResponse } from './src/services/api';

// Test data matching what PreFormBriefV2 sends
const testBriefData: AIFormGenerationRequest = {
  objective: 'Generate qualified leads for home renovation services in the Seattle area',
  industry: 'Home & Home Improvement',
  priority: 'balanced',
  tone: 'professional',
  audience: 'potential customers',
  monthlyLeadGoal: '500',
  formType: 'more_volume',
  hasScreeningQuestions: true,
  screeningQuestionSuggestions: 'Budget range, project timeline, services needed',
  isHealthRelated: false,
  additionalNotes: 'Focus on kitchen and bathroom remodels',
  facebookPageData: {
    name: 'Seattle Home Renovations',
    website: 'https://example.com',
    categories: ['Home Improvement', 'Contractor']
  },
  responseTime: {
    value: '15',
    unit: 'minutes'
  }
};

async function auditAIAPI() {
  console.log('🔍 AI API Integration Audit\n');
  console.log('='.repeat(60));

  // Test 1: Schema Validation
  console.log('\n📋 Test 1: Request Schema Validation');
  console.log('-'.repeat(60));

  const requiredFields: (keyof AIFormGenerationRequest)[] = [
    'objective',
    'industry',
    'priority',
    'tone',
    'audience'
  ];

  const optionalFields: (keyof AIFormGenerationRequest)[] = [
    'monthlyLeadGoal',
    'formType',
    'hasScreeningQuestions',
    'screeningQuestionSuggestions',
    'isHealthRelated',
    'additionalNotes',
    'facebookPageData',
    'responseTime'
  ];

  let schemaValid = true;

  // Check required fields
  requiredFields.forEach(field => {
    if (!testBriefData[field]) {
      console.log(`❌ Missing required field: ${field}`);
      schemaValid = false;
    } else {
      console.log(`✅ Required field present: ${field}`);
    }
  });

  // Check optional fields
  optionalFields.forEach(field => {
    if (testBriefData[field] !== undefined) {
      console.log(`✅ Optional field present: ${field}`);
    }
  });

  if (!schemaValid) {
    console.error('\n❌ Schema validation failed!');
    return;
  }

  console.log('\n✅ Request schema is valid\n');

  // Test 2: API Call
  console.log('📡 Test 2: API Call');
  console.log('-'.repeat(60));

  try {
    console.log('Making API call to /api/generate-complete-form...');
    console.log('Request payload:', JSON.stringify(testBriefData, null, 2));

    const response = await api.generateCompleteForm(testBriefData);

    console.log('\n✅ API call successful!');
    console.log('\n📦 Response structure:');
    console.log(JSON.stringify(response, null, 2));

    // Test 3: Response Schema Validation
    console.log('\n📋 Test 3: Response Schema Validation');
    console.log('-'.repeat(60));

    const responseSchema: Record<keyof AIFormGenerationResponse, string> = {
      formName: 'string',
      intro: 'object',
      questions: 'array',
      contactInfo: 'object',
      completion: 'object',
      additionalAction: 'object',
      rationale: 'string'
    };

    let responseValid = true;

    Object.entries(responseSchema).forEach(([field, expectedType]) => {
      const actualValue = response[field as keyof AIFormGenerationResponse];
      const actualType = Array.isArray(actualValue) ? 'array' : typeof actualValue;

      if (field === 'rationale' && actualValue === undefined) {
        console.log(`✅ ${field}: optional field (${expectedType})`);
        return;
      }

      if (actualType === expectedType || (expectedType === 'object' && actualValue !== null && actualType === 'object')) {
        console.log(`✅ ${field}: ${expectedType}`);
      } else {
        console.log(`❌ ${field}: expected ${expectedType}, got ${actualType}`);
        responseValid = false;
      }
    });

    // Test 4: Questions Format Validation
    console.log('\n📋 Test 4: Questions Format Validation');
    console.log('-'.repeat(60));

    if (!Array.isArray(response.questions)) {
      console.log('❌ questions is not an array');
      responseValid = false;
    } else {
      console.log(`✅ Found ${response.questions.length} questions`);

      response.questions.forEach((question, index) => {
        console.log(`\n  Question ${index + 1}:`);
        console.log(`    - question: ${question.question ? '✅' : '❌'}`);
        console.log(`    - type: ${question.type ? '✅' : '❌'} (${question.type})`);
        console.log(`    - required: ${question.required !== undefined ? '✅' : '❌'}`);

        if (question.type === 'multiple_choice' || question.type === 'dropdown') {
          if (Array.isArray(question.options) && question.options.length > 0) {
            console.log(`    - options: ✅ (${question.options.length} options)`);
          } else {
            console.log(`    - options: ❌ (missing or empty for ${question.type})`);
            responseValid = false;
          }
        }

        if (!question.question || !question.type || question.required === undefined) {
          responseValid = false;
        }
      });
    }

    // Test 5: Contact Fields Validation
    console.log('\n📋 Test 5: Contact Fields Validation');
    console.log('-'.repeat(60));

    if (!response.contactInfo || !Array.isArray(response.contactInfo.recommendedFields)) {
      console.log('❌ contactInfo.recommendedFields is not an array');
      responseValid = false;
    } else {
      console.log(`✅ Found ${response.contactInfo.recommendedFields.length} contact fields`);

      response.contactInfo.recommendedFields.forEach((field, index) => {
        console.log(`\n  Field ${index + 1}:`);
        console.log(`    - type: ${field.type ? '✅' : '❌'} (${field.type})`);
        console.log(`    - name: ${field.name ? '✅' : '❌'}`);
        console.log(`    - required: ${field.required !== undefined ? '✅' : '❌'}`);
        console.log(`    - placeholder: ${field.placeholder ? '✅' : '❌'}`);
        console.log(`    - autofill: ${field.autofill !== undefined ? '✅' : '❌'}`);
        console.log(`    - priority: ${field.priority !== undefined ? '✅' : '❌'}`);

        if (!field.type || !field.name || field.required === undefined ||
            !field.placeholder || field.autofill === undefined || field.priority === undefined) {
          responseValid = false;
        }
      });
    }

    // Final Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(60));

    if (schemaValid && responseValid) {
      console.log('✅ All tests passed!');
      console.log('✅ Request schema is valid');
      console.log('✅ Response schema is valid');
      console.log('✅ Questions format is correct');
      console.log('✅ Contact fields format is correct');
      console.log('\n🎉 AI API integration is working correctly!\n');
    } else {
      console.log('❌ Some tests failed');
      if (!schemaValid) console.log('❌ Request schema has issues');
      if (!responseValid) console.log('❌ Response schema has issues');
      console.log('\n⚠️  Please review the errors above\n');
    }

  } catch (error) {
    console.error('\n❌ API call failed:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }

    console.log('\n💡 Troubleshooting tips:');
    console.log('  1. Verify API endpoint is running');
    console.log('  2. Check VITE_API_URL environment variable');
    console.log('  3. Verify Anthropic API key is configured');
    console.log('  4. Check network connectivity');
    console.log('  5. Review server logs for errors\n');
  }
}

// Run the audit
auditAIAPI().catch(console.error);
