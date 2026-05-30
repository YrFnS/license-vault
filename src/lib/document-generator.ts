import ZAI from 'z-ai-web-dev-sdk';

interface DocumentGenerationRequest {
  template: string;
  data: Record<string, any>;
  format: 'text' | 'html';
}

interface GeneratedDocument {
  content: string;
  format: string;
  template: string;
  generatedAt: string;
}

const templatePrompts: Record<string, string> = {
  renewal_letter: `You are a professional document generator for a contractor licensing management platform. Generate a formal license renewal letter. The letter should be professional, properly formatted, and include all relevant details from the provided data. Include the date, recipient board name, license information, renewal period request, and a formal closing. Make it suitable for official correspondence with a state licensing board.`,
  
  compliance_certificate: `You are a professional document generator for a contractor licensing management platform. Generate a certificate of compliance for a construction project. The document should be formal and authoritative, certifying that the organization meets all licensing and compliance requirements for the specified project. Include project details, compliance score, date range, and authorized signatures.`,
  
  board_letter: `You are a professional document generator for a contractor licensing management platform. Generate a formal letter to a licensing board. The letter should be professional and respectful, addressing the specified subject matter. Include the board name, subject, organization info, license details, and a clear request or statement.`,
  
  notice_to_proceed: `You are a professional document generator for a contractor licensing management platform. Generate a Notice to Proceed document for subcontractors. This is an official authorization for a subcontractor to begin work on a project. Include project name, subcontractor details, start date, scope of work, and any conditions or requirements.`,
  
  vendor_questionnaire: `You are a professional document generator for a contractor licensing management platform. Generate a pre-qualification vendor questionnaire. This should be a comprehensive form that collects information about a vendor's business, trade type, states of operation, licensing status, insurance, and references. Format it as a fillable questionnaire with clear sections.`,
  
  custom: `You are a professional document generator for a contractor licensing management platform. Generate a custom document based on the user's prompt. Make it professional and well-formatted. Follow the user's instructions carefully and include all requested information.`,
};

/**
 * Generate a document using AI
 */
export async function generateDocument(
  request: DocumentGenerationRequest
): Promise<GeneratedDocument> {
  const zai = await ZAI.create();

  const systemPrompt = templatePrompts[request.template] || templatePrompts.custom;

  const formatInstruction = request.format === 'html'
    ? 'Output the document as well-formatted HTML with inline styles for professional email/print appearance. Use appropriate heading tags, paragraphs, tables where needed, and professional fonts. Include proper margins and spacing via inline styles.'
    : 'Output the document as plain text with proper formatting, spacing, and structure. Use clear section headers and line breaks.';

  const userPrompt = `Generate a ${request.template.replace(/_/g, ' ')} document with the following data:

${JSON.stringify(request.data, null, 2)}

${formatInstruction}

Important: Generate ONLY the document content, no meta-commentary or explanations.`;

  const response = await zai.llm.chat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 2000,
  });

  const content = response.choices?.[0]?.message?.content || '';

  return {
    content,
    format: request.format,
    template: request.template,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get the template-specific form fields
 */
export function getTemplateFields(template: string): { key: string; label: string; type: string; required: boolean }[] {
  switch (template) {
    case 'renewal_letter':
      return [
        { key: 'orgName', label: 'Organization Name', type: 'text', required: true },
        { key: 'licenseName', label: 'License Name', type: 'text', required: true },
        { key: 'licenseNumber', label: 'License Number', type: 'text', required: true },
        { key: 'boardName', label: 'Board Name', type: 'text', required: true },
        { key: 'state', label: 'State', type: 'text', required: true },
        { key: 'renewalPeriod', label: 'Renewal Period', type: 'text', required: true },
        { key: 'expirationDate', label: 'Current Expiration Date', type: 'date', required: true },
        { key: 'contactName', label: 'Contact Name', type: 'text', required: false },
        { key: 'contactEmail', label: 'Contact Email', type: 'text', required: false },
        { key: 'additionalNotes', label: 'Additional Notes', type: 'textarea', required: false },
      ];
    case 'compliance_certificate':
      return [
        { key: 'orgName', label: 'Organization Name', type: 'text', required: true },
        { key: 'projectName', label: 'Project Name', type: 'text', required: true },
        { key: 'projectLocation', label: 'Project Location', type: 'text', required: false },
        { key: 'complianceScore', label: 'Compliance Score', type: 'text', required: false },
        { key: 'dateRange', label: 'Date Range', type: 'text', required: false },
        { key: 'authorizedName', label: 'Authorized Person Name', type: 'text', required: true },
        { key: 'authorizedTitle', label: 'Title', type: 'text', required: false },
        { key: 'additionalInfo', label: 'Additional Information', type: 'textarea', required: false },
      ];
    case 'board_letter':
      return [
        { key: 'boardName', label: 'Board Name', type: 'text', required: true },
        { key: 'subject', label: 'Subject', type: 'text', required: true },
        { key: 'orgName', label: 'Organization Name', type: 'text', required: true },
        { key: 'licenseName', label: 'License Name', type: 'text', required: false },
        { key: 'licenseNumber', label: 'License Number', type: 'text', required: false },
        { key: 'state', label: 'State', type: 'text', required: true },
        { key: 'bodyContent', label: 'Letter Body / Key Points', type: 'textarea', required: true },
        { key: 'contactName', label: 'Contact Name', type: 'text', required: false },
      ];
    case 'notice_to_proceed':
      return [
        { key: 'projectName', label: 'Project Name', type: 'text', required: true },
        { key: 'projectLocation', label: 'Project Location', type: 'text', required: false },
        { key: 'subcontractorName', label: 'Subcontractor Name', type: 'text', required: true },
        { key: 'startDate', label: 'Start Date', type: 'date', required: true },
        { key: 'scopeOfWork', label: 'Scope of Work', type: 'textarea', required: true },
        { key: 'completionDate', label: 'Completion Date', type: 'date', required: false },
        { key: 'contractAmount', label: 'Contract Amount', type: 'text', required: false },
        { key: 'specialConditions', label: 'Special Conditions', type: 'textarea', required: false },
        { key: 'issuedBy', label: 'Issued By', type: 'text', required: true },
      ];
    case 'vendor_questionnaire':
      return [
        { key: 'orgName', label: 'Organization Name', type: 'text', required: true },
        { key: 'tradeType', label: 'Trade Type', type: 'text', required: true },
        { key: 'statesOfOperation', label: 'States of Operation', type: 'text', required: true },
        { key: 'yearsInBusiness', label: 'Years in Business', type: 'text', required: false },
        { key: 'licenseCount', label: 'Number of Active Licenses', type: 'text', required: false },
        { key: 'insuranceProvider', label: 'Insurance Provider', type: 'text', required: false },
        { key: 'insuranceAmount', label: 'Insurance Coverage Amount', type: 'text', required: false },
        { key: 'references', label: 'References (3 minimum)', type: 'textarea', required: false },
      ];
    case 'custom':
      return [
        { key: 'prompt', label: 'Custom Prompt', type: 'textarea', required: true },
      ];
    default:
      return [];
  }
}
