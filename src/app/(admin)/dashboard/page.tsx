'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/price';
import { getAdminDashboardRequest } from '@/lib/services';
import { formatUserType } from '@/lib/user-type';
import { useAuth } from '@/context/AuthContext';
import type { AdminDashboardChartItem, AdminDashboardPeriodStats, AdminDashboardStats } from '@/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function StatCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  accent: string;
}) {
  return (
    <article className={`overflow-hidden rounded-3xl bg-white p-5 shadow-lg shadow-sky-100/60 ring-1 ring-sky-100`}>
      <div className={`mb-3 h-1 w-12 rounded-full bg-gradient-to-r ${accent}`} />
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-sky-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-sky-600">{subtitle}</p>}
    </article>
  );
}

function BarChart({
  title,
  items,
  valueFormatter = (value: number) => String(value),
}: {
  title: string;
  items: AdminDashboardChartItem[];
  valueFormatter?: (value: number) => string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <article className="rounded-3xl bg-white p-5 shadow-lg shadow-sky-100/60 ring-1 ring-sky-100">
      <h2 className="text-lg font-bold text-sky-900">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-sky-700">{item.label}</span>
              <span className="font-bold text-sky-900">{valueFormatter(item.value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-sky-50">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0)}%`,
                  backgroundColor: item.color ?? '#0ea5e9',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function PeriodTable({
  periods,
}: {
  periods: AdminDashboardStats['periods'];
}) {
  const rows = [
    { key: 'today', label: 'Today' },
    { key: 'days15', label: 'Last 15 Days' },
    { key: 'days30', label: 'Last 30 Days' },
    { key: 'year1', label: 'Last 1 Year' },
  ] as const;

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-sky-100/60 ring-1 ring-sky-100">
      <div className="border-b border-sky-100 px-5 py-4">
        <h2 className="text-lg font-bold text-sky-900">Earnings & Bookings by Period</h2>
        <p className="mt-1 text-sm text-sky-600">Counts from booking history</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-sky-50/80 text-xs font-semibold uppercase tracking-wide text-sky-600">
            <tr>
              <th className="px-5 py-3">Period</th>
              <th className="px-5 py-3">Earnings</th>
              <th className="px-5 py-3">Completed</th>
              <th className="px-5 py-3">Cancelled</th>
              <th className="px-5 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-50">
            {rows.map((row) => {
              const period = periods[row.key] as AdminDashboardPeriodStats;
              return (
                <tr key={row.key} className="hover:bg-sky-50/40">
                  <td className="px-5 py-3 font-medium text-sky-800">{row.label}</td>
                  <td className="px-5 py-3 font-semibold text-emerald-700">{formatPrice(period.earnings)}</td>
                  <td className="px-5 py-3 text-sky-800">{period.bookings.completed}</td>
                  <td className="px-5 py-3 text-amber-700">{period.bookings.cancelled}</td>
                  <td className="px-5 py-3 font-bold text-sky-900">{period.bookings.total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await getAdminDashboardRequest(token);
      setStats(response.data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summaryCards = useMemo(() => {
    if (!stats) return [];

    return [
      {
        title: 'Total Users',
        value: stats.users.total,
        subtitle: `${stats.users.customers} customers · ${stats.users.dealers} dealers`,
        accent: 'from-violet-400 to-purple-500',
      },
      {
        title: 'Total Cars',
        value: stats.cars.total,
        subtitle: `${stats.cars.available} available · ${stats.cars.booked} booked`,
        accent: 'from-sky-400 to-blue-500',
      },
      {
        title: 'Active Bookings',
        value: stats.bookings.active,
        subtitle: 'Currently running',
        accent: 'from-blue-400 to-indigo-500',
      },
      {
        title: 'Completed',
        value: stats.bookings.completed,
        subtitle: 'From history',
        accent: 'from-emerald-400 to-teal-500',
      },
      {
        title: 'Cancelled',
        value: stats.bookings.cancelled,
        subtitle: 'From history',
        accent: 'from-amber-400 to-orange-500',
      },
      {
        title: 'Total Earnings',
        value: formatPrice(stats.earnings.total),
        subtitle: 'All completed bookings',
        accent: 'from-emerald-500 to-green-600',
      },
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl bg-white px-6 py-4 text-sm font-medium text-sky-700 shadow-sm ring-1 ring-sky-100">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-red-600">{error || 'Dashboard data unavailable'}</p>
        <button
          type="button"
          onClick={loadDashboard}
          className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-sky-600">Overview of users, cars, bookings and earnings</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <PeriodTable periods={stats.periods} />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <BarChart title="Users by Type" items={stats.charts.usersByType} />
        <BarChart title="Cars by Status" items={stats.charts.carsByStatus} />
        <BarChart title="Bookings by Status" items={stats.charts.bookingsByStatus} />
        <BarChart
          title="Earnings by Period"
          items={stats.charts.earningsByPeriod.map((item) => ({
            label: item.label,
            value: item.value,
            color: '#10b981',
          }))}
          valueFormatter={(value) => formatPrice(value)}
        />
        <BarChart
          title="History Bookings by Period"
          items={stats.charts.bookingsByPeriod.map((item) => ({
            label: item.label,
            value: item.total,
            color: '#0ea5e9',
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl bg-white p-5 shadow-lg shadow-sky-100/60 ring-1 ring-sky-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-sky-900">Recent Active Bookings</h2>
            <Link href="/bookings" className="text-sm font-semibold text-sky-600 hover:text-sky-800">
              View all
            </Link>
          </div>
          {stats.recentActiveBookings.length === 0 ? (
            <p className="text-sm text-sky-500">No active bookings right now.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActiveBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-sky-100 bg-sky-50/40 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sky-900">{booking.carName ?? booking.carNumber}</p>
                      <p className="text-xs text-sky-600">
                        {booking.user?.name ?? 'Unknown'} · {booking.timing}hr rental
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase text-blue-700 ring-1 ring-blue-100">
                      Active
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-sky-500">{formatDate(booking.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-3xl bg-white p-5 shadow-lg shadow-sky-100/60 ring-1 ring-sky-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-sky-900">Recent History</h2>
            <Link href="/history" className="text-sm font-semibold text-sky-600 hover:text-sky-800">
              View all
            </Link>
          </div>
          {stats.recentHistory.length === 0 ? (
            <p className="text-sm text-sky-500">No booking history yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-sky-100 bg-sky-50/40 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sky-900">{item.carName}</p>
                      <p className="text-xs text-sky-600">
                        {item.userName} · {item.user?.userType ? formatUserType(item.user.userType) : 'User'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ring-1 ${
                        item.action === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                          : 'bg-amber-50 text-amber-700 ring-amber-100'
                      }`}
                    >
                      {item.action === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-sky-500">{formatDate(item.createdAt)}</span>
                    {item.action === 'COMPLETED' && (
                      <span className="font-semibold text-emerald-700">{formatPrice(item.amount)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
