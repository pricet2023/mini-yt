import { NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { Client } from "@elastic/elasticsearch";

const prisma = new PrismaClient();
const es = new Client({ node: "http://localhost:9200" });

export async function POST(req: Request) {
  const formData = await req.json();
  const title = formData.get("title") as string;
  const filename = formData.get("filename") as string;
  const description = formData.get("description") as string;
  const s3key = `${Date.now()}-${filename}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: process.env.MINIO_BUCKET!,
    Key: s3key,
    ContentType: "video/mp4",
  });

  const response = await s3.send(command);

  // Save metadata in Postgres
  const s3urlPrefix = process.env.MINIO_HOST === "" ? "s3://" : "http://" + process.env.MINIO_HOST + "/";
  const s3url = s3urlPrefix + process.env.MINIO_BUCKET + "/" + s3key;
  const video = await prisma.video.create({
    data: { title, description, s3url, status: "uploading" },
  });

  // Index in Elasticsearch
  await es.index({
    index: "videos",
    id: video.id.toString(),
    document: {
      id: video.id,
      title: video.title,
      description: video.description,
      s3url: video.s3url,
      uploadedAt: video.uploadedAt,
      status: video.status
    },
  });

  return NextResponse.json({
    uploadId: response.UploadId,
    s3key: s3key,
    video,
  });
}