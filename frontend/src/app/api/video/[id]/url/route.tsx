import { NextResponse, NextRequest } from "next/server";
import { s3, getBucketAndKey } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }) {
    try {
        const { id }  = await context.params;
        const videoId = Number(id);
        // Need to grab key and bucket from s3 url
        const video = await prisma.videos.findUnique({
            where: { id: videoId },
        });
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const { bucket, key } = getBucketAndKey(video.s3url);

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        const relativeUrl = new URL(url).pathname + new URL(url).search;
        const publicUrl = process.env.NEXT_PUBLIC_MINIO_ENDPOINT + relativeUrl;
        return NextResponse.json({
            title: video.title, 
            description: video.description, 
            uploaded_at: video.uploaded_at, 
            s3url: publicUrl
        });
    } catch (err) {
        console.error("Error generating presigned URL:", err);
        return NextResponse.json({ error: "Could not get video" }, { status: 500 });
    }
}