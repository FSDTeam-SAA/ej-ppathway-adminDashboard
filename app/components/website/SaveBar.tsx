"use client";

import { Button } from "../ui/Button";

export function SaveBar({
  onSave,
  onReset,
  saving,
  dirty,
  lastSavedAt
}: {
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  dirty: boolean;
  lastSavedAt?: string;
}) {
  return (
    <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-white border-t border-slate-200 flex flex-col items-stretch gap-3 z-10 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:-mx-8 md:px-8">
      <div className="text-xs text-slate-500">
        {dirty
          ? <span className="text-amber-600 font-medium">Unsaved changes</span>
          : lastSavedAt
            ? `Last saved ${new Date(lastSavedAt).toLocaleString()}`
            : "All changes saved"}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button variant="outline" size="md" onClick={onReset} disabled={!dirty || saving}>
          Discard
        </Button>
        <Button variant="primary" size="md" onClick={onSave} loading={saving} disabled={!dirty}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
