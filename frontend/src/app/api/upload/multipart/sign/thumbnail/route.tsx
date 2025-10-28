import { NextResponse } from "next/server";
import { s3 } from "@/lib/s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") || "";
    const command = searchParams.get("command") || "";
    if (!key || !command || (command !== "GetObject" && command !== "PutObject")) {
        console.log("bad url params")
        return NextResponse.json({ status: 400 }, { statusText: "Bad request" });
    }

    if (command === "GetObject") {
        const s3command = new GetObjectCommand({
            Bucket: process.env.MINIO_BUCKET!,
            Key: key,
        });
        console.log("getting presigned url for thumbnail");
        const url = await getSignedUrl(s3, s3command, { expiresIn: 3600 });
        const relativeUrl = new URL(url).pathname + new URL(url).search;
        console.log("got pre-signed url, ", relativeUrl);
        const publicUrl = process.env.NEXT_PUBLIC_MINIO_ENDPOINT + relativeUrl;
        return NextResponse.json({ publicUrl });

    } else if (command === "PutObject") {
        const s3command = new PutObjectCommand({
            Bucket: process.env.MINIO_BUCKET!,
            Key: key,
        });
        console.log("getting presigned url for thumbnail");
        const url = await getSignedUrl(s3, s3command, { expiresIn: 3600 });
        const relativeUrl = new URL(url).pathname + new URL(url).search;
        console.log("got pre-signed url, ", relativeUrl);
        const publicUrl = process.env.NEXT_PUBLIC_MINIO_ENDPOINT + relativeUrl;
        return NextResponse.json({ publicUrl });
    }

    return NextResponse.json({});
}