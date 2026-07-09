'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(identifier, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-6 shadow-xl shadow-sky-100 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sky-700">
            mr<span className="text-sky-500">Matterz</span>
          </h1>
          <p className="mt-2 text-sm text-sky-600">Admin Panel Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-sky-800">
              Name or Mobile
            </label>
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-xl border border-sky-200 px-4 py-3 text-sky-900 outline-none ring-sky-300 focus:ring-2"
              placeholder="Faiz or 9390810478"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-sky-800">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-sky-200 px-4 py-3 text-sky-900 outline-none ring-sky-300 focus:ring-2"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-3 font-semibold text-white transition hover:from-sky-600 hover:to-blue-600 disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-sky-700">
          No account?{' '}
          <Link href="/register" className="font-semibold text-sky-600 hover:text-sky-800">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
