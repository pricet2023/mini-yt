"use client";

import Link from "next/link";
import { useState } from "react";

interface Video {
  id: number;
  title: string;
  description?: string;
  status: string;
  uploaded_at: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Video[]>([]);

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
                src={"/placeholder.png"}
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