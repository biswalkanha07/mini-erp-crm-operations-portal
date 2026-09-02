export interface NutritionValue {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface Catalogue {
  _id?: string;
  itemId: string;
  sku: string;
  itemName: string;
  categoryId: string;
  volumeOfMeasurement: string;
  sourceOfOrigin?: string;
  nutritionValue?: NutritionValue;
  certification?: string;
  cutType?: string; // Halal, Jhatka, Kosher, Standard Commercial, Free-range
  certificationImage?: string; // base64 data URL or URL
  price: number;
  stock: number;
  barcode?: string;
  status: 'active' | 'inactive';
  // Legacy single image
  image?: string;
  // New multi-image support
  images?: string[];
  thumbnail?: string;
  instructions?: string;
  expiry?: string;
  gstRate?: number;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}
