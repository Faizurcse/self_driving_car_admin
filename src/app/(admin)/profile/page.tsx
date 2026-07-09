'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PasswordInput from '@/components/PasswordInput';

function formatDate(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function IconInput({
  id,
  label,
  icon,
  ...props
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="group">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-sky-800">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 transition group-focus-within:text-sky-600 sm:left-4">
          {icon}
        </span>
        <input
          id={id}
          className="w-full min-h-[48px] rounded-2xl border border-sky-100 bg-white py-3 pl-11 pr-4 text-base text-sky-900 shadow-sm shadow-sky-100/50 placeholder:text-sky-300 outline-none transition focus:border-sky-300 focus:shadow-md focus:shadow-sky-100 focus:ring-4 focus:ring-sky-100 sm:py-3.5 sm:pl-12 sm:text-sm"
          {...props}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500 sm:h-11 sm:w-11">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-400 sm:text-xs">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-sky-900">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setMobile(user.mobile);
    setEmail(user.email || '');
    setPassword('');
  }, [user]);

  const profileScore = useMemo(() => {
    let score = 0;
    if (name.trim()) score += 25;
    if (mobile.trim()) score += 25;
    if (email.trim()) score += 25;
    if (user?.userType) score += 25;
    return score;
  }, [name, mobile, email, user?.userType]);

  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      name !== user.name ||
      mobile !== user.mobile ||
      email !== (user.email || '') ||
      password.length > 0
    );
  }, [user, name, mobile, email, password]);

  const resetForm = () => {
    if (!user) return;
    setName(user.name);
    setMobile(user.mobile);
    setEmail(user.email || '');
    setPassword('');
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
    setMessage('');
    setError('');
    setSubmitting(true);

    try {
      await updateProfile({
        name,
        mobile,
        email,
        password: password || undefined,
      });
      setPassword('');
      setMessage('Your profile has been updated successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await handleSave();
  };

  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative mx-auto w-full max-w-6xl pb-28 lg:pb-10">
      {/* Hero — edge-to-edge on mobile */}
      <div className="-mx-4 overflow-hidden rounded-none bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 shadow-lg shadow-sky-200/60 sm:mx-0 sm:rounded-3xl sm:shadow-xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl sm:h-40 sm:w-40" />
          <div className="absolute -bottom-12 left-6 h-36 w-36 rounded-full bg-blue-400/30 blur-3xl sm:left-10 sm:h-48 sm:w-48" />
        </div>

        <div className="relative px-4 pb-16 pt-6 text-center sm:px-10 sm:pb-20 sm:pt-10 sm:text-left">
          <p className="text-xs font-medium uppercase tracking-widest text-sky-100 sm:text-sm">
            My Account
          </p>
          <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl lg:text-3xl">
            Profile Settings
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs text-sky-100/90 sm:mx-0 sm:text-sm">
            Manage your details and keep your admin account secure.
          </p>
        </div>
      </div>

      {/* Main grid: sidebar (mobile stack) + form */}
      <div className="mt-4 grid gap-5 lg:mt-6 lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start lg:gap-8">
        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          {/* Profile identity card */}
          <div className="rounded-2xl bg-white p-4 shadow-md shadow-sky-100/70 ring-1 ring-sky-100 sm:rounded-3xl sm:p-6">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left lg:flex-col lg:items-center lg:text-center">
              <div className="relative -mt-12 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 text-2xl font-bold text-white shadow-lg ring-4 ring-white sm:-mt-0 sm:h-24 sm:w-24 sm:rounded-3xl sm:text-3xl lg:-mt-14 lg:h-28 lg:w-28">
                {initials}
              </div>

              <div className="mt-3 w-full sm:mt-0 lg:mt-4">
                <h2 className="text-lg font-bold text-sky-900 sm:text-xl">{user?.name}</h2>
                <p className="mt-0.5 break-all text-sm text-sky-500">
                  {user?.email || 'Add email in form'}
                </p>
                <p className="mt-0.5 text-sm text-sky-400">{user?.mobile}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  {user?.userType}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-sky-50 pt-5">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-600">
                <span>Profile complete</span>
                <span>{profileScore}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-sky-100 sm:h-2.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${profileScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats — 1 col mobile, 2 col tablet sidebar, 1 col desktop sidebar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard
              label="Member since"
              value={formatDate(user?.createdAt)}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
            />
            <StatCard
              label="Last updated"
              value={formatDate(user?.updatedAt)}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              }
            />
          </div>
        </aside>

        {/* Form column */}
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4 sm:space-y-5">
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sky-100 sm:rounded-3xl">
            <header className="border-b border-sky-50 bg-gradient-to-r from-sky-50 to-blue-50/50 px-4 py-4 sm:px-6 sm:py-5">
              <h3 className="text-base font-bold text-sky-900 sm:text-lg">Personal Information</h3>
              <p className="mt-0.5 text-xs text-sky-500 sm:text-sm">Update your basic account details</p>
            </header>

            <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                <IconInput
                  id="name"
                  label="Full name"
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  }
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                <IconInput
                  id="mobile"
                  label="Mobile number"
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  }
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile"
                />
              </div>

              <IconInput
                id="email"
                label="Email address"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                }
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sky-100 sm:rounded-3xl">
            <header className="border-b border-sky-50 bg-gradient-to-r from-sky-50 to-blue-50/50 px-4 py-4 sm:px-6 sm:py-5">
              <h3 className="text-base font-bold text-sky-900 sm:text-lg">Security</h3>
              <p className="mt-0.5 text-xs text-sky-500 sm:text-sm">Update your password</p>
            </header>

            <div className="p-4 sm:p-6">
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-sky-800">
                New password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty to keep current"
                className="min-h-[48px] rounded-2xl border-sky-100 py-3 text-base sm:text-sm"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {['8+ chars', 'Letters & numbers', 'Unique'].map((tip) => (
                  <span
                    key={tip}
                    className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-600 ring-1 ring-sky-100 sm:px-3 sm:text-xs"
                  >
                    {tip}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {message && (
            <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 sm:items-center sm:px-5 sm:py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white sm:h-9 sm:w-9">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="font-medium">{message}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:items-center sm:px-5 sm:py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white sm:h-9 sm:w-9">
                !
              </span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Desktop / tablet landscape actions */}
          <div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              disabled={!isDirty || submitting}
              className="min-h-[48px] rounded-2xl border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-40 sm:px-7"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={submitting || !isDirty}
              className="min-h-[48px] rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/80 transition hover:from-sky-600 hover:to-blue-600 disabled:opacity-40"
            >
              {submitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Mobile sticky action bar */}
      {isDirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sky-100 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(14,165,233,0.15)] backdrop-blur-md sm:hidden">
          <div className="mx-auto flex max-w-lg gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="min-h-[48px] flex-1 rounded-2xl border border-sky-200 text-sm font-semibold text-sky-700 active:bg-sky-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="min-h-[48px] flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-sm font-semibold text-white shadow-md active:opacity-90"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
