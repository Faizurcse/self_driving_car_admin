'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PasswordInput from '@/components/PasswordInput';
import {
  deleteUserRequest,
  getAllUsersRequest,
  getUserTypesRequest,
  updateUserRequest,
  updateUserTypeRequest,
} from '@/lib/services';
import type { User, UserType } from '@/types';
import { formatUserType } from '@/lib/user-type';

const roleStyles: Record<UserType, string> = {
  ADMIN: 'bg-violet-100 text-violet-700 ring-violet-200',
  DEALER: 'bg-amber-100 text-amber-700 ring-amber-200',
  CUSTOMER: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

const roleAccent: Record<UserType, string> = {
  ADMIN: 'from-violet-500 to-purple-600',
  DEALER: 'from-amber-400 to-orange-500',
  CUSTOMER: 'from-emerald-400 to-teal-500',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

const inputClass =
  'w-full min-h-[48px] rounded-xl border border-sky-100 bg-sky-50/40 px-4 py-3 text-sky-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100';

const filterInputClass =
  'w-full min-h-[44px] rounded-xl border border-sky-100 bg-white py-2.5 pl-10 pr-4 text-sm text-sky-900 shadow-sm shadow-sky-100/40 outline-none transition placeholder:text-sky-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 sm:min-h-[46px]';

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
    </svg>
  );
}

function FilterField({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-sky-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 xl:hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-sky-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-lg bg-sky-100" />
              <div className="h-3 w-24 rounded-lg bg-sky-50" />
            </div>
          </div>
          <div className="mt-4 h-10 rounded-xl bg-sky-50" />
          <div className="mt-3 flex gap-2">
            <div className="h-11 flex-1 rounded-xl bg-sky-50" />
            <div className="h-11 flex-1 rounded-xl bg-sky-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    mobile: '',
    userType: '' as UserType | '',
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const activeFilterCount = useMemo(
    () => [filters.name, filters.email, filters.mobile, filters.userType].filter(Boolean).length,
    [filters]
  );

  const loadUsers = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const usersRes = await getAllUsersRequest(token, filters);
      setUsers(usersRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  const loadUserTypes = useCallback(async () => {
    if (!token) return;

    try {
      const typesRes = await getUserTypesRequest(token);
      setUserTypes(typesRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load user types');
    }
  }, [token]);

  useEffect(() => {
    loadUserTypes();
  }, [loadUserTypes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadUsers]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((u) => u.userType === 'ADMIN').length,
      dealer: users.filter((u) => u.userType === 'DEALER').length,
      customer: users.filter((u) => u.userType === 'CUSTOMER').length,
    };
  }, [users]);

  const clearFilters = () => {
    setFilters({ name: '', email: '', mobile: '', userType: '' });
  };

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

    setActionUserId(userId);
    setError('');

    try {
      await updateUserTypeRequest(token, userId, userType);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update user type');
    } finally {
      setActionUserId(null);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!token) return;
    if (!window.confirm(`Delete user "${userName}"?`)) return;

    setActionUserId(userId);
    setError('');

    try {
      await deleteUserRequest(token, userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete user');
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-6 sm:space-y-6 sm:pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 p-5 text-white shadow-xl shadow-sky-300/40 sm:rounded-3xl sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />

        <div className="relative flex flex-col gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-100/90 sm:text-xs">
              Owner Panel
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              Users Management
            </h1>
            <p className="mt-1.5 max-w-md text-sm text-sky-100/90">
              Manage roles, profiles and platform access
            </p>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pb-0">
            {[
              { label: 'Total', value: stats.total, tint: 'bg-white/20' },
              { label: 'Owner', value: stats.admin, tint: 'bg-violet-400/25' },
              { label: 'Dealer', value: stats.dealer, tint: 'bg-amber-400/25' },
              { label: 'Customer', value: stats.customer, tint: 'bg-emerald-400/25' },
            ].map((item) => (
              <div
                key={item.label}
                className={`min-w-[88px] shrink-0 rounded-2xl ${item.tint} px-4 py-3 text-center ring-1 ring-white/20 backdrop-blur-sm sm:min-w-0`}
              >
                <p className="text-xl font-extrabold sm:text-2xl">{item.value}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-100/80">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sky-100">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:hidden"
          aria-expanded={filtersOpen}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
              <FilterIcon />
            </span>
            <div>
              <p className="text-sm font-bold text-sky-900">Search & Filters</p>
              <p className="text-xs text-sky-500">
                {activeFilterCount > 0
                  ? `${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}`
                  : 'Tap to filter users'}
              </p>
            </div>
          </div>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        <div className={`px-4 pb-4 sm:p-5 ${filtersOpen ? 'block' : 'hidden sm:block'}`}>
          <div className="mb-4 hidden items-center justify-between sm:flex">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                <FilterIcon />
              </span>
              <h2 className="text-sm font-bold text-sky-900">Search & Filters</h2>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-sky-600 transition hover:bg-sky-50 hover:text-sky-800"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField id="filter-name" label="Name" icon={<SearchIcon />}>
              <input
                id="filter-name"
                type="text"
                value={filters.name}
                onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
                placeholder="Search name"
                className={filterInputClass}
              />
            </FilterField>
            <FilterField id="filter-email" label="Email" icon={<MailIcon />}>
              <input
                id="filter-email"
                type="text"
                value={filters.email}
                onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
                placeholder="Search email"
                className={filterInputClass}
              />
            </FilterField>
            <FilterField id="filter-mobile" label="Mobile" icon={<PhoneIcon />}>
              <input
                id="filter-mobile"
                type="tel"
                value={filters.mobile}
                onChange={(e) => setFilters((f) => ({ ...f, mobile: e.target.value }))}
                placeholder="Search mobile"
                className={filterInputClass}
              />
            </FilterField>
            <div>
              <label htmlFor="filter-type" className="mb-1.5 block text-xs font-semibold text-sky-700">
                Type
              </label>
              <select
                id="filter-type"
                value={filters.userType}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, userType: e.target.value as UserType | '' }))
                }
                className="w-full min-h-[44px] rounded-xl border border-sky-100 bg-white px-4 py-2.5 text-sm font-medium text-sky-900 shadow-sm shadow-sky-100/40 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 sm:min-h-[46px]"
              >
                <option value="">All types</option>
                {userTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatUserType(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {filters.name && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                  Name: {filters.name}
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, name: '' }))}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-sky-100"
                    aria-label="Remove name filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.email && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                  Email: {filters.email}
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, email: '' }))}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-sky-100"
                    aria-label="Remove email filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.mobile && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                  Mobile: {filters.mobile}
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, mobile: '' }))}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-sky-100"
                    aria-label="Remove mobile filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.userType && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                  Type: {formatUserType(filters.userType)}
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, userType: '' }))}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-sky-100"
                    aria-label="Remove type filter"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-sky-500 hover:text-sky-700 sm:hidden"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results bar */}
      {!loading && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-medium text-sky-600">
            <span className="font-bold text-sky-900">{users.length}</span>{' '}
            {users.length === 1 ? 'user' : 'users'} found
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <>
          <div className="hidden justify-center py-20 xl:flex">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-500" />
          </div>
          <LoadingSkeleton />
        </>
      ) : users.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-sky-100 sm:py-20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-400">
            <SearchIcon />
          </div>
          <p className="mt-4 text-lg font-bold text-sky-900">No users found</p>
          <p className="mt-1 text-sm text-sky-500">Try adjusting your search or filters</p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-sky-100 px-5 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sky-100 xl:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-sky-50">
                <thead className="bg-gradient-to-r from-sky-50 to-blue-50/80">
                  <tr>
                    {['User', 'Mobile', 'Email', 'Role', 'Joined', 'Actions'].map((head) => (
                      <th
                        key={head}
                        className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-sky-600"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-50">
                  {users.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    const busy = actionUserId === user.id;

                    return (
                      <tr key={user.id} className="transition hover:bg-sky-50/50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${roleAccent[user.userType]} text-sm font-bold text-white shadow-sm`}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <span className="font-semibold text-sky-900">{user.name}</span>
                              {isSelf && (
                                <span className="ml-2 text-[10px] font-bold uppercase text-sky-400">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-sky-700">{user.mobile}</td>
                        <td className="max-w-[200px] truncate px-5 py-4 text-sm text-sky-600">
                          {user.email || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={user.userType}
                            disabled={isSelf || busy}
                            onChange={(e) => handleTypeChange(user.id, e.target.value as UserType)}
                            className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-800 shadow-sm disabled:opacity-50"
                          >
                            {userTypes.map((type) => (
                              <option key={type} value={type}>
                                {formatUserType(type)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4 text-sm text-sky-500">{formatDate(user.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(user)}
                              className="rounded-xl bg-sky-100 px-3.5 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(user.id, user.name)}
                              disabled={isSelf || busy}
                              className="rounded-xl bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & tablet cards */}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:hidden">
            {users.map((user) => {
              const isSelf = user.id === currentUser?.id;
              const busy = actionUserId === user.id;

              return (
                <article
                  key={user.id}
                  className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100 transition hover:shadow-md hover:ring-sky-200 sm:p-5"
                >
                  <div
                    className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${roleAccent[user.userType]}`}
                  />

                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${roleAccent[user.userType]} text-base font-bold text-white shadow-md shadow-sky-200/60`}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-bold text-sky-900">{user.name}</p>
                          {isSelf && (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-500">
                              You
                            </span>
                          )}
                        </div>
                        <span
                          className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${roleStyles[user.userType]}`}
                        >
                          {formatUserType(user.userType)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5 pl-2">
                    <div className="flex items-center gap-2.5 text-sm text-sky-700">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                        <PhoneIcon />
                      </span>
                      <span className="font-medium">{user.mobile}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-sky-600">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                        <MailIcon />
                      </span>
                      <span className="truncate">{user.email || 'No email'}</span>
                    </div>
                    <p className="pl-10 text-xs text-sky-400">Joined {formatDate(user.createdAt)}</p>
                  </div>

                  <div className="mt-4 pl-2">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-sky-400">
                      Change role
                    </label>
                    <select
                      value={user.userType}
                      disabled={isSelf || busy}
                      onChange={(e) => handleTypeChange(user.id, e.target.value as UserType)}
                      className="w-full min-h-[44px] rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2.5 text-sm font-semibold text-sky-800 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:opacity-50"
                    >
                      {userTypes.map((type) => (
                        <option key={type} value={type}>
                          {formatUserType(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 flex gap-2 pl-2">
                    <button
                      type="button"
                      onClick={() => openEdit(user)}
                      className="flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition active:scale-[0.98] hover:shadow-md"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={isSelf || busy}
                      className="flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 text-sm font-semibold text-red-600 transition active:scale-[0.98] hover:bg-red-100 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Edit modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-sky-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
          >
            <div className="sticky top-0 z-10 flex justify-center bg-white pt-3 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-sky-200" />
            </div>

            <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-400">Edit profile</p>
                  <h2 id="edit-user-title" className="text-xl font-bold text-sky-900">
                    {editingUser.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sky-500 transition hover:bg-sky-50"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="mb-1.5 block text-sm font-semibold text-sky-800">
                    Name
                  </label>
                  <input
                    id="edit-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edit-mobile" className="mb-1.5 block text-sm font-semibold text-sky-800">
                    Mobile
                  </label>
                  <input
                    id="edit-mobile"
                    required
                    value={form.mobile}
                    onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edit-email" className="mb-1.5 block text-sm font-semibold text-sky-800">
                    Email
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edit-password" className="mb-1.5 block text-sm font-semibold text-sky-800">
                    New password (optional)
                  </label>
                  <PasswordInput
                    id="edit-password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Leave blank to keep current"
                    className="rounded-xl border-sky-100 bg-sky-50/40"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="min-h-[48px] rounded-xl border border-sky-200 px-6 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-[48px] rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:shadow-lg disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
