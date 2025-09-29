import { NextRequest, NextResponse } from "next/server";
import { Client } from "@elastic/elasticsearch";

const es = new Client({ node: "http://localhost:9200" });

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
      { uploadedAt: { order: "desc" } }
    ],
  });

  const hits = results.hits.hits.map((hit) => hit._source);

  return NextResponse.json(hits);
}