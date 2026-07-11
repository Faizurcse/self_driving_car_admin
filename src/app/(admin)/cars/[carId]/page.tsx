'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getImageUrl } from '@/lib/image-url';
import { formatPriceWithTiming } from '@/lib/price';
import {
  cancelBookingRequest,
  createBookingRequest,
  deleteCarRequest,
  getAdminCarByIdRequest,
  getCarsBookingStatusRequest,
  updateCarBookingStatusRequest,
} from '@/lib/services';
import { useAuth } from '@/context/AuthContext';
import type { BookingStatus, Car, CarBookingStatusItem } from '@/types';

function PriceCard({
  title,
  price,
  timing,
  description,
  gradient,
  ring,
}: {
  title: string;
  price: number | string;
  timing?: string | number | null;
  description: string;
  gradient: string;
  ring: string;
}) {
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-5 ring-1 ${ring}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70">{title}</p>
      <p className="mt-2 text-2xl font-bold">{formatPriceWithTiming(price, timing)}</p>
      <p className="mt-1 text-xs font-semibold uppercase opacity-60">{timing ?? 24} hour rental</p>
      <p className="mt-2 text-sm leading-relaxed opacity-80">{description}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function CarDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const carId = params.carId as string;

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [bookingStatus, setBookingStatus] = useState<CarBookingStatusItem | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');
  const [confirmStatus, setConfirmStatus] = useState<BookingStatus | null>(null);
  const [cancelBookingOpen, setCancelBookingOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [blockTiming, setBlockTiming] = useState('24');

  const loadBookingStatus = useCallback(async () => {
    if (!token || !carId) return;
    setStatusLoading(true);
    try {
      const res = await getCarsBookingStatusRequest(token);
      const item = res.data.find((entry) => entry.carId === carId) ?? null;
      setBookingStatus(item);
    } catch {
      setBookingStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, [token, carId]);

  const loadCar = useCallback(async () => {
    if (!token || !carId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getAdminCarByIdRequest(token, carId);
      setCar(res.data);
      setActiveImage(getImageUrl(res.data.mainImage));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load car details');
    } finally {
      setLoading(false);
    }
  }, [token, carId]);

  useEffect(() => {
    loadCar();
    loadBookingStatus();
  }, [loadCar, loadBookingStatus]);

  const applyStatusChange = async (status: BookingStatus) => {
    if (!token || !car) return;
    setStatusUpdating(true);
    setError('');
    setStatusNotice('');
    try {
      const res = await updateCarBookingStatusRequest(token, {
        carId: car.id,
        carNumber: car.carNumber,
        status,
        timing: status === 'NOT_AVAILABLE' ? blockTiming : undefined,
      });
      setStatusNotice(res.data?.message || res.message || 'Status updated');
      setConfirmStatus(null);
      await loadBookingStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update booking status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const confirmBook = async () => {
    if (!token || !car) return;
    const timing = blockTiming.trim() || String(bookingStatus?.rentalHours ?? car.customerPrices?.timing ?? 24);

    setBookingBusy(true);
    setError('');
    setStatusNotice('');
    try {
      await createBookingRequest(token, {
        carId: car.id,
        carNumber: car.carNumber,
        timing,
      });
      setStatusNotice(`${car.carName} booked successfully.`);
      setBookOpen(false);
      await loadBookingStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to book car');
    } finally {
      setBookingBusy(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!token || !bookingStatus?.bookedBy?.bookingId) return;
    setBookingBusy(true);
    setError('');
    setStatusNotice('');
    try {
      await cancelBookingRequest(token, bookingStatus.bookedBy.bookingId);
      setStatusNotice('Booking cancelled. Car is available again.');
      setCancelBookingOpen(false);
      await loadBookingStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel booking');
    } finally {
      setBookingBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !car) return;
    setDeleting(true);
    try {
      await deleteCarRequest(token, car.id);
      router.push('/cars');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete car');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-8 w-40 rounded-xl bg-sky-100" />
        <div className="aspect-[21/9] rounded-3xl bg-sky-100" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-32 rounded-3xl bg-sky-50" />
          <div className="h-32 rounded-3xl bg-sky-50" />
          <div className="h-32 rounded-3xl bg-sky-50" />
        </div>
      </div>
    );
  }

  if (error && !car) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-lg font-bold text-red-600">{error}</p>
        <Link
          href="/cars"
          className="mt-6 inline-flex rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white"
        >
          Back to Cars
        </Link>
      </div>
    );
  }

  if (!car) return null;

  const isOwnBooking = Boolean(
    bookingStatus?.bookedBy && user?.id && bookingStatus.bookedBy.userId === user.id,
  );
  const isBooked = Boolean(bookingStatus?.isBooked);
  const activeBookingId = bookingStatus?.bookedBy?.bookingId;

  const allImages = [
    { src: getImageUrl(car.mainImage), label: 'Main' },
    ...car.galleryImages.map((img, i) => ({
      src: getImageUrl(img),
      label: `Gallery ${i + 1}`,
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/cars"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100 transition hover:bg-sky-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Cars
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/cars?edit=${car.id}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-5 text-sm font-semibold text-white shadow-md"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={deleting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-red-100 bg-red-50 px-5 text-sm font-semibold text-red-600 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {statusNotice && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {statusNotice}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-sky-100/60 ring-1 ring-sky-100">
        <div className="relative aspect-[21/10] bg-sky-50 sm:aspect-[21/9]">
          <img src={activeImage} alt={car.carName} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-sky-950/80 via-sky-950/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-700">
              {car.carNumber}
            </span>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{car.carName}</h1>
            <p className="mt-2 text-sm font-medium text-sky-100">Model {car.modelNo}</p>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8">
          <div className="rounded-3xl bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 p-5 ring-1 ring-sky-100 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-sky-500">Booking status</h2>
                <p className="mt-1 text-sm text-sky-600">Book, cancel, or override availability for this car</p>
              </div>
              {statusLoading ? (
                <div className="h-9 w-28 animate-pulse rounded-full bg-sky-100" />
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ring-1 ${
                      bookingStatus?.status === 'NOT_AVAILABLE'
                        ? 'bg-red-50 text-red-600 ring-red-100'
                        : 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                    }`}
                  >
                    {bookingStatus?.status === 'NOT_AVAILABLE' ? 'Not Available' : 'Available'}
                  </span>
                  {bookingStatus && (
                    <span className="text-xs font-semibold text-sky-600">
                      {bookingStatus.isBooked
                        ? `Booked for ${bookingStatus.bookedBy?.timing ?? bookingStatus.bookedTiming ?? '—'} hr`
                        : `Rental: ${bookingStatus.rentalHours} hr`}
                    </span>
                  )}
                </div>
              )}
            </div>

            {bookingStatus?.bookedBy && (
              <div className="mt-4 rounded-2xl bg-white/80 p-4 ring-1 ring-sky-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  {isOwnBooking ? 'Your active booking' : 'Currently booked by'}
                </p>
                <p className="mt-1 font-semibold text-sky-900">{bookingStatus.bookedBy.user.name}</p>
                <p className="text-sm text-sky-600">{bookingStatus.bookedBy.user.mobile}</p>
                <p className="mt-1 text-xs text-sky-500">{bookingStatus.bookedBy.timing} hr rental</p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {!isBooked ? (
                <button
                  type="button"
                  disabled={statusLoading || bookingBusy}
                  onClick={() => setBookOpen(true)}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-sm font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                >
                  {bookingBusy ? 'Booking...' : 'Book This Car'}
                </button>
              ) : activeBookingId ? (
                <button
                  type="button"
                  disabled={statusLoading || bookingBusy}
                  onClick={() => setCancelBookingOpen(true)}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {bookingBusy ? 'Cancelling...' : isOwnBooking ? 'Cancel My Booking' : 'Cancel Active Booking'}
                </button>
              ) : null}

              <div className="rounded-2xl border border-dashed border-sky-200 bg-white/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-500">Admin override</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  {bookingStatus?.status !== 'NOT_AVAILABLE' && (
                    <div className="sm:w-40">
                      <label className="mb-1.5 block text-xs font-semibold text-sky-700">Timing (hours)</label>
                      <input
                        value={blockTiming}
                        onChange={(e) => setBlockTiming(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-sky-100 bg-white px-4 text-sm text-sky-900 outline-none focus:ring-2 focus:ring-sky-100"
                        placeholder="24"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={statusLoading || statusUpdating || bookingStatus?.status === 'AVAILABLE'}
                      onClick={() => setConfirmStatus('AVAILABLE')}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                      Mark Available
                    </button>
                    <button
                      type="button"
                      disabled={statusLoading || statusUpdating || bookingStatus?.status === 'NOT_AVAILABLE'}
                      onClick={() => setConfirmStatus('NOT_AVAILABLE')}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                      Mark Not Available
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-sky-500">Description</h2>
            <p className="mt-2 text-base leading-relaxed text-sky-800">{car.description}</p>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-sky-500">
              All Images ({allImages.length})
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((image) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => setActiveImage(image.src)}
                  className={`relative shrink-0 overflow-hidden rounded-2xl ring-2 transition ${
                    activeImage === image.src ? 'ring-sky-500' : 'ring-transparent'
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.label}
                    className="h-20 w-28 object-cover sm:h-24 sm:w-32"
                  />
                  <span className="absolute bottom-1 left-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {image.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-sky-500">Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {car.ownerPrices && (
                <PriceCard
                  title="Owner Price"
                  price={car.ownerPrices.price}
                  timing={car.ownerPrices.timing}
                  description={car.ownerPrices.description}
                  gradient="from-violet-50 to-purple-50 text-violet-900"
                  ring="ring-violet-100"
                />
              )}
              <PriceCard
                title="Dealer Price"
                price={car.dealerPrices.price}
                timing={car.dealerPrices.timing}
                description={car.dealerPrices.description}
                gradient="from-amber-50 to-orange-50 text-amber-900"
                ring="ring-amber-100"
              />
              <PriceCard
                title="Customer Price"
                price={car.customerPrices.price}
                timing={car.customerPrices.timing}
                description={car.customerPrices.description}
                gradient="from-emerald-50 to-teal-50 text-emerald-900"
                ring="ring-emerald-100"
              />
            </div>
          </div>

          {car.contactUs && (car.contactUs.name || car.contactUs.mobile || car.contactUs.email) && (
            <div>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-sky-500">Contact Us</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {car.contactUs.name && (
                  <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-4 ring-1 ring-sky-100">
                    <p className="text-xs font-bold uppercase text-sky-400">Name</p>
                    <p className="mt-1 text-sm font-semibold text-sky-900">{car.contactUs.name}</p>
                  </div>
                )}
                {car.contactUs.mobile && (
                  <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-4 ring-1 ring-sky-100">
                    <p className="text-xs font-bold uppercase text-sky-400">Mobile</p>
                    <p className="mt-1 text-sm font-semibold text-sky-900">{car.contactUs.mobile}</p>
                  </div>
                )}
                {car.contactUs.email && (
                  <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-4 ring-1 ring-sky-100">
                    <p className="text-xs font-bold uppercase text-sky-400">Email</p>
                    <p className="mt-1 text-sm font-semibold text-sky-900">{car.contactUs.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 border-t border-sky-100 pt-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-sky-50/70 p-4 ring-1 ring-sky-100">
              <p className="text-xs font-bold uppercase text-sky-400">Created</p>
              <p className="mt-1 text-sm font-semibold text-sky-800">{formatDate(car.createdAt)}</p>
            </div>
            <div className="rounded-2xl bg-sky-50/70 p-4 ring-1 ring-sky-100">
              <p className="text-xs font-bold uppercase text-sky-400">Last Updated</p>
              <p className="mt-1 text-sm font-semibold text-sky-800">{formatDate(car.updatedAt)}</p>
            </div>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Car?"
        message={`Are you sure you want to delete ${car.carName} (${car.carNumber})? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={bookOpen}
        title="Confirm booking?"
        message={
          car
            ? `Book ${car.carName} (${car.carNumber}) for ${blockTiming.trim() || String(bookingStatus?.rentalHours ?? car.customerPrices?.timing ?? 24)} hours?`
            : ''
        }
        confirmLabel="Yes, book"
        cancelLabel="Not now"
        loading={bookingBusy}
        onConfirm={confirmBook}
        onCancel={() => setBookOpen(false)}
      />

      <ConfirmDialog
        open={cancelBookingOpen}
        title="Cancel booking?"
        message={`Cancel the active booking for ${car.carName} (${car.carNumber})? The car will become available again.`}
        confirmLabel="Yes, cancel"
        cancelLabel="Keep booking"
        loading={bookingBusy}
        onConfirm={handleCancelBooking}
        onCancel={() => setCancelBookingOpen(false)}
      />

      <ConfirmDialog
        open={confirmStatus === 'AVAILABLE'}
        title="Mark car available?"
        message={`Release ${car.carName} (${car.carNumber})? Any active booking will be cancelled and moved to history.`}
        confirmLabel="Mark Available"
        cancelLabel="Cancel"
        loading={statusUpdating}
        onConfirm={() => applyStatusChange('AVAILABLE')}
        onCancel={() => setConfirmStatus(null)}
      />

      <ConfirmDialog
        open={confirmStatus === 'NOT_AVAILABLE'}
        title="Mark car not available?"
        message={`Block ${car.carName} (${car.carNumber}) for ${blockTiming || '24'} hours? Users will not be able to book it.`}
        confirmLabel="Mark Not Available"
        cancelLabel="Cancel"
        loading={statusUpdating}
        onConfirm={() => applyStatusChange('NOT_AVAILABLE')}
        onCancel={() => setConfirmStatus(null)}
      />
    </div>
  );
}
