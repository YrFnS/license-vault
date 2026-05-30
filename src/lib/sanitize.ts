import { z } from 'zod';

// Track sanitization stats
let inputsSanitized = 0;
let xssBlocked = 0;
let sqlInjectionBlocked = 0;

export function getSanitizationStats() {
  return { inputsSanitized, xssBlocked, sqlInjectionBlocked };
}

// Strip HTML tags from string input
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

// Sanitize a string for safe storage/display
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// Zod extension for sanitized strings
export const sanitizedString = z
  .string()
  .transform((val) => stripHtml(val))
  .refine((val) => val.length > 0, { message: 'Field cannot be empty after sanitization' });

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  inputsSanitized++;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Check for XSS attempts before stripping
      if (/<[^>]*>/.test(value)) {
        xssBlocked++;
      }
      // Check for SQL injection
      if (hasSqlInjection(value)) {
        sqlInjectionBlocked++;
      }
      result[key] = stripHtml(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? stripHtml(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

// SQL injection prevention - validate no SQL keywords in string
export function hasSqlInjection(input: string): boolean {
  const sqlPatterns =
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b.*\b(FROM|INTO|TABLE|WHERE|SET|VALUES)\b)/i;
  return sqlPatterns.test(input);
}

// Validate file upload safety
export function isSafeFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return allowedTypes.includes(ext);
}

export const SAFE_FILE_TYPES = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
];
