export default function EditorLoading() {
  return (
    <div className="h-screen flex flex-col bg-slate-50 animate-pulse">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 bg-slate-100 rounded-md" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-slate-100 rounded-lg" />
          <div className="h-8 w-28 bg-slate-200 rounded-lg" />
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="hidden lg:block w-64 border-r border-slate-200 bg-white shrink-0 p-3 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-slate-100 rounded-md" />
          ))}
        </div>
        <div className="flex-1 p-6 space-y-3">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-9 w-full max-w-md bg-slate-100 rounded-md" />
          <div className="h-9 w-full max-w-md bg-slate-100 rounded-md" />
        </div>
      </div>
    </div>
  );
}
