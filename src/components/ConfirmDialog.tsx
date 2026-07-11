type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-sky-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div
        className="w-full max-w-md overflow-hidden rounded-t-[2rem] bg-white shadow-2xl shadow-sky-300/30 sm:rounded-[2rem]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className="bg-gradient-to-br from-red-500 via-red-500 to-rose-600 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 id="confirm-dialog-title" className="text-xl font-bold text-white">
              {title}
            </h2>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <p id="confirm-dialog-message" className="text-sm leading-relaxed text-sky-700">
            {message}
          </p>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-sky-100 bg-white px-5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50 sm:flex-none"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50 sm:flex-none"
            >
              {loading ? 'Please wait...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
