import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { Client } from "@elastic/elasticsearch";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const es = new Client({ node: "http://localhost:9200" });

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Write tmp file locally
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "uploads");
  const filename = `${Date.now()}-${file.name}`;
  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

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

  pushUploadToS3(video.id, path.join(uploadDir, filename));

  return NextResponse.json(video);
}

async function pushUploadToS3(videoId: number, filePath: string) {
  // TODO: PUSH TO S3

  // Update db with status
  await prisma.video.update({
    where: {id: videoId},
    data: { status: "complete"},
  });

  // Update ES
  await es.update({
    index: "videos",
    id: videoId.toString(),
    doc: { status: "complete" },
  });

  // TODO: notify client via SSE
}