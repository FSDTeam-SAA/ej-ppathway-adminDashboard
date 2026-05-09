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
      <div>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-slate-500 mt-1">{description}</p>
        )}
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="mt-1 flex items-center gap-1 text-sm">
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
      {action && <div>{action}</div>}
    </div>
  );
}
