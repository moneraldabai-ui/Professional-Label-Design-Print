/**
 * Supported barcode types and their configurations
 */

export type BarcodeType =
  | 'code128'
  | 'qrcode'
  | 'datamatrix'
  | 'pdf417'
  | 'ean13'
  | 'upca'
  | 'code39'

export interface BarcodeConfig {
  type: BarcodeType
  label: string
  description: string
  // bwip-js encoder name
  bcid: string
  // Validation
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  patternDescription?: string
  // Display
  includeText?: boolean
  textSize?: number
  scale?: number
  height?: number
}

export const BARCODE_CONFIGS: Record<BarcodeType, BarcodeConfig> = {
  code128: {
    type: 'code128',
    label: 'Code 128',
    description: 'General-purpose barcode for alphanumeric data',
    bcid: 'code128',
    minLength: 1,
    maxLength: 80,
    includeText: true,
    textSize: 10,
    scale: 2,
    height: 10,
  },
  qrcode: {
    type: 'qrcode',
    label: 'QR Code',
    description: '2D barcode that can store URLs, text, or data',
    bcid: 'qrcode',
    minLength: 1,
    maxLength: 2953,
    includeText: false,
    scale: 3,
  },
  datamatrix: {
    type: 'datamatrix',
    label: 'Data Matrix',
    description: 'Compact 2D barcode for small items',
    bcid: 'datamatrix',
    minLength: 1,
    maxLength: 2335,
    includeText: false,
    scale: 3,
  },
  pdf417: {
    type: 'pdf417',
    label: 'PDF417',
    description: 'Stacked barcode for IDs and documents',
    bcid: 'pdf417',
    minLength: 1,
    maxLength: 1850,
    includeText: false,
    scale: 2,
  },
  ean13: {
    type: 'ean13',
    label: 'EAN-13',
    description: 'European retail barcode (12 digits + check digit)',
    bcid: 'ean13',
    minLength: 12,
    maxLength: 12,
    pattern: /^\d{12}$/,
    patternDescription: 'Exactly 12 digits (check digit auto-calculated)',
    includeText: true,
    textSize: 10,
    scale: 2,
    height: 15,
  },
  upca: {
    type: 'upca',
    label: 'UPC-A',
    description: 'US/Canada retail barcode (11 digits + check digit)',
    bcid: 'upca',
    minLength: 11,
    maxLength: 11,
    pattern: /^\d{11}$/,
    patternDescription: 'Exactly 11 digits (check digit auto-calculated)',
    includeText: true,
    textSize: 10,
    scale: 2,
    height: 15,
  },
  code39: {
    type: 'code39',
    label: 'Code 39',
    description: 'Alphanumeric barcode (A-Z, 0-9, special chars)',
    bcid: 'code39',
    minLength: 1,
    maxLength: 43,
    pattern: /^[A-Z0-9\-. $/+%]*$/,
    patternDescription: 'Uppercase letters, digits, and - . $ / + % space',
    includeText: true,
    textSize: 10,
    scale: 2,
    height: 10,
  },
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate barcode data against its type requirements
 */
export function validateBarcodeData(
  data: string,
  type: BarcodeType
): ValidationResult {
  const config = BARCODE_CONFIGS[type]

  if (!config) {
    return { valid: false, error: `Unknown barcode type: ${type}` }
  }

  if (!data || data.trim() === '') {
    return { valid: false, error: 'Enter barcode data' }
  }

  const trimmed = data.trim()

  // Length validation
  if (config.minLength && trimmed.length < config.minLength) {
    if (config.minLength === config.maxLength) {
      return {
        valid: false,
        error: `Requires exactly ${config.minLength} characters (currently ${trimmed.length})`,
      }
    }
    return {
      valid: false,
      error: `Minimum ${config.minLength} characters required (currently ${trimmed.length})`,
    }
  }

  if (config.maxLength && trimmed.length > config.maxLength) {
    return {
      valid: false,
      error: `Maximum ${config.maxLength} characters allowed (currently ${trimmed.length})`,
    }
  }

  // Pattern validation
  if (config.pattern && !config.pattern.test(trimmed)) {
    return {
      valid: false,
      error: config.patternDescription || 'Invalid format',
    }
  }

  return { valid: true }
}

/**
 * Get barcode types suitable for a specific use case
 */
export function getBarcodeTypesForCategory(
  category: 'general' | 'retail' | '2d'
): BarcodeType[] {
  switch (category) {
    case 'general':
      return ['code128', 'code39', 'qrcode']
    case 'retail':
      return ['ean13', 'upca', 'code128']
    case '2d':
      return ['qrcode', 'datamatrix', 'pdf417']
    default:
      return ['code128', 'qrcode', 'datamatrix']
  }
}
