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
