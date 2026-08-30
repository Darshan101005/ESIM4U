import { CLOUDINARY_ENABLED, uploadSupportAttachments } from "@/lib/cloudinary";
import type { Attachment } from "@/lib/support";

export const MAX_SUPPORT_ATTACHMENTS = 5;

/**
 * Uploads incoming attachment inputs ({ dataUri, name }[]) to Cloudinary and
 * returns the stored Attachment[] shape. Shared by chat + ticket routes.
 */
export async function resolveIncomingAttachments(raw: unknown): Promise<Attachment[]> {
  const list = Array.isArray(raw) ? raw : [];
  if (list.length === 0) return [];
  if (!CLOUDINARY_ENABLED) throw new Error("Attachments are not configured");
  const inputs = list
    .slice(0, MAX_SUPPORT_ATTACHMENTS)
    .filter((a) => a && typeof a.dataUri === "string")
    .map((a) => ({ dataUri: a.dataUri as string, name: typeof a.name === "string" ? a.name : undefined }));
  if (inputs.length === 0) return [];
  const uploaded = await uploadSupportAttachments(inputs);
  return uploaded.map((u) => ({ url: u.url, name: u.name, type: u.resourceType, size: u.bytes, publicId: u.publicId }));
}
