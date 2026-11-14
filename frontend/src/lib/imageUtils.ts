/**
 * Compresses an uploaded browser File into a compact JPEG data URL using an HTML canvas
 * so Vision AI requests and real vehicle installation review photos stay fast and lightweight.
 */
export async function compressImageFileToDataUrl(
  file: File,
  maxDim = 760,
  quality = 0.82,
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Read failed"));
    reader.onload = () => {
      const img = document.createElement("img");
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            dataUrl: String(reader.result),
            mimeType: file.type || "image/jpeg",
          });
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", quality),
          mimeType: "image/jpeg",
        });
      };
      img.onerror = () =>
        resolve({
          dataUrl: String(reader.result),
          mimeType: file.type || "image/jpeg",
        });
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

