export interface Photo {
  file: File;
  name: string;
  width: number;
  height: number;
  preview: ImageData;
  url: string;
}
export async function decode(file: File): Promise<Photo> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPEG, PNG or WebP image.");
  if (file.size > 80 * 1024 * 1024)
    throw new Error(
      "This file is too large. Choose an image smaller than 80 MB.",
    );
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "This image could not be decoded. Try another JPEG, PNG or WebP file.",
    );
  }
  try {
    if (bitmap.width * bitmap.height > 50000000)
      throw new Error(
        "Choose a photo under 50 megapixels for reliable editing on this device.",
      );
    const scale = Math.min(1, 1440 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const preview = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) =>
        b ? resolve(b) : reject(new Error("Could not create preview.")),
      ),
    );
    return {
      file,
      name: file.name,
      width: bitmap.width,
      height: bitmap.height,
      preview,
      url: URL.createObjectURL(blob),
    };
  } finally {
    bitmap.close();
  }
}
