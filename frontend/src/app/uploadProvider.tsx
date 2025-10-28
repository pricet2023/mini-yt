"use client";
import React, { createContext, useContext, useState } from "react";

type Upload = {
    uploadId: string,
    title: string;
    progress: number,
    uploaded_at: string;
};

type UploadContextType = {
    uploads: Upload[];
    s3MultipartUpload: (file: File,
        title: string,
        key: string,
        uploadId: string,
        videoId: number,
        uploaded_at: string,
    ) => void;
}

interface signResp {
    publicUrl: string,
}

const UploadContext = createContext<UploadContextType | null>(null);

async function extractRandomFrame(file: File): Promise<Blob> {
    // Create a blob URL so the video element can play it
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous"; // important if remote sources are used
    video.muted = true; // prevent autoplay restrictions
    video.playsInline = true;

    await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
            // Random timestamp between 10% and 90% of duration
            const randomTime = video.duration * (0.1 + 0.8 * Math.random());
            video.currentTime = randomTime;
        };
        video.onseeked = resolve;
        video.onerror = reject;
    });

    // Draw frame to canvas
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D context");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to Blob (JPEG to save space)
    const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8)
    );

    // Cleanup
    URL.revokeObjectURL(url);

    return blob;

}

export function UploadProvider({ children }: { children: React.ReactNode }) {
    const [uploads, setUploads] = useState<Upload[]>([]);

    async function s3MultipartUpload(
        file: File,
        title: string,
        key: string,
        uploadId: string,
        videoId: number,
        uploaded_at: string,
    ) {

        const newUpload: Upload = {
            uploadId: uploadId,
            title: title,
            progress: 0.0,
            uploaded_at: uploaded_at,
        }
        setUploads((prev) => [...prev, newUpload]);

        // Grab a thumbnail and generate pre-signed url
        const thumbnail: Blob = await extractRandomFrame(file);

        console.log("getting pre-signed url for thumbnail");
        const s3thumbnailkey = key + ".thumbnail";

        const params = new URLSearchParams({
            key: s3thumbnailkey,
            command: "PutObject",
        });
        const signRes = await fetch(`/api/upload/multipart/sign/thumbnail?${params.toString()}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        if (!signRes.ok) throw new Error(`Thumbnail failed`);

        const resp: signResp = await signRes.json();
        console.log("got presigned thumbnail url, ", resp.publicUrl);
        // Upload directly to S3
        const res = await fetch(resp.publicUrl, {
            method: "PUT",
            headers: { "Content-Type": "video/mp4" },
            body: thumbnail,
        });

        if (!res.ok) throw new Error(`Thumbnail failed`);

        console.log("Uploaded thumbnail: ", key);


        // Chunk up file
        console.log("chunking file");
        const chunkSize = 5 * 1024 * 1024; // 5MB per chunk (min allowed)
        const chunks: Blob[] = [];
        for (let start = 0; start < file.size; start += chunkSize) {
            chunks.push(file.slice(start, start + chunkSize));
        }

        const parts: { ETag: string; PartNumber: number }[] = [];

        let uploadProgress = 0.0;

        console.log("uploading parts asynchronously");
        // 2. Upload parts asynchronously
        await Promise.all(
            chunks.map(async (chunk, i) => {
                const partNumber = i + 1;

                // Ask backend for signed URL for this part
                console.log("getting pre-signed url");
                const signRes = await fetch("/api/upload/multipart/sign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key, uploadId, partNumber }),
                });
                if (!signRes.ok) throw new Error(`Part ${partNumber} failed`);


                const resp: signResp = await signRes.json();
                console.log("got presigned url, ", resp.publicUrl);

                // Upload chunk directly to S3
                const res = await fetch(resp.publicUrl, {
                    method: "PUT",
                    headers: { "Content-Type": "video/mp4" },
                    body: chunk,
                });

                if (!res.ok) throw new Error(`Part ${partNumber} failed`);

                //update progress
                uploadProgress += (chunk.size / file.size)
                setUploads((prev) =>
                    prev.map((u) => (u.uploadId === uploadId ? { ...u, progress: uploadProgress } : u))
                );

                console.log("uploaded part");

                const eTag = res.headers.get("ETag")!;
                parts.push({ ETag: eTag, PartNumber: partNumber });
            })
        );

        // sort parts in ascending order
        parts.sort((a, b) => a.PartNumber - b.PartNumber)

        // 3. Finalize multipart upload
        console.log("completing upload");
        const completeRes = await fetch("/api/upload/multipart/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, uploadId, parts, videoId }),
        });

        const result = await completeRes.json();
        console.log("Upload complete", result);
        // Remove upload from list
        setUploads((prev) => prev.filter((u) => u.uploadId !== uploadId));
    }

    return (
        <UploadContext.Provider value={{ uploads, s3MultipartUpload }}>
            {children}
        </UploadContext.Provider>
    );
}

// uploads must be used inside UploadProvider
export function useUploads() {
    const ctx = useContext(UploadContext);
    if (!ctx) throw new Error("useUploads must be used inside UploadProvider");
    return ctx;
}
