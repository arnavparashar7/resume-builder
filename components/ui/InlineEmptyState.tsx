import type { LucideIcon } from "lucide-react";

export function InlineEmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint: string }) {
  return (
    <div className="border border-dashed border-slate-300 rounded-lg py-8 flex flex-col items-center text-center mb-4">
      <Icon className="text-slate-300 mb-2" size={24} />
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5 max-w-[220px]">{hint}</p>
    </div>
  );
}
