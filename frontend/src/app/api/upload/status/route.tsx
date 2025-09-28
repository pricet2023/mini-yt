import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = parseInt(searchParams.get("id") || "0", 10);

  return new Response(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const interval = setInterval(async () => {
          const video = await prisma.video.findUnique({ where: { id: videoId } });
          if (video) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(video)}\n\n`)
            );
            if (video.status === "complete") clearInterval(interval);
          }
        }, 2000);
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
}