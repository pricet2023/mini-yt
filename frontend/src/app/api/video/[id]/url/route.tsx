import { NextResponse, NextRequest } from "next/server";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getBucketAndKey(s3url: string): { bucket: string; key: string } {
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

        // Assume videoId corresponds to the S3 key (you can map via Postgres if needed)
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