'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PasswordInput from '@/components/PasswordInput';

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
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
      await register({ name, mobile, email: email || undefined, password });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-6 shadow-xl shadow-sky-100 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sky-700">
            mr<span className="text-sky-500">Matterz</span>
          </h1>
          <p className="mt-2 text-sm text-sky-600">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-sky-800">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-sky-200 px-4 py-3 outline-none ring-sky-300 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="mobile" className="mb-1 block text-sm font-medium text-sky-800">
              Mobile
            </label>
            <input
              id="mobile"
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-xl border border-sky-200 px-4 py-3 outline-none ring-sky-300 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-sky-800">
              Email (optional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-sky-200 px-4 py-3 outline-none ring-sky-300 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-sky-800">
              Password
            </label>
            <PasswordInput
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-sky-700">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-800">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
