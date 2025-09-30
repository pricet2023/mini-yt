import { NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UploadPartCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
  const { key, uploadId, partNumber } = await req.json();

  console.log("getting presigned url");
  const command = new UploadPartCommand({
    Bucket: process.env.MINIO_BUCKET!,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  console.log("got pre-signed url");


  return NextResponse.json({ url });
}