'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';

const sidebarLinks = [
  { href: '/ops', label: 'Dashboard' },
  { href: '/ops/patients', label: 'Patients' },
  { href: '/ops/appointments', label: 'Appointments' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-300 font-sans m-0 p-0">
        <div className="flex min-h-screen">
          <aside className="w-60 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col">
            <div className="px-5 py-6 border-b border-neutral-800">
              <Link href="/ops" className="flex items-center gap-2.5 no-underline">
                <span className="text-2xl">🏥</span>
                <span className="text-base font-bold text-neutral-100">Ops Panel</span>
              </Link>
            </div>
            <nav className="flex-1 py-3">
              {sidebarLinks.map(link => {
                const isActive = pathname === link.href || (link.href !== '/ops' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-5 py-2.5 text-sm font-medium no-underline transition-colors ${
                      isActive
                        ? 'bg-neutral-800 text-white border-l-2 border-blue-500'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-5 py-4 border-t border-neutral-800">
              <button onClick={handleLogout} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer bg-transparent border-none">
                Sign Out
              </button>
              <p className="text-[10px] text-neutral-600 mt-2">© 2026 Executive Health</p>
            </div>
          </aside>
          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
