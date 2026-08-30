import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary is configured from the CLOUDINARY_URL env var
 * (cloudinary://<api_key>:<api_secret>@<cloud_name>). The SDK reads it
 * automatically, but we call config() explicitly so it also works when the
 * value is provided through other means.
 */
let configured = false;

function ensureConfigured() {
  if (configured) return;
  const url = process.env.CLOUDINARY_URL;
  if (!url) throw new Error("CLOUDINARY_URL is not configured");
  // Passing the URL lets the SDK parse cloud name / key / secret for us.
  cloudinary.config({ secure: true });
  configured = true;
}

export const CLOUDINARY_ENABLED = Boolean(process.env.CLOUDINARY_URL);

export const PAYMENT_PROOF_FOLDER = "esim4u/payment-proofs";

export interface UploadedImage {
  url: string;
  publicId: string;
}

/**
 * Uploads a single image (provided as a data URI or remote/base64 string) to
 * Cloudinary under the given folder and returns the delivery URL + public id.
 */
export async function uploadImage(dataUri: string, folder: string): Promise<UploadedImage> {
  ensureConfigured();
  const res = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
    // Guard against non-image payloads slipping through.
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  });
  return { url: res.secure_url, publicId: res.public_id };
}

export async function uploadPaymentProofs(dataUris: string[]): Promise<UploadedImage[]> {
  const uploads = dataUris.map((uri) => uploadImage(uri, PAYMENT_PROOF_FOLDER));
  return Promise.all(uploads);
}

export const SUPPORT_ATTACHMENT_FOLDER = "esim4u/support";

export interface UploadedAttachment {
  url: string;
  publicId: string;
  /** "image" | "video" | "raw" (documents, etc.) */
  resourceType: string;
  format: string | null;
  bytes: number;
  name: string;
}

interface AttachmentInput {
  /** data URI or base64 string of the file */
  dataUri: string;
  /** original filename from the browser (used for display + raw delivery) */
  name?: string;
}

/**
 * Uploads a support attachment of any browser-safe type (image, video, pdf,
 * doc, etc.) to Cloudinary. Uses `resource_type: "auto"` so non-image files are
 * accepted, and preserves the original filename for downloads.
 */
export async function uploadSupportAttachment(input: AttachmentInput): Promise<UploadedAttachment> {
  ensureConfigured();
  const filename = (input.name || "attachment").replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const res = await cloudinary.uploader.upload(input.dataUri, {
    folder: SUPPORT_ATTACHMENT_FOLDER,
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
    filename_override: filename,
  });
  return {
    url: res.secure_url,
    publicId: res.public_id,
    resourceType: res.resource_type || "raw",
    format: res.format || null,
    bytes: res.bytes || 0,
    name: input.name || res.original_filename || filename,
  };
}

export async function uploadSupportAttachments(inputs: AttachmentInput[]): Promise<UploadedAttachment[]> {
  return Promise.all(inputs.map((i) => uploadSupportAttachment(i)));
}

/**
 * Deletes previously-uploaded assets from Cloudinary. Best-effort — a single
 * failure never rejects the batch (used by chat retention cleanup). The
 * resourceType must match how the asset was uploaded ("image"|"video"|"raw").
 */
export async function deleteCloudinaryAssets(
  assets: { publicId: string; resourceType?: string }[]
): Promise<void> {
  if (!CLOUDINARY_ENABLED || assets.length === 0) return;
  ensureConfigured();
  await Promise.all(
    assets
      .filter((a) => a.publicId)
      .map((a) =>
        cloudinary.uploader
          .destroy(a.publicId, { resource_type: a.resourceType || "image", invalidate: true })
          .catch(() => {})
      )
  );
}
