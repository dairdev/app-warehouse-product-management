/**
 * Image processing and compression utilities for construction catalog & machinery.
 * Automatically resizes and compresses user uploads to prevent localStorage QuotaExceededError.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
  maxSizeBytes?: number;
}

export interface CompressedImageResult {
  dataUrl: string;
  file: File;
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

/**
 * Resizes and compresses an image in-browser using HTML5 Canvas.
 * Reduces 1MB - 15MB photos down to ~30KB - 80KB optimized JPEG.
 */
export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1000,
    maxHeight = 800,
    quality = 0.75,
    mimeType = 'image/jpeg',
    maxSizeBytes = 80 * 1024, // 80 KB
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved scaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('No se pudo inicializar el lienzo gráfico para procesar la imagen');
        }

        // Fill background with white (prevents transparent PNG turning black in JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let dataUrl = canvas.toDataURL(mimeType, currentQuality);

        // Iteratively lower quality if still above target size threshold
        let attempts = 0;
        // Data URL characters are ~1.37x raw byte size
        while (dataUrl.length > maxSizeBytes * 1.37 && currentQuality > 0.35 && attempts < 5) {
          currentQuality -= 0.1;
          attempts++;
          dataUrl = canvas.toDataURL(mimeType, Math.max(currentQuality, 0.35));
        }

        // Convert dataUrl to Blob and File so it can be uploaded directly to server
        const parts = dataUrl.split(',');
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });

        const baseFileName = file.name.substring(0, file.name.lastIndexOf('.')) || 'foto';
        const compressedFile = new File([blob], `${baseFileName}.jpg`, {
          type: mimeType,
          lastModified: Date.now(),
        });

        resolve({
          dataUrl,
          file: compressedFile,
          blob,
          width,
          height,
          originalSize: file.size,
          compressedSize: blob.size,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo decodificar o cargar la imagen seleccionada'));
    };

    img.src = objectUrl;
  });
}
