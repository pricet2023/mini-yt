import Link from "next/link";

const features = [
  {
    title: "Multipart uploads",
    body: "Big files are sliced into 5MB parts and pushed straight to object storage in parallel.",
    icon: (
      <path d="M12 3v12m0-12l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    ),
  },
  {
    title: "Full-text search",
    body: "Elasticsearch indexes every title and description, with fuzzy matching for typos.",
    icon: <path d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35" />,
  },
  {
    title: "Streamed playback",
    body: "Videos stream from presigned URLs, so nothing heavy ever passes through the app server.",
    icon: (
      <path d="M4 6a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm12 4l4-2.5v9L16 14" />
    ),
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <section className="relative flex flex-col items-center text-center py-20 sm:py-28">
        {/* glow behind the headline */}
        <div
          className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] max-w-full rounded-full blur-[110px] opacity-45 bg-[radial-gradient(circle,rgba(124,92,255,0.75),transparent_65%)]"
          aria-hidden
        />

        <span className="fade-up glass relative rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-[var(--muted)]">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-3)] align-middle shadow-[0_0_10px_2px_rgba(46,230,214,0.8)]" />
          Next.js · Postgres · MinIO · Elasticsearch
        </span>

        <h1
          className="fade-up relative mt-7 text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05]"
          style={{ animationDelay: "80ms" }}
        >
          <span className="gradient-text">Upload. Search.</span>
          <br />
          <span className="text-white/95">Press play.</span>
        </h1>

        <p
          className="fade-up relative mt-6 max-w-xl text-base sm:text-lg text-[var(--muted)] leading-relaxed"
          style={{ animationDelay: "160ms" }}
        >
          A self-hosted video platform built on object storage and full-text
          search. Drop a file in, find it instantly, stream it anywhere.
        </p>

        <div
          className="fade-up relative mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Link href="/upload" className="btn btn-primary">
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 16V4m0 0L8 8m4-4l4 4M4 18v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
            </svg>
            Upload a video
          </Link>
          <Link href="/search" className="btn btn-ghost">
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35" />
            </svg>
            Browse the library
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid gap-4 sm:grid-cols-3 pb-16">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="card fade-up p-6"
            style={{ animationDelay: `${320 + i * 90}ms` }}
          >
            <span className="grid place-items-center w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] text-[var(--accent-3)]">
              <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {f.icon}
              </svg>
            </span>
            <h3 className="mt-4 font-semibold text-white/95">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {f.body}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
