export function LoadingState() {
  return (
    <div className="animate-pulse" aria-label="Cargando contenido" role="status">
      <div className="mb-8 flex items-center justify-between">
        <div><div className="h-9 w-60 rounded-xl bg-line/75" /><div className="mt-3 h-4 w-36 rounded-lg bg-line/60" /></div>
        <div className="size-11 rounded-full bg-line/70" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.65fr_.85fr]">
        <div className="h-[430px] rounded-[26px] bg-line/60" />
        <div className="space-y-4"><div className="h-52 rounded-[26px] bg-line/60" /><div className="h-44 rounded-[26px] bg-line/50" /></div>
        <div className="h-80 rounded-[26px] bg-line/50 md:col-span-2" />
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
