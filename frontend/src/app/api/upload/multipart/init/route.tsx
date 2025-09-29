import { NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
  const { filename, contentType } = await req.json();
  const key = `${Date.now()}-${filename}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: process.env.MINIO_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  const response = await s3.send(command);

  return NextResponse.json({
    uploadId: response.UploadId,
    key,
  });
}