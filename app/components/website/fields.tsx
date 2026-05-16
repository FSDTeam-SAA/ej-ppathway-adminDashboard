"use client";

import { Input } from "../ui/Input";
import { RepeatableList } from "./RepeatableList";

export type LinkValue = { label?: string; href?: string };

export function LinkField({
  label,
  value,
  onChange
}: {
  label: string;
  value: LinkValue | undefined;
  onChange: (v: LinkValue) => void;
}) {
  const v = value || {};
  return (
    <div>
      <div className="block mb-1.5 text-sm font-medium text-slate-700">{label}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input
          placeholder="Button label"
          value={v.label || ""}
          onChange={(e) => onChange({ ...v, label: e.target.value })}
        />
        <Input
          placeholder="https://… or /path"
          value={v.href || ""}
          onChange={(e) => onChange({ ...v, href: e.target.value })}
        />
      </div>
    </div>
  );
}

export function BulletList({
  label,
  description,
  items,
  onChange,
  placeholder
}: {
  label?: string;
  description?: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <RepeatableList
      label={label}
      description={description}
      items={items || []}
      newItem={() => ""}
      addLabel="Add item"
      onChange={onChange}
      itemTitle={(_, i) => `Item ${i + 1}`}
      renderItem={(item, _i, update) => (
        <Input
          placeholder={placeholder || "Type text…"}
          value={item}
          onChange={(e) => update(e.target.value)}
        />
      )}
    />
  );
}
