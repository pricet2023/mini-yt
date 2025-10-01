import Link from "next/link";
import "./globals.css";
import { UploadProvider } from "./uploadProvider";

export const metadata = {
  title: "Mini YouTube Clone",
  description: "A simple video app built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {/* Global S3 Upload provider */}
        <UploadProvider>
          {/* Navbar */}
          <nav className="flex items-center justify-between bg-white shadow px-6 py-4">
            {/* App title (top-left) */}
            <h1 className="text-xl font-bold">
              <Link href="/">Mini YouTube</Link>
            </h1>

            {/* Navigation links */}
            <div className="space-x-6">
              <Link href="/" className="hover:text-blue-500">Home</Link>
              <Link href="/upload" className="hover:text-blue-500">Upload</Link>
              <Link href="/search" className="hover:text-blue-500">Search</Link>
            </div>
          </nav>

          {/* Page content */}
          <main className="p-6">{children}</main>
        </UploadProvider>
      </body>
    </html>
  );
}