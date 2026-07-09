'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sky-800 sm:text-3xl">My Profile</h1>
        <p className="text-sm text-sky-600">Update your admin account details</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sky-100 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sky-900">{user?.name}</p>
            <p className="text-sm text-sky-600">{user?.userType}</p>
          </div>
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
              Email
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
              New Password (optional)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-sky-200 px-4 py-3 outline-none ring-sky-300 focus:ring-2"
              placeholder="Leave blank to keep current password"
            />
          </div>

          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-3 font-semibold text-white transition hover:from-sky-600 hover:to-blue-600 disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {submitting ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
