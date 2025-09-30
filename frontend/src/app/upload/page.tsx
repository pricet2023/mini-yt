"use client";

import { useState } from "react";

interface Video {
  id: number;
  title: string;
  description?: string;
  status: string;
  uploaded_at: string;
  s3url: string;
}

interface InitResp {
   uploadId: string,
    s3key: string,
    video: Video,
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploads, setUploads] = useState<Video[]>([]);

  async function s3MultipartUpload(file: File, key: string, uploadId: string, videoId: number) {
    // Chunk up file
    console.log("chunking file");
    const chunkSize = 5 * 1024 * 1024; // 5MB per chunk (min allowed)
    const chunks: Blob[] = [];
    for (let start = 0; start < file.size; start += chunkSize) {
      chunks.push(file.slice(start, start + chunkSize));
    }

    const parts: { ETag: string; PartNumber: number }[] = [];

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

        const { url } = await signRes.json();
        console.log("got presigned url, uploading part");

        // Upload chunk directly to S3
        const res = await fetch(url, {
          method: "PUT",
          body: chunk,
        });

        if (!res.ok) throw new Error(`Part ${partNumber} failed`);
        
        
        console.log("uploaded part");

        const eTag = res.headers.get("ETag")!;
        parts.push({ ETag: eTag, PartNumber: partNumber });
      })
    );

    // 3. Finalize multipart upload
    console.log("completing upload");
    const completeRes = await fetch("/api/upload/multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, uploadId, parts, videoId }),
    });

    const result = await completeRes.json();
    console.log("Upload complete", result);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      return;
    }

    console.log("Submitted video");

    const res = await fetch("/api/upload/multipart/init", {
      method: "POST",
      body: JSON.stringify({
        title: title,
        filename: file.name,
        description: description,
      }),
    });

    if (!res.ok) {
      alert("Upload failed");
      return;
    }
    
    console.log("Upload init'd");
    

    const resp: InitResp = await res.json();

    // Add to uploads list
    setUploads((prev) => [...prev, resp.video]);

    console.log("kicking off upload");


    // Spin off worker to upload video to s3, 
    // This will upload the parts and then finalise
    s3MultipartUpload(file, resp.s3key, resp.uploadId, resp.video.id);

    // reset form
    setFile(null);
    setTitle("");
    setDescription("");
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Upload a Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border w-full p-2 rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border w-full p-2 rounded"
        />
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Upload
        </button>
      </form>

      {uploads.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Uploads in Progress</h3>
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Title</th>
                <th className="border px-2 py-1">Description</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Uploaded At</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((video) => (
                <tr key={video.id}>
                  <td className="border px-2 py-1">{video.title}</td>
                  <td className="border px-2 py-1">{video.description}</td>
                  <td className="border px-2 py-1">{video.status}</td>
                  <td className="border px-2 py-1">
                    {new Date(video.uploaded_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}