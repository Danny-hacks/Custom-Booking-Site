import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Where uploaded images (property photos, offer pictures) are stored. One function, swappable backend:
 *  - BLOB_READ_WRITE_TOKEN set  -> Vercel Blob (public URLs)
 *  - otherwise                  -> local folder public/uploads (development)
 * Moving to Google Cloud Storage later means adding a third branch here (upload with @google-cloud/storage and
 * return the public object URL); nothing else in the app touches storage directly.
 */
const ALLOWED = /^image\/(jpeg|png|webp|avif)$/;
const MAX_BYTES = 12_000_000;

export async function saveImage(folder: string, file: File): Promise<string | null> {
  if (!file.size || !ALLOWED.test(file.type) || file.size > MAX_BYTES) return null;
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${name}`, file, { access: "public", addRandomSuffix: false });
    return blob.url;
  }
  if (process.env.VERCEL) {
    throw new Error("Image uploads need file storage. In Vercel, add a Blob store to this project (Storage tab) and redeploy.");
  }
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${name}`;
}
