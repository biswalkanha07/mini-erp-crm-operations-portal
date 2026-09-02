import JsBarcode from 'jsbarcode';

export interface BarcodeData {
  sku: string;
  price: number;
  weight: string; // e.g., "500gm", "1kg", "2pieces"
}

/**
 * Generates a barcode number from SKU, price, and weight
 * Format: 12 or 16 digits
 * Structure: [SKU_PADDED][PRICE_PADDED][WEIGHT_ENCODED][CHECKSUM]
 */
export const generateBarcodeNumber = (data: BarcodeData): string => {
  const { sku, price, weight } = data;
  
  // Extract numeric part from weight (e.g., "500gm" -> "500")
  const weightMatch = weight.match(/(\d+(?:\.\d+)?)/);
  const weightValue = weightMatch ? weightMatch[1] : "0";
  
  // Pad SKU to 4 digits (convert to numeric hash if contains letters)
  let skuNumeric: string;
  if (/^\d+$/.test(sku)) {
    // SKU is purely numeric
    skuNumeric = sku.padStart(4, '0').slice(-4);
  } else {
    // SKU contains letters, create a numeric hash
    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
      const char = sku.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    skuNumeric = Math.abs(hash).toString().padStart(4, '0').slice(-4);
  }
  
  // Pad price to 4 digits (assuming price is in rupees, max 9999)
  const pricePadded = Math.floor(price).toString().padStart(4, '0').slice(-4);
  
  // Pad weight to 3 digits
  const weightPadded = weightValue.padStart(3, '0').slice(-3);
  
  // Create base number (11 digits for 12-digit barcode, 15 for 16-digit)
  const baseNumber = skuNumeric + pricePadded + weightPadded;
  
  // Calculate checksum using Luhn algorithm
  const checksum = calculateLuhnChecksum(baseNumber);
  
  // Return 12-digit barcode
  return baseNumber + checksum;
};

/**
 * Generate 16-digit barcode for more complex data
 */
export const generateLongBarcodeNumber = (data: BarcodeData): string => {
  const { sku, price, weight } = data;
  
  // Extract numeric part from weight
  const weightMatch = weight.match(/(\d+(?:\.\d+)?)/);
  const weightValue = weightMatch ? weightMatch[1] : "0";
  
  // Pad SKU to 6 digits (convert to numeric hash if contains letters)
  let skuNumeric: string;
  if (/^\d+$/.test(sku)) {
    // SKU is purely numeric
    skuNumeric = sku.padStart(6, '0').slice(-6);
  } else {
    // SKU contains letters, create a numeric hash
    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
      const char = sku.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    skuNumeric = Math.abs(hash).toString().padStart(6, '0').slice(-6);
  }
  
  // Pad price to 6 digits (max 999999)
  const pricePadded = Math.floor(price).toString().padStart(6, '0').slice(-6);
  
  // Pad weight to 3 digits
  const weightPadded = weightValue.padStart(3, '0').slice(-3);
  
  // Create base number (15 digits)
  const baseNumber = skuNumeric + pricePadded + weightPadded;
  
  // Calculate checksum
  const checksum = calculateLuhnChecksum(baseNumber);
  
  // Return 16-digit barcode
  return baseNumber + checksum;
};

/**
 * Calculate Luhn checksum for barcode validation
 */
const calculateLuhnChecksum = (number: string): string => {
  let sum = 0;
  let isEven = false;
  
  // Process digits from right to left
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return ((10 - (sum % 10)) % 10).toString();
};

/**
 * Generate barcode image as data URL
 */
export const generateBarcodeImage = (barcodeNumber: string, options?: {
  width?: number;
  height?: number;
  format?: 'CODE128' | 'EAN13' | 'EAN8';
}): string => {
  const canvas = document.createElement('canvas');
  const format = options?.format || 'CODE128';
  
  try {
    JsBarcode(canvas, barcodeNumber, {
      format: format,
      width: options?.width || 2,
      height: options?.height || 100,
      displayValue: true,
      fontSize: 12,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000'
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode:', error);
    return '';
  }
};

/**
 * Parse barcode number back to original data
 */
export const parseBarcodeNumber = (barcodeNumber: string): BarcodeData | null => {
  if (barcodeNumber.length === 12) {
    // 12-digit format: [SKU(4)][PRICE(4)][WEIGHT(3)][CHECKSUM(1)]
    const sku = barcodeNumber.slice(0, 4).replace(/^0+/, '') || '0';
    const price = parseInt(barcodeNumber.slice(4, 8));
    const weight = barcodeNumber.slice(8, 11).replace(/^0+/, '') || '0';
    
    return {
      sku,
      price,
      weight: weight + 'gm' // Default unit
    };
  } else if (barcodeNumber.length === 16) {
    // 16-digit format: [SKU(6)][PRICE(6)][WEIGHT(3)][CHECKSUM(1)]
    const sku = barcodeNumber.slice(0, 6).replace(/^0+/, '') || '0';
    const price = parseInt(barcodeNumber.slice(6, 12));
    const weight = barcodeNumber.slice(12, 15).replace(/^0+/, '') || '0';
    
    return {
      sku,
      price,
      weight: weight + 'gm' // Default unit
    };
  }
  
  return null;
};

/**
 * Validate barcode using Luhn algorithm
 */
export const validateBarcode = (barcodeNumber: string): boolean => {
  if (barcodeNumber.length !== 12 && barcodeNumber.length !== 16) {
    return false;
  }
  
  const baseNumber = barcodeNumber.slice(0, -1);
  const providedChecksum = barcodeNumber.slice(-1);
  const calculatedChecksum = calculateLuhnChecksum(baseNumber);
  
  return providedChecksum === calculatedChecksum;
};
