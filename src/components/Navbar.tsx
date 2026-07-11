'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatUserType } from '@/lib/user-type';

function VehicleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 17h.01M17 17h.01M5 11l1.5-4.5A2 2 0 018.44 5h7.12a2 2 0 011.94 1.5L19 11M5 11h14v5a1 1 0 01-1 1h-1a2 2 0 01-4 0H9a2 2 0 01-4 0H4a1 1 0 01-1-1v-5z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6M4 11h16" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const navLinks = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: '/users',
    label: 'Users',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    href: '/cars',
    label: 'Cars',
    icon: <VehicleIcon />,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

function CompanyLogo() {
  return (
    <span className="group relative inline-flex max-w-full rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 p-[1.5px] shadow-md shadow-orange-300/40 transition duration-300 hover:shadow-orange-400/50 sm:rounded-2xl sm:p-[2px] sm:shadow-lg">
      <span className="inline-flex min-w-0 items-center rounded-[11px] bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 px-2 py-1 sm:rounded-2xl sm:px-3 sm:py-2">
        <span className="min-w-0 flex flex-col leading-none">
          <span className="text-[7px] font-bold uppercase tracking-[0.16em] text-orange-600/80 sm:text-[9px] sm:tracking-[0.22em]">
            Self Drive
          </span>
          <span className="mt-0.5 truncate text-sm font-extrabold tracking-tight sm:text-lg">
            <span className="text-orange-950">mr</span>
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              Matterz
            </span>
          </span>
        </span>
        <span className="ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-sm shadow-orange-300/50 transition duration-300 group-hover:scale-110 sm:ml-2.5 sm:h-9 sm:w-9 sm:rounded-xl sm:shadow-md">
          <VehicleIcon className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
        </span>
      </span>
    </span>
  );
}

function HamburgerButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 transition hover:bg-white/25 active:scale-95 lg:hidden sm:h-11 sm:w-11 sm:rounded-2xl"
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      onClick={onClick}
    >
      <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
      <span className="relative h-4 w-5">
        <span
          className={`absolute left-0 h-0.5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${
            open ? 'top-[7px] rotate-45' : 'top-0'
          }`}
        />
        <span
          className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${
            open ? 'scale-x-0 opacity-0' : 'opacity-100'
          }`}
        />
        <span
          className={`absolute left-0 h-0.5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${
            open ? 'top-[7px] -rotate-45' : 'top-[14px]'
          }`}
        />
      </span>
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(64);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => setHeaderHeight(header.getBoundingClientRect().height);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen);
    return () => document.body.classList.remove('nav-open');
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    window.location.href = '/login';
  };

  const initials = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-[70] border-b border-white/20 bg-gradient-to-r from-sky-500 via-sky-500 to-blue-600 shadow-lg shadow-sky-300/30 backdrop-blur-md"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-6 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-4 bottom-0 h-16 w-16 rounded-full bg-blue-300/20 blur-xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3 lg:px-8">
          <Link
            href="/dashboard"
            className="min-w-0 shrink transition hover:opacity-95 active:scale-[0.99]"
            onClick={() => setMenuOpen(false)}
          >
            <CompanyLogo />
          </Link>

          <nav className="hidden items-center gap-1.5 lg:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-white text-sky-600 shadow-md shadow-sky-900/10'
                      : 'text-sky-50 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 px-3 py-1.5 ring-1 ring-white/20">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-bold text-sky-600">
                {initials}
              </span>
              <div className="pr-1">
                <p className="text-xs font-semibold leading-tight text-white">{user?.name}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-sky-100">
                  {user?.userType ? formatUserType(user.userType) : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-sky-600 shadow-md shadow-sky-900/10 transition hover:bg-sky-50 active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>

          <HamburgerButton open={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
        </div>
      </header>

      {/* Mobile menu — below navbar only; navbar + hamburger stay visible */}
      {menuOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-[60] lg:hidden"
          style={{ top: headerHeight }}
        >
          <button
            type="button"
            className="nav-backdrop absolute inset-0 bg-sky-900/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />

          <div
            className="nav-panel absolute inset-x-0 top-2.5 mx-3 overflow-y-auto rounded-2xl border border-sky-100 bg-white shadow-2xl shadow-sky-200/50 sm:mx-4 sm:rounded-3xl"
            style={{
              maxHeight: `calc(100dvh - ${headerHeight + 20}px)`,
            }}
          >
            <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-base font-bold text-white ring-2 ring-white/30 sm:h-12 sm:w-12 sm:text-lg">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{user?.name}</p>
                  <p className="truncate text-sm text-sky-100">{user?.mobile}</p>
                  <span className="mt-1 inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {user?.userType ? formatUserType(user.userType) : ''}
                  </span>
                </div>
              </div>
            </div>

            <nav className="space-y-1.5 p-3 sm:p-4">
              {navLinks.map((link, index) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`nav-item flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition active:scale-[0.98] ${
                      active
                        ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
                        : 'text-sky-800 hover:bg-sky-50'
                    }`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        active ? 'bg-sky-500 text-white' : 'bg-sky-100 text-sky-600'
                      }`}
                    >
                      {link.icon}
                    </span>
                    {link.label}
                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-sky-500" />
                    )}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                className="nav-item mt-2 flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600 transition active:scale-[0.98]"
                style={{ animationDelay: `${navLinks.length * 60}ms` }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </span>
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
