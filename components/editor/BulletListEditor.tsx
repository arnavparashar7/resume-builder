"use client";

import { useResumeStore } from "@/store/ResumeStoreProvider";
import { RichTextEditor } from "@/components/editor/rich-text/RichTextEditor";
import { ChevronUp, ChevronDown, Trash2, Plus, CornerDownRight } from "lucide-react";
import type { BulletData, RichTextDoc } from "@/types/resume";

export function BulletListEditor({ sectionId, entryId, bullets }: { sectionId: string; entryId: string; bullets: BulletData[] }) {
  const addBullet = useResumeStore((s) => s.addBullet);
  const updateBulletContent = useResumeStore((s) => s.updateBulletContent);
  const removeBullet = useResumeStore((s) => s.removeBullet);
  const moveBullet = useResumeStore((s) => s.moveBullet);

  return (
    <div className="space-y-1.5">
      {bullets.map((bullet, i) => (
        <div key={bullet.id}>
          <BulletRow
            bullet={bullet}
            index={i}
            total={bullets.length}
            onChangeContent={(doc) => updateBulletContent(sectionId, entryId, bullet.id, doc)}
            onMove={(dir) => moveBullet(sectionId, entryId, bullet.id, dir)}
            onRemove={() => removeBullet(sectionId, entryId, bullet.id)}
            onAddSub={() => addBullet(sectionId, entryId, bullet.id)}
          />
          {bullet.children.length > 0 && (
            <div className="ml-6 mt-1.5 space-y-1.5">
              {bullet.children.map((child, ci) => (
                <BulletRow
                  key={child.id}
                  bullet={child}
                  index={ci}
                  total={bullet.children.length}
                  nested
                  onChangeContent={(doc) => updateBulletContent(sectionId, entryId, child.id, doc)}
                  onMove={(dir) => moveBullet(sectionId, entryId, child.id, dir)}
                  onRemove={() => removeBullet(sectionId, entryId, child.id)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => addBullet(sectionId, entryId)}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mt-1"
      >
        <Plus size={13} /> Add bullet
      </button>
    </div>
  );
}

function BulletRow({
  bullet,
  index,
  total,
  nested,
  onChangeContent,
  onMove,
  onRemove,
  onAddSub,
}: {
  bullet: BulletData;
  index: number;
  total: number;
  nested?: boolean;
  onChangeContent: (doc: RichTextDoc) => void;
  onMove: (dir: "up" | "down") => void;
  onRemove: () => void;
  onAddSub?: () => void;
}) {
  return (
    <div className="flex items-start gap-1.5">
      {nested && <CornerDownRight size={13} className="text-slate-300 mt-2 shrink-0" />}
      <span className="text-slate-400 mt-2 select-none">•</span>
      <RichTextEditor
        variant="inline"
        content={bullet.content}
        onChange={onChangeContent}
        placeholder="Describe an achievement or responsibility…"
        className="flex-1"
      />
      <div className="flex items-center shrink-0 mt-0.5">
        <button type="button" disabled={index === 0} onClick={() => onMove("up")} className="p-1 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30">
          <ChevronUp size={13} />
        </button>
        <button type="button" disabled={index === total - 1} onClick={() => onMove("down")} className="p-1 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30">
          <ChevronDown size={13} />
        </button>
        {onAddSub && (
          <button type="button" title="Add sub-bullet" onClick={onAddSub} className="p-1 rounded text-slate-400 hover:bg-slate-100">
            <CornerDownRight size={13} />
          </button>
        )}
        <button type="button" onClick={onRemove} className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-500">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
