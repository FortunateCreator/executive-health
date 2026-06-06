import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Executive Health — Corporate Dashboard',
  description: 'B2B Corporate Health Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-300 min-h-screen">
        {children}
      </body>
    </html>
  );
}
