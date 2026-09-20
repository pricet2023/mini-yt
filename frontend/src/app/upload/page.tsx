"use client";

import { useState, useRef } from "react";
import { useUploads } from "../uploadProvider";

interface Video {
  id: number;
  title: string;
  description?: string;
  s3url: string;
  s3thumbnailurl: string;
  uploaded_at: string;
  status: string;
}

interface InitResp {
  uploadId: string,
  s3key: string,
  video: Video,
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // grab global uploads state from UploadProvider
  const { uploads, s3MultipartUpload } = useUploads();

  function resetFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("video/")) {
      setFile(dropped);
      if (!title) setTitle(dropped.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    console.log("Submitted video");
    e.preventDefault();
    if (!file) {
      return;
    }

    setSubmitting(true);
    try {
      console.log("Init multipart upload");
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
      s3MultipartUpload(file,
        title,
        resp.s3key,
        resp.uploadId,
        resp.video.id,
        resp.video.uploaded_at);

      // reset form
      console.log("Resetting form");
      resetFile();
      setTitle("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      {/* Header */}
      <div className="fade-up text-center pt-4">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span className="gradient-text">Upload</span>{" "}
          <span className="text-white/95">a video</span>
        </h2>
        <p className="mt-3 text-[var(--muted)]">
          Streamed straight to object storage in 5MB parts. Large files welcome.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="fade-up glass space-y-5 rounded-2xl p-6 sm:p-8"
        style={{ animationDelay: "90ms" }}
      >
        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative cursor-pointer rounded-xl border border-dashed px-6 py-10 text-center transition-all duration-300 ${
            dragging
              ? "border-[var(--accent)] bg-[var(--accent)]/10 scale-[1.01] shadow-[0_0_48px_-12px_rgba(124,92,255,0.95)]"
              : "border-white/15 bg-white/[0.02] hover:border-[var(--accent)]/60 hover:bg-white/[0.045]"
          }`}
        >
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            onChange={(e) => {
              const picked = e.target.files?.[0] || null;
              setFile(picked);
              if (picked && !title) setTitle(picked.name.replace(/\.[^.]+$/, ""));
            }}
            className="hidden"
          />

          {file ? (
            <div className="fade-in flex items-center justify-center gap-4 text-left">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] shadow-[0_10px_28px_-12px_rgba(124,92,255,0.95)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
                  <path d="M8 5.5v13l11-6.5-11-6.5z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-white/95">{file.name}</p>
                <p className="text-xs text-[var(--faint)]">
                  {formatBytes(file.size)} · click to replace
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); resetFile(); }}
                className="ml-2 shrink-0 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-[var(--muted)] transition-colors duration-200 hover:border-white/25 hover:text-white"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <span
                className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--accent)] transition-transform duration-300 group-hover:scale-110 ${dragging ? "pulse-glow" : ""}`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 16V4m0 0L8 8m4-4l4 4M4 18v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
                </svg>
              </span>
              <p className="mt-4 font-medium text-white/90">
                {dragging ? "Drop it right here" : "Drag a video in, or click to browse"}
              </p>
              <p className="mt-1 text-xs text-[var(--faint)]">
                Any video format your browser can read
              </p>
            </>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--faint)]">
              Title
            </span>
            <input
              type="text"
              placeholder="Give it a name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--faint)]">
              Description
            </span>
            <textarea
              placeholder="What's in it?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="field resize-y"
            />
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={!file || submitting}
        >
          {submitting ? (
            <>
              <span className="spinner" />
              Starting upload
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 16V4m0 0L8 8m4-4l4 4M4 18v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
              </svg>
              Upload video
            </>
          )}
        </button>
      </form>

      {/* In-flight uploads */}
      {uploads.length > 0 && (
        <div className="fade-in space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white/95">In progress</h3>
            <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-3)]">
              {uploads.length}
            </span>
          </div>

          {uploads.map((video) => {
            const pct = Math.min(100, Math.round(video.progress * 100));
            return (
              <div key={video.uploadId} className="card fade-up p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="truncate font-medium text-white/95">{video.title}</p>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--accent-3)]">
                    {pct}%
                  </span>
                </div>

                <div className="progress-track mt-3">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>

                <p className="mt-2 text-xs text-[var(--faint)]">
                  Started {new Date(video.uploaded_at).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
