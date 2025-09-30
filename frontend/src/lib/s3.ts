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