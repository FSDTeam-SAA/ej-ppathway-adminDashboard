import Link from "next/link";
import { ChevronRightIcon } from "./Icons";

export function PageHeader({
  title,
  breadcrumb,
  action,
  description,
}: {
  title: string;
  breadcrumb?: { label: string; href?: string }[];
  action?: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1 sm:text-base">{description}</p>
        )}
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1 text-sm">
            {breadcrumb.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {b.href ? (
                  <Link
                    href={b.href}
                    className="text-slate-500 hover:text-[#0a7a90]"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-[#0a7a90] font-medium">{b.label}</span>
                )}
                {i < breadcrumb.length - 1 && (
                  <ChevronRightIcon size={14} className="text-slate-400" />
                )}
              </span>
            ))}
          </div>
        )}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}
