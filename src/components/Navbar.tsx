'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-sky-200/60 bg-gradient-to-r from-sky-400 via-sky-500 to-blue-500 shadow-md shadow-sky-200/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight text-white sm:text-2xl"
          onClick={() => setMenuOpen(false)}
        >
          mr<span className="text-sky-100">Matterz</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-white/25 text-white'
                    : 'text-sky-50 hover:bg-white/15 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="ml-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-50"
          >
            Logout
          </button>
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-white hover:bg-white/15 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Open menu</span>
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-sky-300/40 bg-sky-500/95 px-4 py-4 md:hidden">
          <div className="mb-3 rounded-lg bg-white/10 px-3 py-2 text-sm text-sky-50">
            Signed in as <span className="font-semibold text-white">{user?.name}</span>
          </div>
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    active ? 'bg-white/25 text-white' : 'text-sky-50 hover:bg-white/15'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-white px-4 py-3 text-left text-sm font-semibold text-sky-600"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
