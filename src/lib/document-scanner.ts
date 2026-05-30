// VLM-powered Document Scanner Service
// Uses z-ai-web-dev-sdk VLM (Vision Language Model) to scan uploaded documents
// and automatically extract structured data from COIs, licenses, and bond certificates

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface COIExtraction {
  insuredName: string | null;
  policyNumber: string | null;
  insuranceProvider: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  coverageAmount: number | null;
  perOccurrenceLimit: number | null;
  aggregateLimit: number | null;
  additionalInsured: boolean;
  primaryNoncontributory: boolean;
  waiverOfSubrogation: boolean;
  endorsementTypes: string[];
  holderName: string | null;
  confidence: number;
}

export interface LicenseExtraction {
  licenseNumber: string | null;
  licenseType: string | null;
  licenseeName: string | null;
  state: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  issuingBoard: string | null;
  restrictions: string | null;
  confidence: number;
}

export interface BondExtraction {
  bondNumber: string | null;
  bondType: string | null;
  principalName: string | null;
  obligeeName: string | null;
  suretyCompany: string | null;
  bondAmount: number | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  confidence: number;
}

export interface DocumentScanResult {
  documentType: 'coi' | 'license' | 'bond' | 'unknown';
  coi?: COIExtraction;
  license?: LicenseExtraction;
  bond?: BondExtraction;
  rawText: string;
  confidence: number;
}

// ─── VLM Client ────────────────────────────────────────────────────────────

let _zai: InstanceType<typeof ZAI> | null = null;

async function getZAI(): Promise<InstanceType<typeof ZAI>> {
  if (!_zai) {
    _zai = await ZAI.create();
  }
  return _zai;
}

// ─── Helper: Convert file to base64 data URL ────────────────────────────────

function fileToBase64DataUrl(buffer: Buffer, mimeType: string): string {
  const base64Data = buffer.toString('base64');
  return `data:${mimeType};base64,${base64Data}`;
}

// ─── Helper: Parse JSON from VLM response ──────────────────────────────────

function parseJSONFromResponse(content: string): Record<string, unknown> | null {
  // Try to extract JSON from the response (may be wrapped in markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // Fall through
    }
  }

  // Try direct JSON parse
  try {
    return JSON.parse(content.trim());
  } catch {
    // Fall through
  }

  // Try to find JSON object in the text
  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      // Give up
    }
  }

  return null;
}

// ─── COI Scanning ───────────────────────────────────────────────────────────

const COI_PROMPT = `You are a document scanning AI specialized in extracting data from Certificates of Insurance (COIs). Analyze the provided document image and extract all available information.

Return a JSON object with these fields:
- insuredName: The name of the insured party (string or null)
- policyNumber: The policy number (string or null)
- insuranceProvider: The insurance company name (string or null)
- effectiveDate: Policy effective date in YYYY-MM-DD format (string or null)
- expirationDate: Policy expiration date in YYYY-MM-DD format (string or null)
- coverageAmount: Total coverage amount as a number (number or null)
- perOccurrenceLimit: Per occurrence limit as a number (number or null)
- aggregateLimit: Aggregate limit as a number (number or null)
- additionalInsured: Whether additional insured endorsement is present (boolean)
- primaryNoncontributory: Whether primary non-contributory endorsement is present (boolean)
- waiverOfSubrogation: Whether waiver of subrogation is present (boolean)
- endorsementTypes: Array of endorsement type names found (string array)
- holderName: Certificate holder name (string or null)
- confidence: Your confidence score for this extraction from 0-100 (number)

IMPORTANT: Return ONLY valid JSON. Use null for fields you cannot determine. For monetary amounts, extract as numbers without currency symbols or commas.`;

export async function scanCOI(
  fileBuffer: Buffer,
  mimeType: string
): Promise<DocumentScanResult> {
  const zai = await getZAI();
  const imageUrl = fileToBase64DataUrl(fileBuffer, mimeType);

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: COI_PROMPT },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  });

  const content = response.choices[0]?.message?.content || '';
  const parsed = parseJSONFromResponse(content);

  if (!parsed) {
    return {
      documentType: 'coi',
      coi: {
        insuredName: null,
        policyNumber: null,
        insuranceProvider: null,
        effectiveDate: null,
        expirationDate: null,
        coverageAmount: null,
        perOccurrenceLimit: null,
        aggregateLimit: null,
        additionalInsured: false,
        primaryNoncontributory: false,
        waiverOfSubrogation: false,
        endorsementTypes: [],
        holderName: null,
        confidence: 0,
      },
      rawText: content,
      confidence: 0,
    };
  }

  const coi: COIExtraction = {
    insuredName: (parsed.insuredName as string) || null,
    policyNumber: (parsed.policyNumber as string) || null,
    insuranceProvider: (parsed.insuranceProvider as string) || null,
    effectiveDate: (parsed.effectiveDate as string) || null,
    expirationDate: (parsed.expirationDate as string) || null,
    coverageAmount: typeof parsed.coverageAmount === 'number' ? parsed.coverageAmount : null,
    perOccurrenceLimit: typeof parsed.perOccurrenceLimit === 'number' ? parsed.perOccurrenceLimit : null,
    aggregateLimit: typeof parsed.aggregateLimit === 'number' ? parsed.aggregateLimit : null,
    additionalInsured: typeof parsed.additionalInsured === 'boolean' ? parsed.additionalInsured : false,
    primaryNoncontributory: typeof parsed.primaryNoncontributory === 'boolean' ? parsed.primaryNoncontributory : false,
    waiverOfSubrogation: typeof parsed.waiverOfSubrogation === 'boolean' ? parsed.waiverOfSubrogation : false,
    endorsementTypes: Array.isArray(parsed.endorsementTypes) ? parsed.endorsementTypes as string[] : [],
    holderName: (parsed.holderName as string) || null,
    confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
  };

  return {
    documentType: 'coi',
    coi,
    rawText: content,
    confidence: coi.confidence,
  };
}

// ─── License Scanning ───────────────────────────────────────────────────────

const LICENSE_PROMPT = `You are a document scanning AI specialized in extracting data from contractor licenses and professional certifications. Analyze the provided document image and extract all available information.

Return a JSON object with these fields:
- licenseNumber: The license or certification number (string or null)
- licenseType: Type of license (e.g., "Electrical", "Plumbing", "General Contractor") (string or null)
- licenseeName: Name of the licensed individual or company (string or null)
- state: State that issued the license (two-letter code, e.g., "CA") (string or null)
- issueDate: Issue date in YYYY-MM-DD format (string or null)
- expirationDate: Expiration date in YYYY-MM-DD format (string or null)
- issuingBoard: Name of the issuing board or authority (string or null)
- restrictions: Any restrictions or limitations on the license (string or null)
- confidence: Your confidence score for this extraction from 0-100 (number)

IMPORTANT: Return ONLY valid JSON. Use null for fields you cannot determine.`;

export async function scanLicense(
  fileBuffer: Buffer,
  mimeType: string
): Promise<DocumentScanResult> {
  const zai = await getZAI();
  const imageUrl = fileToBase64DataUrl(fileBuffer, mimeType);

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: LICENSE_PROMPT },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  });

  const content = response.choices[0]?.message?.content || '';
  const parsed = parseJSONFromResponse(content);

  if (!parsed) {
    return {
      documentType: 'license',
      license: {
        licenseNumber: null,
        licenseType: null,
        licenseeName: null,
        state: null,
        issueDate: null,
        expirationDate: null,
        issuingBoard: null,
        restrictions: null,
        confidence: 0,
      },
      rawText: content,
      confidence: 0,
    };
  }

  const license: LicenseExtraction = {
    licenseNumber: (parsed.licenseNumber as string) || null,
    licenseType: (parsed.licenseType as string) || null,
    licenseeName: (parsed.licenseeName as string) || null,
    state: (parsed.state as string) || null,
    issueDate: (parsed.issueDate as string) || null,
    expirationDate: (parsed.expirationDate as string) || null,
    issuingBoard: (parsed.issuingBoard as string) || null,
    restrictions: (parsed.restrictions as string) || null,
    confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
  };

  return {
    documentType: 'license',
    license,
    rawText: content,
    confidence: license.confidence,
  };
}

// ─── Bond Scanning ──────────────────────────────────────────────────────────

const BOND_PROMPT = `You are a document scanning AI specialized in extracting data from surety bonds and bond certificates. Analyze the provided document image and extract all available information.

Return a JSON object with these fields:
- bondNumber: The bond number or identifier (string or null)
- bondType: Type of bond (e.g., "Performance Bond", "License Bond", "Payment Bond") (string or null)
- principalName: Name of the principal (the party required to obtain the bond) (string or null)
- obligeeName: Name of the obligee (the party protected by the bond) (string or null)
- suretyCompany: Name of the surety company issuing the bond (string or null)
- bondAmount: The bond amount as a number (number or null)
- effectiveDate: Bond effective date in YYYY-MM-DD format (string or null)
- expirationDate: Bond expiration date in YYYY-MM-DD format (string or null)
- confidence: Your confidence score for this extraction from 0-100 (number)

IMPORTANT: Return ONLY valid JSON. Use null for fields you cannot determine. For monetary amounts, extract as numbers without currency symbols or commas.`;

export async function scanBond(
  fileBuffer: Buffer,
  mimeType: string
): Promise<DocumentScanResult> {
  const zai = await getZAI();
  const imageUrl = fileToBase64DataUrl(fileBuffer, mimeType);

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: BOND_PROMPT },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  });

  const content = response.choices[0]?.message?.content || '';
  const parsed = parseJSONFromResponse(content);

  if (!parsed) {
    return {
      documentType: 'bond',
      bond: {
        bondNumber: null,
        bondType: null,
        principalName: null,
        obligeeName: null,
        suretyCompany: null,
        bondAmount: null,
        effectiveDate: null,
        expirationDate: null,
        confidence: 0,
      },
      rawText: content,
      confidence: 0,
    };
  }

  const bond: BondExtraction = {
    bondNumber: (parsed.bondNumber as string) || null,
    bondType: (parsed.bondType as string) || null,
    principalName: (parsed.principalName as string) || null,
    obligeeName: (parsed.obligeeName as string) || null,
    suretyCompany: (parsed.suretyCompany as string) || null,
    bondAmount: typeof parsed.bondAmount === 'number' ? parsed.bondAmount : null,
    effectiveDate: (parsed.effectiveDate as string) || null,
    expirationDate: (parsed.expirationDate as string) || null,
    confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
  };

  return {
    documentType: 'bond',
    bond,
    rawText: content,
    confidence: bond.confidence,
  };
}

// ─── Auto-detect Document Type & Scan ───────────────────────────────────────

const AUTO_DETECT_PROMPT = `You are a document classification and extraction AI for a contractor compliance platform. Analyze the provided document image and:

1. Classify the document type as one of: "coi" (Certificate of Insurance), "license" (contractor license or professional certification), "bond" (surety bond), or "unknown"
2. Extract ALL relevant data based on the document type

Return a JSON object with these fields:
- documentType: "coi", "license", "bond", or "unknown" (string)

If documentType is "coi", also include:
- insuredName, policyNumber, insuranceProvider, effectiveDate, expirationDate, coverageAmount (number), perOccurrenceLimit (number), aggregateLimit (number), additionalInsured (boolean), primaryNoncontributory (boolean), waiverOfSubrogation (boolean), endorsementTypes (string array), holderName

If documentType is "license", also include:
- licenseNumber, licenseType, licenseeName, state (2-letter code), issueDate, expirationDate, issuingBoard, restrictions

If documentType is "bond", also include:
- bondNumber, bondType, principalName, obligeeName, suretyCompany, bondAmount (number), effectiveDate, expirationDate

Always include:
- confidence: Your confidence score from 0-100 (number)

Use null for fields you cannot determine. Dates in YYYY-MM-DD format. Monetary amounts as numbers without currency symbols. Return ONLY valid JSON.`;

export async function scanDocument(
  fileBuffer: Buffer,
  mimeType: string
): Promise<DocumentScanResult> {
  const zai = await getZAI();
  const imageUrl = fileToBase64DataUrl(fileBuffer, mimeType);

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: AUTO_DETECT_PROMPT },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  });

  const content = response.choices[0]?.message?.content || '';
  const parsed = parseJSONFromResponse(content);

  if (!parsed) {
    return {
      documentType: 'unknown',
      rawText: content,
      confidence: 0,
    };
  }

  const docType = (parsed.documentType as string) || 'unknown';
  const confidence = typeof parsed.confidence === 'number'
    ? Math.min(100, Math.max(0, parsed.confidence))
    : 50;

  const result: DocumentScanResult = {
    documentType: docType as 'coi' | 'license' | 'bond' | 'unknown',
    rawText: content,
    confidence,
  };

  if (docType === 'coi') {
    result.coi = {
      insuredName: (parsed.insuredName as string) || null,
      policyNumber: (parsed.policyNumber as string) || null,
      insuranceProvider: (parsed.insuranceProvider as string) || null,
      effectiveDate: (parsed.effectiveDate as string) || null,
      expirationDate: (parsed.expirationDate as string) || null,
      coverageAmount: typeof parsed.coverageAmount === 'number' ? parsed.coverageAmount : null,
      perOccurrenceLimit: typeof parsed.perOccurrenceLimit === 'number' ? parsed.perOccurrenceLimit : null,
      aggregateLimit: typeof parsed.aggregateLimit === 'number' ? parsed.aggregateLimit : null,
      additionalInsured: typeof parsed.additionalInsured === 'boolean' ? parsed.additionalInsured : false,
      primaryNoncontributory: typeof parsed.primaryNoncontributory === 'boolean' ? parsed.primaryNoncontributory : false,
      waiverOfSubrogation: typeof parsed.waiverOfSubrogation === 'boolean' ? parsed.waiverOfSubrogation : false,
      endorsementTypes: Array.isArray(parsed.endorsementTypes) ? parsed.endorsementTypes as string[] : [],
      holderName: (parsed.holderName as string) || null,
      confidence,
    };
  } else if (docType === 'license') {
    result.license = {
      licenseNumber: (parsed.licenseNumber as string) || null,
      licenseType: (parsed.licenseType as string) || null,
      licenseeName: (parsed.licenseeName as string) || null,
      state: (parsed.state as string) || null,
      issueDate: (parsed.issueDate as string) || null,
      expirationDate: (parsed.expirationDate as string) || null,
      issuingBoard: (parsed.issuingBoard as string) || null,
      restrictions: (parsed.restrictions as string) || null,
      confidence,
    };
  } else if (docType === 'bond') {
    result.bond = {
      bondNumber: (parsed.bondNumber as string) || null,
      bondType: (parsed.bondType as string) || null,
      principalName: (parsed.principalName as string) || null,
      obligeeName: (parsed.obligeeName as string) || null,
      suretyCompany: (parsed.suretyCompany as string) || null,
      bondAmount: typeof parsed.bondAmount === 'number' ? parsed.bondAmount : null,
      effectiveDate: (parsed.effectiveDate as string) || null,
      expirationDate: (parsed.expirationDate as string) || null,
      confidence,
    };
  }

  return result;
}

// ─── File reading helper ────────────────────────────────────────────────────

export function readFileAsBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}
