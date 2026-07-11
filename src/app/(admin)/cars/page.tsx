'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { getImageUrl } from '@/lib/image-url';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatPriceWithTiming } from '@/lib/price';
import {
  createCarRequest,
  deleteCarRequest,
  getAdminCarsRequest,
  updateCarRequest,
} from '@/lib/services';
import { useAuth } from '@/context/AuthContext';
import type { Car } from '@/types';

const inputClass =
  'w-full min-h-[48px] rounded-xl border border-sky-100 bg-sky-50/40 px-4 py-3 text-sky-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100';

const filterInputClass =
  'w-full min-h-[44px] rounded-xl border border-sky-100 bg-white py-2.5 pl-10 pr-4 text-sm text-sky-900 shadow-sm shadow-sky-100/40 outline-none transition placeholder:text-sky-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-100';

type CarFormState = {
  carNumber: string;
  carName: string;
  description: string;
  modelNo: string;
  mainImageLink: string;
  galleryLinks: string;
  ownerPrice: string;
  ownerPriceTiming: string;
  ownerPriceDesc: string;
  dealerPrice: string;
  dealerPriceTiming: string;
  dealerPriceDesc: string;
  customerPrice: string;
  customerPriceTiming: string;
  customerPriceDesc: string;
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  mainImageFile: File | null;
  galleryFiles: File[];
};

const emptyForm: CarFormState = {
  carNumber: '',
  carName: '',
  description: '',
  modelNo: '',
  mainImageLink: '',
  galleryLinks: '',
  ownerPrice: '',
  ownerPriceTiming: '24',
  ownerPriceDesc: '',
  dealerPrice: '',
  dealerPriceTiming: '24',
  dealerPriceDesc: '',
  customerPrice: '',
  customerPriceTiming: '24',
  customerPriceDesc: '',
  contactName: '',
  contactMobile: '',
  contactEmail: '',
  mainImageFile: null,
  galleryFiles: [],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function carToForm(car: Car): CarFormState {
  return {
    carNumber: car.carNumber,
    carName: car.carName,
    description: car.description,
    modelNo: car.modelNo,
    mainImageLink: car.mainImage.startsWith('http') ? car.mainImage : car.mainImage,
    galleryLinks: car.galleryImages
      .filter((img) => img.startsWith('http'))
      .join(', '),
    ownerPrice: car.ownerPrices ? String(car.ownerPrices.price) : '',
    ownerPriceTiming: car.ownerPrices ? String(car.ownerPrices.timing) : '24',
    ownerPriceDesc: car.ownerPrices?.description || '',
    dealerPrice: String(car.dealerPrices.price),
    dealerPriceTiming: String(car.dealerPrices.timing),
    dealerPriceDesc: car.dealerPrices.description,
    customerPrice: String(car.customerPrices.price),
    customerPriceTiming: String(car.customerPrices.timing),
    customerPriceDesc: car.customerPrices.description,
    contactName: car.contactUs?.name || '',
    contactMobile: car.contactUs?.mobile || '',
    contactEmail: car.contactUs?.email || '',
    mainImageFile: null,
    galleryFiles: [],
  };
}

function buildCarFormData(form: CarFormState, existingCar?: Car | null) {
  const fd = new FormData();

  fd.append('carNumber', form.carNumber.trim());
  fd.append('carName', form.carName.trim());
  fd.append('description', form.description.trim());
  fd.append('modelNo', form.modelNo.trim());

  if (form.ownerPrice.trim() && form.ownerPriceDesc.trim()) {
    fd.append(
      'ownerPrices',
      JSON.stringify({
        price: form.ownerPrice,
        timing: form.ownerPriceTiming || '24',
        description: form.ownerPriceDesc.trim(),
      }),
    );
  }

  fd.append(
    'dealerPrices',
    JSON.stringify({
      price: form.dealerPrice,
      timing: form.dealerPriceTiming || '24',
      description: form.dealerPriceDesc.trim(),
    }),
  );
  fd.append(
    'customerPrices',
    JSON.stringify({
      price: form.customerPrice,
      timing: form.customerPriceTiming || '24',
      description: form.customerPriceDesc.trim(),
    }),
  );

  const hasContact =
    form.contactName.trim() || form.contactMobile.trim() || form.contactEmail.trim();

  if (hasContact) {
    fd.append(
      'contactUs',
      JSON.stringify({
        ...(form.contactName.trim() && { name: form.contactName.trim() }),
        ...(form.contactMobile.trim() && { mobile: form.contactMobile.trim() }),
        ...(form.contactEmail.trim() && { email: form.contactEmail.trim() }),
      }),
    );
  } else if (existingCar) {
    fd.append('contactUs', JSON.stringify({}));
  }

  if (form.mainImageFile) {
    fd.append('mainImage', form.mainImageFile);
  } else if (form.mainImageLink.trim()) {
    fd.append('mainImage', form.mainImageLink.trim());
  } else if (existingCar?.mainImage) {
    fd.append('mainImage', existingCar.mainImage);
  }

  if (form.galleryFiles.length > 0) {
    form.galleryFiles.forEach((file) => fd.append('galleryImages', file));
  } else {
    const links = form.galleryLinks
      .split(',')
      .map((link) => link.trim())
      .filter(Boolean);

    if (links.length > 0) {
      fd.append('galleryImages', JSON.stringify(links));
    } else if (existingCar?.galleryImages?.length) {
      fd.append('galleryImages', JSON.stringify(existingCar.galleryImages));
    }
  }

  return fd;
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

function FilterField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-sky-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400">
          <SearchIcon />
        </span>
        {children}
      </div>
    </div>
  );
}

function CarCard({
  car,
  busy,
  onOpen,
  onEdit,
  onDelete,
}: {
  car: Car;
  busy: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-sky-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100/80 hover:ring-sky-200">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full cursor-pointer text-left"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-sky-50">
          <img
            src={getImageUrl(car.mainImage)}
            alt={car.carName}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sky-950/70 via-transparent to-transparent" />
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-sky-600 opacity-0 shadow transition group-hover:opacity-100">
            View details →
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <span className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700">
              {car.carNumber}
            </span>
            <h3 className="mt-2 text-lg font-bold text-white drop-shadow">{car.carName}</h3>
            <p className="text-xs font-medium text-sky-100">Model {car.modelNo}</p>
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <p className="line-clamp-2 text-sm text-sky-600">{car.description}</p>

          <div className="grid grid-cols-3 gap-2">
            {car.ownerPrices && (
              <div className="rounded-2xl bg-violet-50 p-2.5 ring-1 ring-violet-100">
                <p className="text-[10px] font-bold uppercase text-violet-500">Owner</p>
                <p className="mt-1 text-sm font-bold text-violet-800">
                  {formatPriceWithTiming(car.ownerPrices.price, car.ownerPrices.timing)}
                </p>
              </div>
            )}
            <div className="rounded-2xl bg-amber-50 p-2.5 ring-1 ring-amber-100">
              <p className="text-[10px] font-bold uppercase text-amber-600">Dealer</p>
              <p className="mt-1 text-sm font-bold text-amber-800">
                {formatPriceWithTiming(car.dealerPrices.price, car.dealerPrices.timing)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-2.5 ring-1 ring-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-600">Customer</p>
              <p className="mt-1 text-sm font-bold text-emerald-800">
                {formatPriceWithTiming(car.customerPrices.price, car.customerPrices.timing)}
              </p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {car.galleryImages.slice(0, 4).map((image, index) => (
              <img
                key={`${car.id}-gallery-${index}`}
                src={getImageUrl(image)}
                alt={`${car.carName} gallery ${index + 1}`}
                className="h-14 w-20 shrink-0 rounded-xl object-cover ring-1 ring-sky-100"
              />
            ))}
          </div>

          <p className="text-xs text-sky-400">Added {formatDate(car.createdAt)}</p>
        </div>
      </button>

      <div className="flex gap-2 border-t border-sky-50 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          disabled={busy}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={busy}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function parseGalleryLinks(value: string) {
  return value
    .split(',')
    .map((link) => link.trim())
    .filter(Boolean);
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

function useObjectUrls(files: File[]) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const objectUrls = files.map((file) => URL.createObjectURL(file));
    setUrls(objectUrls);
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  return urls;
}

function ImagePreviewCard({
  src,
  label,
  onRemove,
}: {
  src: string;
  label: string;
  onRemove?: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl ring-2 ring-white shadow-md">
      <img src={src} alt={label} className="aspect-[4/3] w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-950/80 to-transparent px-2 pb-2 pt-8">
        <p className="truncate text-[10px] font-semibold text-white">{label}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
          aria-label="Remove image"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function UploadDropzone({
  id,
  label,
  hint,
  multiple,
  accept = 'image/*',
  onFiles,
  icon,
}: {
  id: string;
  label: string;
  hint: string;
  multiple?: boolean;
  accept?: string;
  onFiles: (files: File[]) => void;
  icon: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    onFiles(Array.from(fileList));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition ${
        dragging
          ? 'border-sky-400 bg-sky-100/80'
          : 'border-sky-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'
      }`}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-200">
        {icon}
      </div>
      <p className="mt-3 text-sm font-bold text-sky-900">{label}</p>
      <p className="mt-1 text-xs text-sky-500">{hint}</p>
      <p className="mt-2 text-[11px] font-medium text-sky-400">Click or drag & drop</p>
    </div>
  );
}

function CarFormModal({
  title,
  subtitle,
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
  existingCar,
}: {
  title: string;
  subtitle: string;
  form: CarFormState;
  setForm: React.Dispatch<React.SetStateAction<CarFormState>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  existingCar?: Car | null;
}) {
  const mainFilePreview = useObjectUrl(form.mainImageFile);
  const galleryFilePreviews = useObjectUrls(form.galleryFiles);
  const galleryLinkPreviews = useMemo(() => parseGalleryLinks(form.galleryLinks), [form.galleryLinks]);

  const mainPreview =
    mainFilePreview ||
    (form.mainImageLink.trim() ? getImageUrl(form.mainImageLink.trim()) : null) ||
    (existingCar && !form.mainImageFile && !form.mainImageLink.trim()
      ? getImageUrl(existingCar.mainImage)
      : null);

  const galleryPreviews = useMemo(() => {
    const items: { src: string; key: string; type: 'file' | 'link' | 'existing'; index?: number }[] = [];

    galleryFilePreviews.forEach((src, index) => {
      items.push({ src, key: `file-${index}`, type: 'file', index });
    });

    if (form.galleryFiles.length === 0) {
      galleryLinkPreviews.forEach((link, index) => {
        items.push({ src: getImageUrl(link), key: `link-${index}`, type: 'link', index });
      });

      if (galleryLinkPreviews.length === 0 && existingCar) {
        existingCar.galleryImages.forEach((image, index) => {
          items.push({ src: getImageUrl(image), key: `existing-${index}`, type: 'existing', index });
        });
      }
    }

    return items;
  }, [galleryFilePreviews, galleryLinkPreviews, form.galleryFiles.length, existingCar]);

  const galleryCount = galleryPreviews.length;
  const galleryValid = galleryCount >= 2;

  const removeGalleryFile = (index: number) => {
    setForm((f) => ({
      ...f,
      galleryFiles: f.galleryFiles.filter((_, i) => i !== index),
    }));
  };

  const removeGalleryLink = (index: number) => {
    const links = parseGalleryLinks(form.galleryLinks);
    links.splice(index, 1);
    setForm((f) => ({ ...f, galleryLinks: links.join(', ') }));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-sky-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl shadow-sky-300/30 sm:rounded-[2rem]">
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-sky-500 via-sky-500 to-blue-600 px-5 py-5 sm:px-6 sm:py-6">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-6 left-10 h-20 w-20 rounded-full bg-blue-300/20 blur-xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-50 ring-1 ring-white/20">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {subtitle}
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h2>
              <p className="mt-1 text-sm text-sky-100">Upload images with live preview before saving</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 transition hover:bg-white/25"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <section className="rounded-3xl bg-sky-50/60 p-4 ring-1 ring-sky-100 sm:p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-xs text-white">1</span>
                Car Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-sky-800">Car Number</label>
                  <input
                    required
                    value={form.carNumber}
                    onChange={(e) => setForm((f) => ({ ...f, carNumber: e.target.value }))}
                    className={inputClass}
                    placeholder="CAR-001"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-sky-800">Car Name</label>
                  <input
                    required
                    value={form.carName}
                    onChange={(e) => setForm((f) => ({ ...f, carName: e.target.value }))}
                    className={inputClass}
                    placeholder="Tesla Model 3"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-semibold text-sky-800">Model No</label>
                <input
                  required
                  value={form.modelNo}
                  onChange={(e) => setForm((f) => ({ ...f, modelNo: e.target.value }))}
                  className={inputClass}
                  placeholder="M3-2024"
                />
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-semibold text-sky-800">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={`${inputClass} min-h-[96px] resize-none`}
                  placeholder="Describe the car features, color, condition..."
                />
              </div>
            </section>

            <section className="rounded-3xl bg-gradient-to-br from-white to-sky-50/80 p-4 ring-1 ring-sky-100 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-xs text-white">2</span>
                  Main Image
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    mainPreview ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {mainPreview ? '1 image added' : 'Required'}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <UploadDropzone
                    id="main-image-upload"
                    label="Upload main photo"
                    hint="JPG, PNG, WEBP"
                    onFiles={(files) =>
                      setForm((f) => ({ ...f, mainImageFile: files[0] || null, mainImageLink: '' }))
                    }
                    icon={
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                  />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-sky-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-sky-50 px-2 font-semibold text-sky-400">or paste link</span>
                    </div>
                  </div>
                  <input
                    value={form.mainImageLink}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mainImageLink: e.target.value, mainImageFile: null }))
                    }
                    className={inputClass}
                    placeholder="https://example.com/car-main.jpg"
                  />
                </div>

                <div>
                  {mainPreview ? (
                    <div className="relative">
                      <ImagePreviewCard
                        src={mainPreview}
                        label={form.mainImageFile?.name || 'Main preview'}
                        onRemove={() =>
                          setForm((f) => ({ ...f, mainImageFile: null, mainImageLink: '' }))
                        }
                      />
                      <p className="mt-2 text-center text-xs font-medium text-emerald-600">
                        Main image ready
                      </p>
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/50 text-sky-400">
                      <svg className="h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm font-medium">Preview will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-gradient-to-br from-white to-blue-50/50 p-4 ring-1 ring-sky-100 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-xs text-white">3</span>
                  Gallery Images
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    galleryValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {galleryCount} image{galleryCount !== 1 ? 's' : ''} added
                  {!galleryValid && ' (min 2)'}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <UploadDropzone
                    id="gallery-upload"
                    label="Upload gallery photos"
                    hint="Select multiple images"
                    multiple
                    onFiles={(files) =>
                      setForm((f) => ({ ...f, galleryFiles: files, galleryLinks: '' }))
                    }
                    icon={
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    }
                  />
                  <textarea
                    rows={2}
                    value={form.galleryLinks}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, galleryLinks: e.target.value, galleryFiles: [] }))
                    }
                    className={`${inputClass} min-h-[72px] resize-none`}
                    placeholder="Or paste links: https://img1.jpg, https://img2.jpg"
                  />
                </div>

                <div>
                  {galleryPreviews.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {galleryPreviews.map((item, index) => (
                        <ImagePreviewCard
                          key={item.key}
                          src={item.src}
                          label={`Image ${index + 1}`}
                          onRemove={
                            item.type !== 'existing'
                              ? () => {
                                  if (item.type === 'file' && item.index !== undefined) {
                                    removeGalleryFile(item.index);
                                  } else if (item.type === 'link' && item.index !== undefined) {
                                    removeGalleryLink(item.index);
                                  }
                                }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/50 text-sky-400">
                      <svg className="h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm font-medium">Add at least 2 gallery images</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-sky-50/60 p-4 ring-1 ring-sky-100 sm:p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-xs text-white">4</span>
                Pricing
              </h3>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-4 ring-1 ring-violet-100">
                  <p className="mb-3 text-sm font-bold text-violet-800">Owner (optional)</p>
                  <input
                    value={form.ownerPrice}
                    onChange={(e) => setForm((f) => ({ ...f, ownerPrice: e.target.value }))}
                    className={inputClass}
                    placeholder="₹ Price"
                  />
                  <input
                    value={form.ownerPriceTiming}
                    onChange={(e) => setForm((f) => ({ ...f, ownerPriceTiming: e.target.value }))}
                    className={`${inputClass} mt-2`}
                    placeholder="Timing (hours) e.g. 24"
                  />
                  <input
                    value={form.ownerPriceDesc}
                    onChange={(e) => setForm((f) => ({ ...f, ownerPriceDesc: e.target.value }))}
                    className={`${inputClass} mt-2`}
                    placeholder="Description"
                  />
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-100">
                  <p className="mb-3 text-sm font-bold text-amber-800">Dealer</p>
                  <input
                    required
                    value={form.dealerPrice}
                    onChange={(e) => setForm((f) => ({ ...f, dealerPrice: e.target.value }))}
                    className={inputClass}
                    placeholder="₹ Price"
                  />
                  <input
                    required
                    value={form.dealerPriceTiming}
                    onChange={(e) => setForm((f) => ({ ...f, dealerPriceTiming: e.target.value }))}
                    className={`${inputClass} mt-2`}
                    placeholder="Timing (hours) e.g. 24"
                  />
                  <input
                    required
                    value={form.dealerPriceDesc}
                    onChange={(e) => setForm((f) => ({ ...f, dealerPriceDesc: e.target.value }))}
                    className={`${inputClass} mt-2`}
                    placeholder="Description"
                  />
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-100">
                  <p className="mb-3 text-sm font-bold text-emerald-800">Customer</p>
                  <input
                    required
                    value={form.customerPrice}
                    onChange={(e) => setForm((f) => ({ ...f, customerPrice: e.target.value }))}
                    className={inputClass}
                    placeholder="₹ Price"
                  />
                  <input
                    required
                    value={form.customerPriceTiming}
                    onChange={(e) => setForm((f) => ({ ...f, customerPriceTiming: e.target.value }))}
                    className={`${inputClass} mt-2`}
                    placeholder="Timing (hours) e.g. 24"
                  />
                  <input
                    required
                    value={form.customerPriceDesc}
                    onChange={(e) => setForm((f) => ({ ...f, customerPriceDesc: e.target.value }))}
                    className={`${inputClass} mt-2`}
                    placeholder="Description"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-sky-50/60 p-4 ring-1 ring-sky-100 sm:p-5">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-xs text-white">5</span>
                Contact Us
              </h3>
              <p className="mb-4 text-xs text-sky-500">Optional — name, mobile and email for this vehicle</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-sky-800">Name</label>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                    className={inputClass}
                    placeholder="Contact person name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-sky-800">Mobile</label>
                  <input
                    value={form.contactMobile}
                    onChange={(e) => setForm((f) => ({ ...f, contactMobile: e.target.value }))}
                    className={inputClass}
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-sky-800">Email</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    className={inputClass}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>
            </section>

            <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-sky-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[50px] flex-1 rounded-2xl border border-sky-100 bg-white text-sm font-bold text-sky-700 transition hover:bg-sky-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !mainPreview || !galleryValid}
                className="min-h-[50px] flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-sm font-bold text-white shadow-lg shadow-sky-200 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Car'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CarsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    carNumber: '',
    carName: '',
    description: '',
    modelNo: '',
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [form, setForm] = useState<CarFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionCarId, setActionCarId] = useState<string | null>(null);
  const [deletingCar, setDeletingCar] = useState<Car | null>(null);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  const loadCars = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await getAdminCarsRequest(token, filters);
      setCars(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load cars');
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCars();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadCars]);

  const openAdd = () => {
    setForm(emptyForm);
    setAddOpen(true);
  };

  const openEdit = (car: Car) => {
    setForm(carToForm(car));
    setEditingCar(car);
  };

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || cars.length === 0) return;

    const carToEdit = cars.find((car) => car.id === editId);
    if (carToEdit) {
      openEdit(carToEdit);
      router.replace('/cars', { scroll: false });
    }
  }, [searchParams, cars, router]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const fd = buildCarFormData(form);
      await createCarRequest(token, fd);
      setAddOpen(false);
      setForm(emptyForm);
      await loadCars();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add car');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !editingCar) return;
    setSaving(true);
    setError('');
    try {
      const fd = buildCarFormData(form, editingCar);
      await updateCarRequest(token, editingCar.id, fd);
      setEditingCar(null);
      setForm(emptyForm);
      await loadCars();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update car');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !deletingCar) return;
    setActionCarId(deletingCar.id);
    setError('');
    try {
      await deleteCarRequest(token, deletingCar.id);
      setDeletingCar(null);
      await loadCars();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete car');
    } finally {
      setActionCarId(null);
    }
  };

  const clearFilters = () => {
    setFilters({ carNumber: '', carName: '', description: '', modelNo: '' });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-sky-500 to-blue-600 p-6 text-white shadow-xl shadow-sky-200/60 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">Inventory</p>
            <h1 className="mt-1 text-3xl font-bold">Cars Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-sky-50">
              Add, edit, filter and manage all cars with owner, dealer and customer pricing.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-sky-600 shadow-lg transition hover:bg-sky-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Car
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
            <p className="text-xs uppercase text-sky-100">Total Cars</p>
            <p className="mt-1 text-2xl font-bold">{cars.length}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
            <p className="text-xs uppercase text-sky-100">Filters Active</p>
            <p className="mt-1 text-2xl font-bold">{activeFilterCount}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-sky-100 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-sky-900">Filters</h2>
            <p className="text-sm text-sky-500">Search by car number, name, description or model</p>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 lg:hidden"
          >
            {filtersOpen ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${filtersOpen ? 'grid' : 'hidden lg:grid'}`}>
          <FilterField id="filter-car-number" label="Car Number">
            <input
              id="filter-car-number"
              value={filters.carNumber}
              onChange={(e) => setFilters((f) => ({ ...f, carNumber: e.target.value }))}
              className={filterInputClass}
              placeholder="CAR-001"
            />
          </FilterField>
          <FilterField id="filter-car-name" label="Car Name">
            <input
              id="filter-car-name"
              value={filters.carName}
              onChange={(e) => setFilters((f) => ({ ...f, carName: e.target.value }))}
              className={filterInputClass}
              placeholder="Tesla"
            />
          </FilterField>
          <FilterField id="filter-description" label="Description">
            <input
              id="filter-description"
              value={filters.description}
              onChange={(e) => setFilters((f) => ({ ...f, description: e.target.value }))}
              className={filterInputClass}
              placeholder="Electric"
            />
          </FilterField>
          <FilterField id="filter-model" label="Model No">
            <input
              id="filter-model"
              value={filters.modelNo}
              onChange={(e) => setFilters((f) => ({ ...f, modelNo: e.target.value }))}
              className={filterInputClass}
              placeholder="2024"
            />
          </FilterField>
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-sm font-semibold text-sky-600 hover:text-sky-800"
          >
            Clear all filters
          </button>
        )}
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-3xl bg-white ring-1 ring-sky-100">
              <div className="aspect-[16/10] bg-sky-100" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-2/3 rounded bg-sky-100" />
                <div className="h-3 w-full rounded bg-sky-50" />
                <div className="h-10 rounded-xl bg-sky-50" />
              </div>
            </div>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-sky-100">
          <p className="text-lg font-bold text-sky-900">No cars found</p>
          <p className="mt-2 text-sm text-sky-500">Try changing filters or add your first car.</p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-5 text-sm font-semibold text-white"
          >
            Add Car
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              busy={actionCarId === car.id}
              onOpen={() => router.push(`/cars/${car.id}`)}
              onEdit={() => openEdit(car)}
              onDelete={() => setDeletingCar(car)}
            />
          ))}
        </div>
      )}

      {addOpen && (
        <CarFormModal
          title="Add New Car"
          subtitle="Create car"
          form={form}
          setForm={setForm}
          saving={saving}
          onClose={() => setAddOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingCar && (
        <CarFormModal
          title={editingCar.carName}
          subtitle="Edit car"
          form={form}
          setForm={setForm}
          saving={saving}
          existingCar={editingCar}
          onClose={() => setEditingCar(null)}
          onSubmit={handleUpdate}
        />
      )}

      <ConfirmDialog
        open={!!deletingCar}
        title="Delete Car?"
        message={
          deletingCar
            ? `Are you sure you want to delete ${deletingCar.carName} (${deletingCar.carNumber})? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={!!deletingCar && actionCarId === deletingCar.id}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingCar(null)}
      />
    </div>
  );
}
