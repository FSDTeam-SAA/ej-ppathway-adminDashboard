"use client";

import { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-500 mt-0.5">{description}</p> : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function FieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  const gridCls = cols === 3 ? "md:grid-cols-3" : cols === 2 ? "md:grid-cols-2" : "";
  return <div className={`grid grid-cols-1 ${gridCls} gap-4`}>{children}</div>;
}
