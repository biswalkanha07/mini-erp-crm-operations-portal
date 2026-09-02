
import { catalogueAPI } from '../../../api';
import { compressImage } from '../../../utils/imageCompression';
// Search and filter catalogues (backend-driven)
export const searchCatalogues = (params?: {
  search?: string;
  status?: string;
  minVolume?: string | number;
  maxVolume?: string | number;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  lowStock?: boolean | string;
  warehouseLocation?: string;
  sortBy?: string;
  sortOrder?: number;
  categoryId?: string;
}) => {
  return catalogueAPI.search(params || {});
};

export const getCatalogues = (params?: { search?: string; categoryId?: string; lowStock?: boolean | string; warehouseLocation?: string; page?: number; limit?: number }) => {
  return catalogueAPI.getAll({ params });
};
export const getCatalogueById = (id: string) => catalogueAPI.getById(id);
export const createCatalogue = (data: any) => catalogueAPI.create(data);
export const updateCatalogue = (id: string, data: any) => catalogueAPI.update(id, data);
export const deleteCatalogue = (id: string) => catalogueAPI.delete(id);
export const getCatalogueBySKU = (sku: string) => catalogueAPI.getBySKU(sku);
export const getCatalogueByBarcode = (barcode: string) => catalogueAPI.getByBarcode(barcode);

// File upload methods
// Deprecated: file-upload endpoints removed in favor of base64 JSON payloads

// Helper function to create FormData for file uploads
export const buildFormData = (formData: any, imageFile?: File, thumbnailFile?: File) => {
  const data = new FormData();
  
  // Add all form fields
  Object.keys(formData).forEach(key => {
    if (formData[key] !== null && formData[key] !== undefined) {
      if (typeof formData[key] === 'object') {
        data.append(key, JSON.stringify(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    }
  });
  
  // Add image files if present
  if (imageFile) {
    data.append('image', imageFile);
  }
  if (thumbnailFile) {
    data.append('thumbnail', thumbnailFile);
  }
  
  return data;
};

// Helper to convert File to compressed base64 data URL (100KB max)
export const fileToBase64 = async (file: File): Promise<string> => {
  try {
    // console.log(`Compressing image: ${file.name}, original size: ${(file.size / 1024).toFixed(2)}KB`);
    const compressedBase64 = await compressImage(file, 100);
    // console.log(`Compressed image size: ${(compressedBase64.length * 0.75 / 1024).toFixed(2)}KB`);
    return compressedBase64;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Fallback to original fileToBase64 if compression fails
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
