"use client";

export const MAX_IMAGE_WIDTH = 2000; // owner decision
const JPEG_QUALITY = 0.85;

/**
 * Shrinks a photo to at most 2000px wide and re-encodes it as JPEG in the
 * browser, so uploads from an iPhone are fast and small. Also fixes rotation
 * (createImageBitmap applies the photo's EXIF orientation).
 */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not a photo.`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`Couldn't read ${file.name}. Try a JPG or PNG photo.`);
  }

  const scale = Math.min(1, MAX_IMAGE_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser can't process photos.");

  // White background so transparent PNGs don't turn black as JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error(`Couldn't compress ${file.name}.`);
  return blob;
}
