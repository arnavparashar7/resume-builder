export default function DashboardLoading() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 w-full animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-40 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded mt-2" />
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded-lg" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 border border-slate-200 rounded-lg bg-white" />
        ))}
      </div>
    </div>
  );
}
