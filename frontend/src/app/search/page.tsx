"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getBucketAndKey } from "@/lib/s3";

interface Video {
  id: number;
  title: string;
  description?: string;
  s3url: string;
  s3thumbnailurl: string;
  uploaded_at: string;
  status: string;
}

interface ThumbnailRes {
  publicUrl: string
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Video[]>([]);

  // handle new results coming in, need to grab thumbnails
  useEffect(() => {
    async function fetchThumbnailUrls() {
      const updated = await Promise.all(
        results.map(async (r) => {
          try {
            const { bucket, key } = getBucketAndKey(r.s3thumbnailurl);
            
            const params = new URLSearchParams({
              key: key,
              command: "GetObject",
            });
            const res = await fetch(`/api/upload/multipart/sign/thumbnail?${params.toString()}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            })

            const signedUrl: ThumbnailRes = await res.json();
            console.log("Got signed thumbnail url: ", signedUrl);
            return { ...r, s3thumbnailurl: signedUrl.publicUrl };
          } catch (err) {
            console.error("Failed to load thumbnail", r.id, err);
            return r;
          }
        })
      );
      setResults(updated);

    }
    if (results.length > 0) fetchThumbnailUrls();
  }, [results.length])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold">Search Videos</h2>

      <form onSubmit={handleSearch} className="flex space-x-2">
        <input
          type="text"
          placeholder="Search by title or description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 rounded flex-grow"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {results.map((video) => (
          <Link
            key={video.id}
            href={`/video/${video.id}`}
            className="flex gap-4 p-2 rounded hover:bg-gray-800 transition">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-48 h-28 bg-gray-700 rounded overflow-hidden">
              <img
                src={video.s3thumbnailurl}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Metadata */}
            <div className="flex flex-col justify-start">
              <h2 className="text-lg font-semibold">{video.title}</h2>
              <p className="text-sm text-gray-400">
                {new Date(video.uploaded_at).toLocaleString()}
              </p>
              <p className="text-sm text-gray-300 line-clamp-2 mt-1">
                {video.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}