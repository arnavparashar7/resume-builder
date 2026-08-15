"use client";

import { useResumeStore } from "@/store/ResumeStoreProvider";
import { TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { X, Plus } from "lucide-react";

export function PersonalInfoForm() {
  const info = useResumeStore((s) => s.resume.personalInfo);
  const setPersonalInfo = useResumeStore((s) => s.setPersonalInfo);
  const addExtraLink = useResumeStore((s) => s.addExtraLink);
  const updateExtraLink = useResumeStore((s) => s.updateExtraLink);
  const removeExtraLink = useResumeStore((s) => s.removeExtraLink);

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h2>
      <TextInput label="Full name" value={info.name} onChange={(e) => setPersonalInfo({ name: e.target.value })} placeholder="Jane Doe" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput label="Email" type="email" value={info.email} onChange={(e) => setPersonalInfo({ email: e.target.value })} placeholder="jane@example.com" />
        <TextInput label="Phone" value={info.phone} onChange={(e) => setPersonalInfo({ phone: e.target.value })} placeholder="+1 555 123 4567" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput label="LinkedIn URL" value={info.linkedin} onChange={(e) => setPersonalInfo({ linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
        <TextInput label="Portfolio / Website" value={info.website} onChange={(e) => setPersonalInfo({ website: e.target.value })} placeholder="https://..." />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Additional links</span>
          <Button variant="ghost" size="sm" onClick={addExtraLink}>
            <Plus size={14} /> Add link
          </Button>
        </div>
        <div className="space-y-2">
          {info.extraLinks.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <TextInput
                className="flex-1"
                placeholder="Label (e.g. GitHub)"
                value={link.label}
                onChange={(e) => updateExtraLink(i, { label: e.target.value })}
              />
              <TextInput
                className="flex-[2]"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateExtraLink(i, { url: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeExtraLink(i)}
                className="mt-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label="Remove link"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {info.extraLinks.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500">No additional links yet.</p>}
        </div>
      </div>
    </div>
  );
}
