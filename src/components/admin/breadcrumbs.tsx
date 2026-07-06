"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

import { buildBreadcrumbs } from "@/lib/navigation";
import { cn } from "@/utils";

type BreadcrumbsProps = {
  homeHref?: string;
  homeLabel?: string;
};

export function Breadcrumbs({
  homeHref = "/admin",
  homeLabel = "Centro ERP",
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname, {
    homeHref,
    homeLabel,
  });

  return (
    <nav aria-label="Ruta de navegacion" className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1.5 text-xs text-[color:var(--color-text-muted)]">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isHome = index === 0;

          return (
            <li key={item.href} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 text-[color:var(--color-border-strong)]" />
              ) : null}
              {isLast ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[color:var(--color-text)]">
                  {isHome ? <Home className="h-3.5 w-3.5" /> : null}
                  {item.label}
                </span>
              ) : (
                <Link
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-medium transition hover:text-[color:var(--color-text)]",
                    isHome ? "text-[color:var(--color-text)]" : "text-[color:var(--color-text-muted)]",
                  )}
                  href={item.href}
                >
                  {isHome ? <Home className="h-3.5 w-3.5" /> : null}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
