import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { Client } from "@elastic/elasticsearch";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const prisma = new PrismaClient();
const es = new Client({ node: "http://localhost:9200" });
const s3Client = new S3Client({
  region: "eu-west-1",
  endpoint: "http://localhost:9000",
  credentials: {
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin",
  },
  forcePathStyle: true,
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Write tmp file locally
  // const bytes = await file.arrayBuffer();
  // const buffer = Buffer.from(bytes);
  // const uploadDir = path.join(process.cwd(), "uploads");
  const filename = `${Date.now()}-${file.name}`;
  // const filePath = path.join(uploadDir, filename);
  // await writeFile(filePath, buffer);

  // Get S3 to generate a preSigned URL to give to the client
  const command = new PutObjectCommand({
    Bucket: "videos",
    Key: filename,
    ContentType: "video/mp4",
  });
  const s3url = await getSignedUrl(s3Client, command, {expiresIn: 60});


  // Save metadata in Postgres
  const video = await prisma.video.create({
    data: { title, description, filename, status: "uploading"},
  });

  // Index in Elasticsearch
  await es.index({
    index: "videos",
    id: video.id.toString(),
    document: {
      id: video.id,
      title: video.title,
      description: video.description,
      filename: video.filename,
      uploadedAt: video.uploadedAt,
      status: video.status
    },
  });

  return NextResponse.json(video);
}
