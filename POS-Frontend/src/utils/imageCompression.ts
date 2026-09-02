/**
 * Compresses an image file to a target size (in KB)
 * @param file - The image file to compress
 * @param targetSizeKB - Target size in KB (default: 100)
 * @param quality - Initial quality (default: 0.8)
 * @returns Promise<string> - Base64 string of compressed image
 */
export const compressImage = async (
  file: File, 
  targetSizeKB: number = 100, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const maxWidth = 800;
      const maxHeight = 600;
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      const compressToTargetSize = (currentQuality: number): void => {
        const dataURL = canvas.toDataURL('image/jpeg', currentQuality);
        const sizeKB = (dataURL.length * 0.75) / 1024; // Approximate size calculation

        if (sizeKB <= targetSizeKB || currentQuality <= 0.1) {
          resolve(dataURL);
        } else {
          // Reduce quality and try again
          compressToTargetSize(currentQuality - 0.1);
        }
      };

      compressToTargetSize(quality);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Gets the file size in KB
 * @param file - The file to check
 * @returns number - File size in KB
 */
export const getFileSizeKB = (file: File): number => {
  return file.size / 1024;
};

/**
 * Checks if a file is an image
 * @param file - The file to check
 * @returns boolean - True if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};
