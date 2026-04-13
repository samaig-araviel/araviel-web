const MAX_DIMENSION = 1568;
const JPEG_QUALITY = 0.8;
const MAX_COMPRESSED_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

/**
 * Compress an image File using canvas-based resize + JPEG encoding.
 * Returns a lightweight object ready to send to the API.
 *
 * @param {File} file — browser File from <input type="file">
 * @returns {Promise<{ dataUri: string, mimeType: string, fileName: string }>}
 */
export async function compressImage(file) {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error(`Unsupported image type: ${file.type}`);
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = getScaledDimensions(bitmap.width, bitmap.height);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Encode as JPEG (smaller output, good quality).
  // For PNGs with transparency, JPEG will flatten to white — acceptable trade-off
  // for vision analysis where transparency is irrelevant.
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });

  if (blob.size > MAX_COMPRESSED_BYTES) {
    throw new Error('Image exceeds 2 MB after compression');
  }

  const dataUri = await blobToDataUri(blob);
  return {
    dataUri,
    mimeType: 'image/jpeg',
    fileName: file.name,
  };
}

/**
 * Check whether a file is an image type we accept for vision analysis.
 */
export function isAcceptedImageType(file) {
  return ACCEPTED_TYPES.has(file.type);
}

/**
 * Scale dimensions so neither exceeds MAX_DIMENSION, preserving aspect ratio.
 */
function getScaledDimensions(w, h) {
  if (w <= MAX_DIMENSION && h <= MAX_DIMENSION) return { width: w, height: h };
  const scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  };
}

/**
 * Convert a Blob to a data URI string.
 */
function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
