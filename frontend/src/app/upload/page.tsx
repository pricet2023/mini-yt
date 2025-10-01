"use client";

import { useState } from "react";
import { useUploads } from "../uploadProvider";

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

  // grab global uploads state from UploadProvider
  const { uploads, s3MultipartUpload } = useUploads();

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

    console.log("kicking off upload");


    // Spin off worker to upload video to s3, 
    // This will upload the parts and then finalise
    s3MultipartUpload(file, title, resp.s3key, resp.uploadId, resp.video.id);

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
                <tr key={video.uploadId}>
                  <td className="border px-2 py-1">{video.title}</td>
                  <td className="border px-2 py-1">
                    <progress value={video.progress}></progress>
                  </td>
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