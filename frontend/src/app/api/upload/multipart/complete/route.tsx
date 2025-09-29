import { NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { Client as ESClient } from "@elastic/elasticsearch";

const prisma = new PrismaClient();
const es = new ESClient({ node: "http://localhost:9200" });

export async function POST(req: Request) {
  const { key, uploadId, parts, videoId } = await req.json();

  const command = new CompleteMultipartUploadCommand({
    Bucket: process.env.MINIO_BUCKET!,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts, // [{ ETag, PartNumber }]
    },
  });

  const response = await s3.send(command);
    
  // Update Postgres: mark as complete
  const video = await prisma.video.update({
    where: { id: videoId },
    data: { status: "complete"},
  });

  // Update Elasticsearch: mark as complete
  await es.update({
    index: "videos",
    id: videoId.toString(),
    doc: { status: "complete" },
  });


  return NextResponse.json({
    s3: response,
    video,
    });
}