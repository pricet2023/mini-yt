import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "eu-west-1", // MinIO ignores but required
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // required for MinIO
});

export function getBucketAndKey(s3url: string): { bucket: string; key: string } {
    try {
        const url = new URL(s3url);

        // Remove leading slash from pathname
        const parts = url.pathname.replace(/^\/+/, "").split("/");

        if (parts.length < 2) {
            throw new Error(`Invalid S3 URL: ${s3url}`);
        }

        const bucket = parts.shift()!; // first part = bucket
        const key = parts.join("/");   // rest = object key

        return { bucket, key };
    } catch (err) {
        throw new Error(`Could not parse S3 URL: ${s3url} (${err})`);
    }
}