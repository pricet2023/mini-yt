import { NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { Client } from "@elastic/elasticsearch";

const prisma = new PrismaClient();
const es = new Client({ node: process.env.ELASTICSEARCH_URL });

interface InitReqBody {
  title: string,
  description: string,
  filename: string,
}

export async function POST(req: Request) {
  console.log("Handling multipart init request")
  const initReq: InitReqBody = await req.json();
  const s3key = `${Date.now()}-${initReq.filename}`;


  console.log("Making createmultipart req")
  const command = new CreateMultipartUploadCommand({
    Bucket: process.env.MINIO_BUCKET!,
    Key: s3key,
    ContentType: "video/mp4",
  });

  console.log("Sending createmultipart to minio")
  console.log("Minio endpoint: ", process.env.MINIO_ENDPOINT)
  const response = await s3.send(command);



  // Save metadata in Postgres
  const s3url: string = process.env.NEXT_PUBLIC_MINIO_ENDPOINT + "/" + process.env.MINIO_BUCKET
    + "/" + s3key;
  const s3thumbnailurl: string = s3url + ".thumbnail";
  const video = await prisma.videos.create({
    data: {
      title: initReq.title,
      description: initReq.description,
      s3url: s3url,
      s3thumbnailurl: s3thumbnailurl,
      status: "uploading"
    },
  });

  console.log("Sent to postgres")

  // Index in Elasticsearch
  await es.index({
    index: "videos",
    id: video.id.toString(),
    document: {
      id: video.id,
      title: video.title,
      description: video.description,
      s3url: video.s3url,
      s3thumbnailurl: video.s3thumbnailurl,
      uploaded_at: video.uploaded_at,
      status: video.status
    },
  });

  console.log("Sent to ES")

  return NextResponse.json({
    uploadId: response.UploadId,
    s3key: s3key,
    video,
  });
}