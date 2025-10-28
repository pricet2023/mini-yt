import { NextRequest, NextResponse } from "next/server";
import { Client } from "@elastic/elasticsearch";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, getBucketAndKey } from "@/lib/s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const es = new Client({ node: process.env.ELASTICSEARCH_URL });

interface Video {
  id: number;
  title: string;
  description?: string;
  s3url: string;
  s3thumbnailurl: string;
  uploaded_at: string;
  status: string;
}

async function convertToSignedUrl(s3url: string): Promise<string> {
  const { key, bucket } = getBucketAndKey(s3url);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  const relativeUrl = new URL(url).pathname + new URL(url).search;
  const publicUrl = process.env.NEXT_PUBLIC_MINIO_ENDPOINT + relativeUrl;

  return publicUrl;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q) {
    return NextResponse.json([]);
  }

  const results = await es.search({
    index: "videos",
    query: {
      multi_match: {
        query: q,
        fields: ["title", "description"],
        fuzziness: "AUTO", // allow typos, fuzzy match
      },
    },
    sort: [
      { uploaded_at: { order: "desc" } }
    ],
  });

  const hits = results.hits.hits.map((hit) => hit._source);

  return NextResponse.json(hits);
}