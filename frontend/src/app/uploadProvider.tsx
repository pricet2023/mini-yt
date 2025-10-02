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
