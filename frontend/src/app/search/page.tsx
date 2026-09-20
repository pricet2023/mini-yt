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
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Header */}
      <div className="fade-up text-center pt-4">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span className="gradient-text">Find something</span>{" "}
          <span className="text-white/95">to watch</span>
        </h2>
        <p className="mt-3 text-[var(--muted)]">
          Fuzzy full-text search across every title and description.
        </p>
      </div>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="fade-up glass mx-auto flex max-w-2xl items-center gap-2 rounded-2xl p-2 focus-within:shadow-[0_0_46px_-10px_rgba(124,92,255,0.8)] transition-shadow duration-500"
        style={{ animationDelay: "90ms" }}
      >
        <svg viewBox="0 0 24 24" className="ml-3 w-5 h-5 shrink-0 stroke-[var(--faint)] fill-none" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search by title or description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-[var(--faint)]"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          {loading ? "Searching" : "Search"}
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton aspect-video w-full" />
              <div className="space-y-2 p-4">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((video, i) => (
            <Link
              key={video.id}
              href={`/video/${video.id}`}
              className="card fade-up group overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#1b1730] to-[#0c0b14]">
                {/* sits underneath the image, so it only shows if the thumbnail never loads */}
                <span className="absolute inset-0 grid place-items-center text-white/10">
                  <svg viewBox="0 0 24 24" className="h-10 w-10 stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 9h20M2 15h20M7 5v14M17 5v14" />
                  </svg>
                </span>
                <img
                  src={video.s3thumbnailurl}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                  onError={(e) => { e.currentTarget.style.opacity = "0"; }}
                />
                {/* darkening veil + play button */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/45 backdrop-blur-sm opacity-0 scale-75 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:shadow-[0_0_34px_-4px_rgba(124,92,255,0.95)]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-[1px] fill-white" aria-hidden>
                      <path d="M8 5.5v13l11-6.5-11-6.5z" />
                    </svg>
                  </span>
                </span>
              </div>

              {/* Metadata */}
              <div className="p-4">
                <h3 className="font-semibold leading-snug text-white/95 line-clamp-1 transition-colors duration-300 group-hover:text-[var(--accent-3)]">
                  {video.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--faint)]">
                  {new Date(video.uploaded_at).toLocaleString()}
                </p>
                {video.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                    {video.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="fade-in glass mx-auto max-w-md rounded-2xl px-8 py-12 text-center">
          <span className="float mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--accent)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
              <path d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35" />
            </svg>
          </span>
          <p className="mt-5 font-semibold text-white/90">
            {searched ? "No videos matched that search" : "Nothing searched yet"}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {searched
              ? "Try a different word, or check the spelling."
              : "Type something above and hit search to see what's in the library."}
          </p>
        </div>
      )}
    </div>
  );
}
