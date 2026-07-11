'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { getImageUrl } from '@/lib/image-url';
import { formatPriceWithTiming } from '@/lib/price';
import { getBookingHistoryAdminRequest } from '@/lib/services';
import { formatUserType } from '@/lib/user-type';
import { useAuth } from '@/context/AuthContext';
import type { BookedHistoryItem, HistoryAction, PaginationMeta } from '@/types';

const filterInputClass =
  'w-full min-h-[44px] rounded-xl border border-sky-100 bg-white py-2.5 px-4 text-sm text-sky-900 shadow-sm shadow-sky-100/40 outline-none transition placeholder:text-sky-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-100';

const roleStyles = {
  ADMIN: 'bg-violet-100 text-violet-700 ring-violet-200',
  DEALER: 'bg-amber-100 text-amber-700 ring-amber-200',
  CUSTOMER: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function ActionBadge({ action }: { action: HistoryAction }) {
  const isCompleted = action === 'COMPLETED';
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${
        isCompleted
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
          : 'bg-amber-50 text-amber-700 ring-amber-100'
      }`}
    >
      {isCompleted ? 'Completed' : 'Cancelled'}
    </span>
  );
}

function HistoryCard({ item }: { item: BookedHistoryItem }) {
  const car = item.carJson;
  const booking = item.bookingJson;
  const user = item.user ?? booking.user;
  const priceInfo = car?.customerPrices ?? car?.dealerPrices;

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-sky-100/60 ring-1 ring-sky-100">
      <div className="flex flex-col sm:flex-row">
        {car?.mainImage && (
          <div className="relative aspect-[16/10] shrink-0 bg-sky-50 sm:aspect-auto sm:w-44 md:w-52">
            <img
              src={getImageUrl(car.mainImage)}
              alt={car.carName}
              className="h-full w-full object-cover sm:min-h-[170px]"
            />
            <div className="absolute left-3 top-3">
              <ActionBadge action={item.action} />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">History record</p>
              <p className="mt-0.5 font-mono text-xs text-sky-500">{item.id.slice(0, 8)}…</p>
            </div>
            {!car?.mainImage && <ActionBadge action={item.action} />}
            <p className="text-xs text-sky-500">{formatDate(item.createdAt)}</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-sky-50/80 p-3 ring-1 ring-sky-100">
              <p className="text-[10px] font-bold uppercase text-sky-400">Vehicle</p>
              <p className="mt-1 font-bold text-sky-900">{item.carName}</p>
              <p className="text-xs text-sky-600">{item.carNumber}</p>
              {car?.modelNo && <p className="text-xs text-sky-500">Model {car.modelNo}</p>}
            </div>
            <div className="rounded-2xl bg-violet-50/80 p-3 ring-1 ring-violet-100">
              <p className="text-[10px] font-bold uppercase text-violet-400">User</p>
              <p className="mt-1 font-bold text-violet-900">{item.userName}</p>
              <p className="text-xs text-violet-700">{item.userMobile}</p>
              {user?.email && <p className="truncate text-xs text-violet-600">{user.email}</p>}
              {user?.userType && (
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${roleStyles[user.userType]}`}
                >
                  {formatUserType(user.userType)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {booking?.timing && (
              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                {booking.timing} hr rental
              </span>
            )}
            {priceInfo && (
              <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-100">
                {formatPriceWithTiming(priceInfo.price, priceInfo.timing)}
              </span>
            )}
          </div>

          {car && (
            <Link
              href={`/cars/${car.id}`}
              className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-sky-100 bg-sky-50 px-4 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              View car details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default function HistoryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<BookedHistoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userName, setUserName] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carId, setCarId] = useState('');
  const [action, setAction] = useState<HistoryAction | ''>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await getBookingHistoryAdminRequest(token, {
        userName,
        userMobile,
        carNumber,
        carId,
        action,
        page,
        limit,
      });
      setItems(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load booking history');
    } finally {
      setLoading(false);
    }
  }, [token, userName, userMobile, carNumber, carId, action, page, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadHistory]);

  const clearFilters = () => {
    setUserName('');
    setUserMobile('');
    setCarNumber('');
    setCarId('');
    setAction('');
    setPage(1);
  };

  const hasFilters = Boolean(userName || userMobile || carNumber || carId || action);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-sky-500 to-blue-600 p-6 text-white shadow-xl shadow-sky-200/60 sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">Archive</p>
          <h1 className="mt-1 text-3xl font-bold">Booking History</h1>
          <p className="mt-2 max-w-2xl text-sm text-sky-50">
            Completed and cancelled bookings with full user and vehicle snapshots.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
            <p className="text-xs uppercase text-sky-100">Total records</p>
            <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
            <p className="text-xs uppercase text-sky-100">Page</p>
            <p className="mt-1 text-2xl font-bold">
              {pagination.page}/{pagination.totalPages}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100 sm:p-5">
        <h2 className="text-lg font-bold text-sky-900">Filters</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              setPage(1);
            }}
            className={filterInputClass}
            placeholder="User name"
          />
          <input
            value={userMobile}
            onChange={(e) => {
              setUserMobile(e.target.value);
              setPage(1);
            }}
            className={filterInputClass}
            placeholder="User mobile"
          />
          <input
            value={carNumber}
            onChange={(e) => {
              setCarNumber(e.target.value);
              setPage(1);
            }}
            className={filterInputClass}
            placeholder="Car number"
          />
          <input
            value={carId}
            onChange={(e) => {
              setCarId(e.target.value);
              setPage(1);
            }}
            className={filterInputClass}
            placeholder="Car ID"
          />
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value as HistoryAction | '');
              setPage(1);
            }}
            className={filterInputClass}
          >
            <option value="">All actions</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-sm font-semibold text-sky-600 hover:text-sky-800"
          >
            Clear filters
          </button>
        )}
      </section>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl bg-white p-5 ring-1 ring-sky-100">
              <div className="h-4 w-1/4 rounded bg-sky-100" />
              <div className="mt-4 h-20 rounded-2xl bg-sky-50" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-sky-100">
          <p className="text-lg font-bold text-sky-900">No history found</p>
          <p className="mt-2 text-sm text-sky-500">
            {hasFilters ? 'Try changing your filters.' : 'History appears when bookings complete or are cancelled.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="min-h-[44px] rounded-xl border border-sky-100 bg-white px-4 text-sm font-semibold text-sky-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 text-sm font-medium text-sky-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="min-h-[44px] rounded-xl border border-sky-100 bg-white px-4 text-sm font-semibold text-sky-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
