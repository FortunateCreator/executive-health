'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/organizations/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.organization?.name) {
          setOrgName(data.organization.name);
        }
      })
      .catch(() => {});
  }, [router]);

  const links = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/team', label: 'Team' },
    { href: '/dashboard/reports', label: 'Reports' },
    { href: '/dashboard/settings', label: 'Settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-neutral-800 bg-neutral-950 flex-shrink-0 flex flex-col">
        <div className="px-6 py-5 border-b border-neutral-800">
          <span className="text-lg font-semibold text-white tracking-tight">
            {orgName || 'ExecHealth'}
          </span>
          <span className="block text-xs text-neutral-500 mt-0.5">
            Corporate
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
