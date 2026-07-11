'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ApiError } from '@/lib/api';
import { getImageUrl } from '@/lib/image-url';
import { formatPriceWithTiming } from '@/lib/price';
import { cancelBookingRequest, getAllBookingsAdminRequest, getMyBookingsRequest } from '@/lib/services';
import { formatUserType } from '@/lib/user-type';
import { useAuth } from '@/context/AuthContext';
import type { Booking, BookingStatus } from '@/types';

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

function StatusBadge({ status }: { status: BookingStatus }) {
  const isActive = status === 'NOT_AVAILABLE';
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${
        isActive
          ? 'bg-red-50 text-red-600 ring-red-100'
          : 'bg-emerald-50 text-emerald-600 ring-emerald-100'
      }`}
    >
      {isActive ? 'Not Available' : 'Available'}
    </span>
  );
}

function BookingCard({
  booking,
  busy,
  onCancel,
  variant = 'all',
}: {
  booking: Booking;
  busy: boolean;
  onCancel: () => void;
  variant?: 'all' | 'my';
}) {
  const car = booking.car;
  const user = booking.user;
  const priceInfo = car?.customerPrices ?? car?.dealerPrices ?? car?.ownerPrices;
  const isActive = booking.status === 'NOT_AVAILABLE';

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-sky-100/60 ring-1 ring-sky-100 transition hover:shadow-xl">
      <div className="flex flex-col sm:flex-row">
        {car?.mainImage && (
          <div className="relative aspect-[16/10] shrink-0 bg-sky-50 sm:aspect-auto sm:w-48 md:w-56">
            <img
              src={getImageUrl(car.mainImage)}
              alt={car.carName}
              className="h-full w-full object-cover sm:min-h-[180px]"
            />
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              <StatusBadge status={booking.status} />
              {variant === 'my' && (
                <span className="inline-flex rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  My booking
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Booking ID</p>
              <p className="mt-0.5 truncate font-mono text-xs text-sky-600">{booking.id}</p>
            </div>
            {!car?.mainImage && (
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge status={booking.status} />
                {variant === 'my' && (
                  <span className="inline-flex rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    My booking
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={`mt-4 grid gap-4 ${variant === 'all' ? 'sm:grid-cols-2' : ''}`}>
            <div className="rounded-2xl bg-sky-50/80 p-3 ring-1 ring-sky-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Vehicle</p>
              <p className="mt-1 font-bold text-sky-900">{car?.carName || '—'}</p>
              <p className="text-xs text-sky-600">{booking.carNumber}</p>
              {car?.modelNo && <p className="mt-1 text-xs text-sky-500">Model {car.modelNo}</p>}
            </div>

            {variant === 'all' && (
              <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-3 ring-1 ring-violet-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Booked By</p>
                <p className="mt-1 font-bold text-violet-900">{user?.name || '—'}</p>
                <p className="text-xs text-violet-700">{user?.mobile}</p>
                {user?.email && <p className="truncate text-xs text-violet-600">{user.email}</p>}
                {user?.userType && (
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${roleStyles[user.userType]}`}
                  >
                    {formatUserType(user.userType)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
              <span className="text-[10px] font-bold uppercase text-amber-500">Timing</span>
              <p className="font-bold text-amber-900">{booking.timing} hr</p>
            </div>
            {priceInfo && (
              <div className="rounded-xl bg-orange-50 px-3 py-2 ring-1 ring-orange-100">
                <span className="text-[10px] font-bold uppercase text-orange-500">Price</span>
                <p className="font-bold text-orange-900">
                  {formatPriceWithTiming(priceInfo.price, priceInfo.timing)}
                </p>
              </div>
            )}
            <div className="rounded-xl bg-sky-50 px-3 py-2 ring-1 ring-sky-100">
              <span className="text-[10px] font-bold uppercase text-sky-400">Booked on</span>
              <p className="text-xs font-semibold text-sky-800">{formatDate(booking.createdAt)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-sky-50 pt-4">
            {car && (
              <Link
                href={`/cars/${car.id}`}
                className="flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 sm:flex-none sm:px-4"
              >
                View car
              </Link>
            )}
            {isActive && (
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 sm:flex-none sm:px-4"
              >
                {busy ? 'Cancelling...' : 'Cancel booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BookingsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<'all' | 'my'>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [myLoading, setMyLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [carNumberFilter, setCarNumberFilter] = useState('');
  const [userNameFilter, setUserNameFilter] = useState('');

  const loadAllBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await getAllBookingsAdminRequest(token);
      setBookings(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadMyBookings = useCallback(async () => {
    if (!token) return;
    setMyLoading(true);
    setError('');
    try {
      const res = await getMyBookingsRequest(token);
      setMyBookings(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your bookings');
    } finally {
      setMyLoading(false);
    }
  }, [token]);

  const loadBookings = useCallback(async () => {
    await Promise.all([loadAllBookings(), loadMyBookings()]);
  }, [loadAllBookings, loadMyBookings]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const activeList = tab === 'all' ? bookings : myBookings;
  const activeLoading = tab === 'all' ? loading : myLoading;

  const filteredBookings = useMemo(() => {
    return activeList.filter((booking) => {
      if (statusFilter && booking.status !== statusFilter) return false;
      if (carNumberFilter.trim() && !booking.carNumber.toLowerCase().includes(carNumberFilter.trim().toLowerCase())) {
        return false;
      }
      if (tab === 'all' && userNameFilter.trim() && !booking.user?.name?.toLowerCase().includes(userNameFilter.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [activeList, statusFilter, carNumberFilter, userNameFilter, tab]);

  const stats = useMemo(() => {
    const active = bookings.filter((b) => b.status === 'NOT_AVAILABLE').length;
    const myActive = myBookings.filter((b) => b.status === 'NOT_AVAILABLE').length;
    return {
      total: bookings.length,
      active,
      available: bookings.length - active,
      myTotal: myBookings.length,
      myActive,
    };
  }, [bookings, myBookings]);

  const confirmCancel = async () => {
    if (!token || !cancellingBooking) return;
    setActionId(cancellingBooking.id);
    setError('');
    try {
      await cancelBookingRequest(token, cancellingBooking.id);
      setCancellingBooking(null);
      await loadBookings();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel booking');
    } finally {
      setActionId(null);
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setCarNumberFilter('');
    setUserNameFilter('');
  };

  const hasFilters = Boolean(statusFilter || carNumberFilter || userNameFilter);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-sky-500 to-blue-600 p-6 text-white shadow-xl shadow-sky-200/60 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">Reservations</p>
            <h1 className="mt-1 text-3xl font-bold">Bookings</h1>
            <p className="mt-2 max-w-2xl text-sm text-sky-50">
              All vehicle bookings with user details, car info and availability status.
            </p>
          </div>
          <button
            type="button"
            onClick={loadBookings}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-white/15 px-4 text-sm font-semibold ring-1 ring-white/25 transition hover:bg-white/25"
          >
            Refresh
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
            <p className="text-xs uppercase text-sky-100">All bookings</p>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
            <p className="text-xs uppercase text-sky-100">Active</p>
            <p className="mt-1 text-2xl font-bold">{stats.active}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
            <p className="text-xs uppercase text-sky-100">My bookings</p>
            <p className="mt-1 text-2xl font-bold">{stats.myTotal}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
            <p className="text-xs uppercase text-sky-100">My active</p>
            <p className="mt-1 text-2xl font-bold">{stats.myActive}</p>
          </div>
        </div>
      </section>

      <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-sky-100">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`flex min-h-[44px] flex-1 items-center justify-center rounded-xl text-sm font-semibold transition ${
            tab === 'all'
              ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md'
              : 'text-sky-600 hover:bg-sky-50'
          }`}
        >
          All Bookings
        </button>
        <button
          type="button"
          onClick={() => setTab('my')}
          className={`flex min-h-[44px] flex-1 items-center justify-center rounded-xl text-sm font-semibold transition ${
            tab === 'my'
              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md'
              : 'text-sky-600 hover:bg-sky-50'
          }`}
        >
          My Bookings
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100 sm:p-5">
        <h2 className="text-lg font-bold text-sky-900">Filters</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
            className={filterInputClass}
          >
            <option value="">All statuses</option>
            <option value="NOT_AVAILABLE">Not Available</option>
            <option value="AVAILABLE">Available</option>
          </select>
          <input
            value={carNumberFilter}
            onChange={(e) => setCarNumberFilter(e.target.value)}
            className={filterInputClass}
            placeholder="Car number"
          />
          {tab === 'all' && (
            <input
              value={userNameFilter}
              onChange={(e) => setUserNameFilter(e.target.value)}
              className={filterInputClass}
              placeholder="User name"
            />
          )}
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

      {activeLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-3xl bg-white ring-1 ring-sky-100">
              <div className="flex flex-col sm:flex-row">
                <div className="aspect-[16/10] bg-sky-100 sm:w-48 sm:min-h-[180px]" />
                <div className="flex-1 space-y-3 p-5">
                  <div className="h-4 w-1/3 rounded bg-sky-100" />
                  <div className="h-16 rounded-2xl bg-sky-50" />
                  <div className="h-10 rounded-xl bg-sky-50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-sky-100">
          <p className="text-lg font-bold text-sky-900">No bookings found</p>
          <p className="mt-2 text-sm text-sky-500">
            {hasFilters
              ? 'Try changing your filters.'
              : tab === 'my'
                ? 'Your bookings will appear here when you book a vehicle.'
                : 'Bookings will appear here when users book vehicles.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              variant={tab}
              busy={actionId === booking.id}
              onCancel={() => setCancellingBooking(booking)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancellingBooking}
        title="Cancel booking?"
        message={
          cancellingBooking
            ? tab === 'my'
              ? `Cancel your booking for ${cancellingBooking.car?.carName || cancellingBooking.carNumber}? The car will become available again.`
              : `Cancel booking for ${cancellingBooking.car?.carName || cancellingBooking.carNumber} by ${cancellingBooking.user?.name || 'user'}? The car will become available again.`
            : ''
        }
        confirmLabel="Cancel booking"
        cancelLabel="Keep"
        loading={!!cancellingBooking && actionId === cancellingBooking.id}
        onConfirm={confirmCancel}
        onCancel={() => setCancellingBooking(null)}
      />
    </div>
  );
}
