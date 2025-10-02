"use client";

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

    if (!videoMeta) return <p>Loading video...</p>;

    return (
        <div className="flex flex-col items-center w-full p-6">
            {/* Video Player */}
            <div className="w-full max-w-4xl">
                <video
                    src={videoMeta.s3url}
                    controls
                    className="w-full rounded-lg shadow-lg"
                />
            </div>

            {/* Title + Meta */}
            <div className="w-full max-w-4xl mt-4">
                <h1 className="text-2xl font-semibold">{videoMeta.title}</h1>
                <p className="text-sm text-gray-400">
                    {new Date(videoMeta.uploaded_at).toLocaleDateString()}
                </p>

                {/* Description dropdown */}
                {videoMeta.description && (
                    <div className="mt-3">
                        <button
                            className="text-blue-500 text-sm hover:underline"
                            onClick={() => setShowDesc((s) => !s)}
                        >
                            {showDesc ? "Hide description" : "Show description"}
                        </button>
                        {showDesc && (
                            <p className="mt-2 text-gray-200 whitespace-pre-line">
                                {videoMeta.description}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}