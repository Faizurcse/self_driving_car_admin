'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  deleteUserRequest,
  getAllUsersRequest,
  getUserTypesRequest,
  updateUserRequest,
  updateUserTypeRequest,
} from '@/lib/services';
import type { User, UserType } from '@/types';

const userTypeStyles: Record<UserType, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  DEALER: 'bg-amber-100 text-amber-700',
  CUSTOMER: 'bg-emerald-100 text-emerald-700',
};

export default function DashboardPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const [usersRes, typesRes] = await Promise.all([
        getAllUsersRequest(token),
        getUserTypesRequest(token),
      ]);
      setUsers(usersRes.data);
      setUserTypes(typesRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      mobile: user.mobile,
      email: user.email || '',
      password: '',
    });
  };

  const handleUpdateUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !editingUser) return;

    setSaving(true);
    setError('');

    try {
      await updateUserRequest(token, editingUser.id, {
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        password: form.password || undefined,
      });
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = async (userId: string, userType: UserType) => {
    if (!token) return;

    setError('');
    try {
      await updateUserTypeRequest(token, userId, userType);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update user type');
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!token) return;
    if (!window.confirm(`Delete user "${userName}"?`)) return;

    setError('');
    try {
      await deleteUserRequest(token, userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sky-800 sm:text-3xl">Users Dashboard</h1>
          <p className="text-sm text-sky-600">Manage all users from admin panel</p>
        </div>
        <div className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-sky-700 shadow-sm ring-1 ring-sky-100">
          Total users: {users.length}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-500" />
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sky-100 md:block">
            <table className="min-w-full divide-y divide-sky-100">
              <thead className="bg-sky-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-sky-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-sky-700">
                    Mobile
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-sky-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-sky-700">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-sky-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-sky-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-sky-900">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-sky-700">{user.mobile}</td>
                    <td className="px-4 py-3 text-sm text-sky-700">{user.email || '-'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.userType}
                        onChange={(e) => handleTypeChange(user.id, e.target.value as UserType)}
                        disabled={user.id === currentUser?.id}
                        className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-sm text-sky-800"
                      >
                        {userTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={user.id === currentUser?.id}
                          className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:hidden">
            {users.map((user) => (
              <div key={user.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sky-900">{user.name}</h3>
                    <p className="text-sm text-sky-600">{user.mobile}</p>
                    <p className="text-sm text-sky-600">{user.email || 'No email'}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${userTypeStyles[user.userType]}`}
                  >
                    {user.userType}
                  </span>
                </div>

                <select
                  value={user.userType}
                  onChange={(e) => handleTypeChange(user.id, e.target.value as UserType)}
                  disabled={user.id === currentUser?.id}
                  className="mb-3 w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                >
                  {userTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(user)}
                    className="flex-1 rounded-xl bg-sky-100 py-2 text-sm font-semibold text-sky-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id, user.name)}
                    disabled={user.id === currentUser?.id}
                    className="flex-1 rounded-xl bg-red-100 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-sky-800">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-3">
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-sky-200 px-4 py-3"
                placeholder="Name"
              />
              <input
                type="tel"
                required
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                className="w-full rounded-xl border border-sky-200 px-4 py-3"
                placeholder="Mobile"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-sky-200 px-4 py-3"
                placeholder="Email"
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-xl border border-sky-200 px-4 py-3"
                placeholder="New password (optional)"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 rounded-xl border border-sky-200 py-3 font-semibold text-sky-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 py-3 font-semibold text-white disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
