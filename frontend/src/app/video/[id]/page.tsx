"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function VideoPage() {
    const { id } = useParams(); // Next.js dynamic param
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        (async () => {
            console.log("Grabbing url");
            const res = await fetch(`/api/video/${id}/url`);
            if (!res.ok) {
                console.error("Failed to fetch video URL");
                return;
            }

            console.log("got url");



            const data = await res.json();
            console.log("url, ", data.url);
            setVideoUrl(data.url);
        })();
    }, [id]);

    if (!videoUrl) return <p>Loading video...</p>;

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Video {id}</h1>
            <video
                src={videoUrl}
                controls
                style={{ maxWidth: "100%", borderRadius: "12px" }}
            />
        </div>
    );
}