"use client";

import { initials } from "../../lib/format";

type Props = {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ src, name, size = 36, className = "" }: Props) {
  const dim = { width: size, height: size };
  if (src) {
    // Use plain <img> to avoid Next/Image loader config requirements for arbitrary remote hosts.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || "avatar"}
        style={dim}
        className={`rounded-full object-cover bg-slate-200 ${className}`}
      />
    );
  }
  return (
    <div
      style={dim}
      className={`rounded-full bg-[#0a7a90] text-white inline-flex items-center justify-center font-semibold ${className}`}
    >
      <span style={{ fontSize: Math.max(10, Math.round(size / 2.6)) }}>
        {initials(name || "U").toUpperCase()}
      </span>
    </div>
  );
}
