"use client";

import type { LucideIcon } from "lucide-react";
import { Download, FileSpreadsheet, FileText, Table2 } from "lucide-react";

import { PortalDropdown } from "@/components/ui/portal-dropdown";
import { cn } from "@/utils";

type ExportMenuProps = {
  actions?: ExportMenuAction[];
  buttonClassName?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  onExportCsv?: (() => void) | null;
  onExportExcel?: (() => void) | null;
  onExportPdf?: (() => void) | null;
};

export type ExportMenuAction = {
  icon?: LucideIcon;
  id: string;
  label: string;
  onClick: () => void;
};

const menuItemClassName =
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:bg-[var(--color-surface-muted)]";

export function ExportMenu({
  actions: extraActions = [],
  buttonClassName,
  className,
  disabled = false,
  label = "Exportar",
  onExportCsv,
  onExportExcel,
  onExportPdf,
}: ExportMenuProps) {
  const actions = [
    onExportExcel
      ? {
          icon: FileSpreadsheet,
          id: "excel",
          label: "Exportar Excel",
          onClick: onExportExcel,
        }
      : null,
    onExportPdf
      ? {
          icon: FileText,
          id: "pdf",
          label: "Exportar PDF",
          onClick: onExportPdf,
        }
      : null,
    onExportCsv
      ? {
          icon: Table2,
          id: "csv",
          label: "Exportar CSV",
          onClick: onExportCsv,
        }
      : null,
    ...extraActions,
  ].filter((action): action is NonNullable<typeof action> => Boolean(action));

  if (actions.length === 0) {
    return null;
  }

  return (
    <PortalDropdown
      align="end"
      contentClassName={cn("min-w-[12rem]", className)}
      sideOffset={8}
      trigger={({ ref, ...triggerProps }) => (
        <button
          {...triggerProps}
          className={buttonClassName}
          disabled={disabled}
          ref={ref}
          type="button"
        >
          <Download className="h-4 w-4" />
          {label}
        </button>
      )}
    >
      {({ close }) => (
        <div className="grid gap-1">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.id}
                className={menuItemClassName}
                onClick={() => {
                  close();
                  action.onClick();
                }}
                type="button"
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </PortalDropdown>
  );
}
