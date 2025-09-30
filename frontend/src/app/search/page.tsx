"use client";

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

      {results.length > 0 && (
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
            {results.map((video) => (
              <tr key={video.id}>
                <td className="border px-2 py-1">{video.title}</td>
                <td className="border px-2 py-1">{video.description}</td>
                <td className="border px-2 py-1">{video.status}</td>
                <td className="border px-2 py-1">
                  {new Date(video.uploaded_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}