"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface VideoMeta {
    title: string;
    description?: string;
    uploaded_at: string; // ISO string from DB
    s3url: string;
}

export default function VideoPage() {
    const { id } = useParams(); // Next.js dynamic param
    const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
    const [showDesc, setShowDesc] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            console.log("Grabbing video meta");
            const res = await fetch(`/api/video/${id}/url`);
            if (!res.ok) {
                console.error("Failed to fetch video URL");
                return;
            }

            console.log("got url");

            const video: VideoMeta = await res.json();
            console.log("url, ", video.s3url);
            setVideoMeta(video);
        })();
    }, [id]);

    if (!videoMeta) {
        return (
            <div className="mx-auto w-full max-w-5xl space-y-5">
                <div className="skeleton aspect-video w-full rounded-2xl" />
                <div className="skeleton h-7 w-2/3 rounded-lg" />
                <div className="skeleton h-4 w-32 rounded" />
                <p className="flex items-center gap-2.5 pt-2 text-sm text-[var(--muted)]">
                    <span className="spinner border-white/20! border-t-[var(--accent-2)]!" />
                    Loading video…
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl">
            {/* Player with ambient glow spilling out behind it */}
            <div className="fade-up relative">
                <div
                    className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_50%_45%,rgba(124,92,255,0.35),transparent_70%)] blur-3xl"
                    aria-hidden
                />
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_40px_110px_-40px_rgba(124,92,255,0.85)]">
                    <video
                        src={videoMeta.s3url}
                        controls
                        autoPlay
                        className="aspect-video w-full bg-black"
                    />
                </div>
            </div>

            {/* Title + meta */}
            <div className="fade-up mt-8" style={{ animationDelay: "110ms" }}>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white/95">
                    {videoMeta.title}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-3)] shadow-[0_0_10px_2px_rgba(46,230,214,0.7)]" />
                    <span>
                        Uploaded {new Date(videoMeta.uploaded_at).toLocaleDateString()}
                    </span>
                </div>

                {/* Description dropdown */}
                {videoMeta.description && (
                    <div className="glass mt-6 rounded-2xl p-5">
                        <button
                            className="group flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-white/90 transition-colors duration-200 hover:text-[var(--accent-3)]"
                            onClick={() => setShowDesc((s) => !s)}
                            aria-expanded={showDesc}
                        >
                            Description
                            <svg
                                viewBox="0 0 24 24"
                                className={`h-4 w-4 shrink-0 stroke-current fill-none transition-transform duration-300 ${showDesc ? "rotate-180" : ""}`}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden
                            >
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>

                        <div
                            className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showDesc ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}
                        >
                            <p className="overflow-hidden whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">
                                {videoMeta.description}
                            </p>
                        </div>
                    </div>
                )}

                <Link
                    href="/search"
                    className="btn btn-ghost mt-8"
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M19 12H5m0 0l6-6m-6 6l6 6" />
                    </svg>
                    Back to search
                </Link>
            </div>
        </div>
    );
}
