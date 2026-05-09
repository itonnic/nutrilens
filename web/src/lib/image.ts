/**
 * Client-side image compression for meal photos.
 *
 * - Down-scales the longest side to `maxDim` (default 1920) keeping aspect ratio.
 * - Re-encodes to JPEG at the given quality.
 * - If the result is bigger than the source (small image), returns the original.
 * - HEIC/HEIF on iOS isn't decodable in canvas — those are passed through unchanged.
 */
export async function compressImage(
  file: File,
  opts: { maxDim?: number; quality?: number } = {},
): Promise<File> {
  const maxDim = opts.maxDim ?? 1920;
  const quality = opts.quality ?? 0.86;

  if (typeof window === 'undefined' || !('createImageBitmap' in window)) {
    return file;
  }
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    return file;
  }
  if (!file.type.startsWith('image/')) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > maxDim ? maxDim / longest : 1;
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close?.();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) return file;

  // If compression actually grew the file, keep the original.
  if (blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

/** Read the first image File from a clipboard paste event. */
export function pickImageFromClipboard(items: DataTransferItemList): File | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file && file.type.startsWith('image/')) return file;
    }
  }
  return null;
}
