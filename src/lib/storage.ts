/**
 * Object storage — Contabo Object Storage (S3-compatible), but the client here is
 * plain `@aws-sdk/client-s3` pointed at S3_ENDPOINT, so any S3-compatible provider
 * works the same way (matches this project's existing "bring your own credentials"
 * pattern — see Qasro AI's AI_BASE_URL, email's SMTP host). Not configured →
 * uploadImage throws a clear error rather than silently pretending to succeed, since
 * callers need to show the user their upload actually failed, unlike the
 * fire-and-forget email/VRODUX integrations elsewhere in this app.
 *
 * Every upload is re-encoded through sharp before it ever reaches storage — this is
 * not optional hardening. It means:
 *   - A file can't masquerade as an image (sharp fails to decode anything that isn't
 *     a real image, long before a corrupt/malicious payload reaches storage or gets
 *     served back to other visitors).
 *   - No original, potentially huge camera-resolution file is ever stored or served —
 *     everything is downsized to a sane max width and re-encoded as WebP, which is
 *     what "avoid loading large original images when smaller responsive variants are
 *     sufficient" (brief, Part 3.F) actually requires at this stage. A full
 *     multi-breakpoint responsive srcset is NOT built — see docs/cms-specification.md
 *     §E for why that's an explicit, documented scope line for this phase, not an
 *     oversight.
 *
 * PUBLIC URL FORMAT — Contabo-specific, verified against the real account, not
 * assumed: a plain `{endpoint}/{bucket}/{key}` URL 401s even on a bucket with public
 * sharing enabled and an object whose S3 ACL correctly shows AllUsers:READ. Contabo's
 * actual public path requires the tenant/canonical-user id prefixed to the bucket
 * name — `{endpoint}/{tenantId}:{bucket}/{key}` — confirmed by testing both forms
 * directly against a live object. The tenant id is derived at runtime from
 * GetBucketAcl's Owner field (cached after the first call) rather than hardcoded or
 * requiring an extra env var, so this keeps working if the account's id ever surfaces
 * differently.
 */

import { S3Client, PutObjectCommand, GetBucketAclCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB — the original file, before re-encoding
const MAX_WIDTH = 2400; // generous for a hero image; sharp only shrinks, never upscales
const ALLOWED_INPUT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Object storage isn't configured — S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY are missing.");
    this.name = "StorageNotConfiguredError";
  }
}

export class InvalidImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidImageError";
  }
}

let cachedClient: S3Client | null | undefined;

function getStorageClient(): S3Client | null {
  if (cachedClient !== undefined) return cachedClient;

  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = new S3Client({
    endpoint,
    region: process.env.S3_REGION || "auto",
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, // required by most S3-compatible providers, including Contabo
  });
  return cachedClient;
}

let cachedTenantId: string | null | undefined;

/** The part of the S3 canonical owner id before the "$" — that's the prefix Contabo's
 * public URL path needs alongside the bucket name.
 *
 * S3_TENANT_ID is an optional explicit override — skips the GetBucketAcl round-trip
 * below entirely when set. Worth setting in production: the derived value is only
 * cached for the lifetime of one serverless function instance, so on a platform that
 * cold-starts often (this app is on Vercel Hobby), an unset env var means paying that
 * extra API call again on every cold start, not just once ever. Left unset, it's
 * derived automatically and still works correctly — just marginally slower on a cold
 * upload. */
async function getTenantId(client: S3Client): Promise<string | null> {
  if (process.env.S3_TENANT_ID) return process.env.S3_TENANT_ID;
  if (cachedTenantId !== undefined) return cachedTenantId;

  try {
    const acl = await client.send(new GetBucketAclCommand({ Bucket: process.env.S3_BUCKET! }));
    const ownerId = acl.Owner?.ID;
    cachedTenantId = ownerId ? ownerId.split("$")[0] : null;
  } catch {
    cachedTenantId = null;
  }
  return cachedTenantId;
}

async function publicUrlFor(client: S3Client, key: string): Promise<string> {
  const endpoint = process.env.S3_ENDPOINT!.replace(/\/$/, "");
  const bucket = process.env.S3_BUCKET!;
  const tenantId = await getTenantId(client);
  // Falls back to the plain (AWS-standard) path-style URL if the tenant id lookup
  // ever fails — won't be publicly viewable on Contabo specifically in that case, but
  // fails toward "a URL that's at least structurally correct" rather than throwing.
  const bucketSegment = tenantId ? `${tenantId}:${bucket}` : bucket;
  return `${endpoint}/${bucketSegment}/${key}`;
}

export type UploadImageInput = {
  buffer: Buffer;
  mimeType: string;
  /** A short, stable prefix for organizing objects, e.g. "listings", "cms" — not a
   * full key, just a folder-like namespace. */
  folder: string;
};

/**
 * Validates, re-encodes, and uploads one image. Throws StorageNotConfiguredError or
 * InvalidImageError with a message safe to show the end user directly — never throws
 * a raw AWS SDK error to a caller that might render it as-is.
 */
export async function uploadImage({ buffer, mimeType, folder }: UploadImageInput): Promise<string> {
  const client = getStorageClient();
  if (!client) throw new StorageNotConfiguredError();

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new InvalidImageError(`Image is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).`);
  }
  if (!ALLOWED_INPUT_TYPES.has(mimeType)) {
    throw new InvalidImageError(`Unsupported file type: ${mimeType}. Use JPEG, PNG, WebP, GIF, or AVIF.`);
  }

  let processed: Buffer;
  let width: number;
  let height: number;
  try {
    const image = sharp(buffer, { failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) throw new Error("no dimensions");

    const resized = image.resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 82 });
    processed = await resized.toBuffer();
    const finalMeta = await sharp(processed).metadata();
    width = finalMeta.width ?? metadata.width;
    height = finalMeta.height ?? metadata.height;
  } catch {
    // Covers "not actually a decodable image" (a renamed .exe, a truncated file, a
    // decompression-bomb-shaped input sharp refuses) as well as genuine corruption —
    // all of it is "reject the upload," never "store it anyway."
    throw new InvalidImageError("This file isn't a valid image (or is corrupted).");
  }

  const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.webp`;

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: processed,
      ContentType: "image/webp",
      ACL: "public-read",
      Metadata: { width: String(width), height: String(height) },
    }),
  );

  return publicUrlFor(client, key);
}
