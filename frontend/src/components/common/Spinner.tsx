export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-tg-text">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-tg-link border-t-transparent" />
      {label && <p className="text-sm text-tg-hint">{label}</p>}
    </div>
  );
}
