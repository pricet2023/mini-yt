import "./globals.css";
import { UploadProvider } from "./uploadProvider";
import Navbar from "./components/Navbar";

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
      <body className="antialiased">
        {/* Moody ambient backdrop */}
        <div className="ambient" aria-hidden />

        {/* Global S3 Upload provider */}
        <UploadProvider>
          <Navbar />
          <main className="px-5 sm:px-8 py-10">{children}</main>
        </UploadProvider>
      </body>
    </html>
  );
}
