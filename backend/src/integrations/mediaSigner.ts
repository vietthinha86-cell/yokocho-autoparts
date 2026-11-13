import crypto from "node:crypto";

export interface SignedUploadRequest {
  filename: string;
  contentType: string;
  folder?: string;
}

export interface SignedUploadDescriptor {
  provider: "cloudinary" | "cloudflare-r2" | "local-sandbox";
  uploadUrl: string;
  publicUrl: string;
  method: "POST" | "PUT";
  fields?: Record<string, string>;
  optimization: {
    recommendedFormat: "webp" | "avif";
    maxWidthPx: number;
    maxFileSizeMb: number;
  };
}

function sanitizeFilename(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || `part-${Date.now()}.webp`;
}

export function createSignedMediaUpload(
  input: SignedUploadRequest,
): SignedUploadDescriptor {
  const safeName = sanitizeFilename(input.filename);
  const folder = (input.folder?.trim() || "akari-yokocho/parts").replace(/^\/+|\/+$/g, "");
  const isVideo = input.contentType.startsWith("video/");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const cloudApiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const cloudSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloudName && cloudApiKey && cloudSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const transformation = isVideo ? "q_auto" : "c_limit,w_1200,q_auto:good,f_webp";
    const toSign = `folder=${folder}&timestamp=${timestamp}&transformation=${transformation}${cloudSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    return {
      provider: "cloudinary",
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? "video" : "image"}/upload`,
      publicUrl: `https://res.cloudinary.com/${cloudName}/${isVideo ? "video" : "image"}/upload/${folder}/${safeName}`,
      method: "POST",
      fields: {
        api_key: cloudApiKey,
        timestamp: String(timestamp),
        folder,
        transformation,
        signature,
      },
      optimization: {
        recommendedFormat: "webp",
        maxWidthPx: 1200,
        maxFileSizeMb: isVideo ? 25 : 4,
      },
    };
  }

  const r2PublicBase = process.env.R2_PUBLIC_URL?.trim();
  const r2Endpoint = process.env.R2_UPLOAD_ENDPOINT?.trim();
  if (r2PublicBase && r2Endpoint) {
    const objectKey = `${folder}/${Date.now()}-${safeName}`;
    return {
      provider: "cloudflare-r2",
      uploadUrl: `${r2Endpoint.replace(/\/$/, "")}/${objectKey}`,
      publicUrl: `${r2PublicBase.replace(/\/$/, "")}/${objectKey}`,
      method: "PUT",
      optimization: {
        recommendedFormat: "webp",
        maxWidthPx: 1200,
        maxFileSizeMb: isVideo ? 25 : 4,
      },
    };
  }

  return {
    provider: "local-sandbox",
    uploadUrl: "/api/admin/media/local-mock",
    publicUrl: `/images/${safeName}`,
    method: "PUT",
    optimization: {
      recommendedFormat: "webp",
      maxWidthPx: 1200,
      maxFileSizeMb: isVideo ? 25 : 4,
    },
  };
}

