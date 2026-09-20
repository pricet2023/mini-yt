"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUploads } from "../uploadProvider";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/upload", label: "Upload" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { uploads } = useUploads();

  return (
    <header className="sticky top-0 z-50">
      <nav className="glass flex items-center justify-between gap-4 px-5 sm:px-8 py-3.5 border-x-0 border-t-0 rounded-none">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] shadow-[0_8px_24px_-10px_rgba(124,92,255,0.95)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <svg viewBox="0 0 24 24" className="w-4 h-4 translate-x-[1px] fill-white" aria-hidden>
              <path d="M8 5.5v13l11-6.5-11-6.5z" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight">
            <span className="gradient-text">Mini</span>
            <span className="text-white/90"> YouTube</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  active
                    ? "text-white bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "text-[var(--muted)] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {label}
                <span
                  className={`absolute left-1/2 -bottom-0.5 h-px -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-[var(--accent-2)] to-transparent transition-all duration-300 ${
                    active ? "w-8 opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </Link>
            );
          })}

          {/* Live upload indicator */}
          {uploads.length > 0 && (
            <Link
              href="/upload"
              className="fade-in ml-1 sm:ml-2 flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <span className="spinner w-3! h-3! border-white/30! border-t-[var(--accent-3)]!" />
              <span className="hidden sm:inline">
                {uploads.length} uploading
              </span>
              <span className="sm:hidden">{uploads.length}</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
