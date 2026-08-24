/**
 * High-performance client-side image compression utility.
 * Compresses large mobile/desktop photos (e.g. 5-15 MB camera shots)
 * down to crisp ~40-100 KB files suitable for fast storage and instant loading.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetMaxKb?: number;
  mimeType?: string;
}

export interface CompressedImageResult {
  dataUrl: string;
  sizeBytes: number;
  sizeKb: number;
  originalSizeBytes: number;
  originalSizeKb: number;
  reductionPercentage: number;
  width: number;
  height: number;
  fileName: string;
}

/**
 * Compresses an image file directly in the browser using HTML5 Canvas.
 */
export const compressImageFile = async (
  file: File | Blob,
  fileName: string = 'document.jpg',
  options: CompressionOptions = {}
): Promise<CompressedImageResult> => {
  const {
    maxWidth = 900,
    maxHeight = 900,
    quality = 0.68,
    mimeType = 'image/jpeg',
  } = options;

  const originalSizeBytes = file.size;
  const originalSizeKb = Math.round(originalSizeBytes / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to decode image'));

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio-preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          reject(new Error('Unable to create canvas rendering context'));
          return;
        }

        // Fill background white in case of transparent PNG converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Render resized image
        ctx.drawImage(img, 0, 0, width, height);

        // First compression pass
        let compressedDataUrl = canvas.toDataURL(mimeType, quality);
        let approximateBytes = Math.round((compressedDataUrl.length * 3) / 4);

        // If targetMaxKb was specified and result is still too large, reduce quality adaptively
        if (options.targetMaxKb && approximateBytes > options.targetMaxKb * 1024) {
          compressedDataUrl = canvas.toDataURL(mimeType, Math.max(0.5, quality - 0.2));
          approximateBytes = Math.round((compressedDataUrl.length * 3) / 4);
        }

        const sizeBytes = approximateBytes;
        const sizeKb = Math.round(sizeBytes / 1024);
        const reductionPercentage = Math.max(
          0,
          Math.round(((originalSizeBytes - sizeBytes) / (originalSizeBytes || 1)) * 100)
        );

        resolve({
          dataUrl: compressedDataUrl,
          sizeBytes,
          sizeKb,
          originalSizeBytes,
          originalSizeKb,
          reductionPercentage,
          width,
          height,
          fileName,
        });
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Format bytes into human-readable string (e.g. 65 KB, 1.2 MB)
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
