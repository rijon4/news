export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-600 rounded-full animate-spin"></div>
      <p className="mt-3 text-sm text-gray-500">Loading…</p>
    </div>
  );
}
