import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Legal - Executive Health Score',
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-neutral-950 text-neutral-300 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-neutral-400 hover:text-neutral-200 transition-colors mb-8"
        >
          ← Back to Home
        </Link>
        {children}
      </div>
    </div>
  );
}
