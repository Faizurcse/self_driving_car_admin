export default function DashboardPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="rounded-3xl bg-white px-8 py-12 shadow-sm ring-1 ring-sky-100 sm:px-14 sm:py-16">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-2xl font-bold text-white">
          M
        </div>
        <h1 className="text-3xl font-bold text-sky-800 sm:text-4xl">Coming Soon</h1>
        <p className="mt-3 max-w-sm text-sm text-sky-600 sm:text-base">
          Dashboard features are under development. Check back soon.
        </p>
      </div>
    </div>
  );
}
