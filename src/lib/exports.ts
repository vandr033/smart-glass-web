"use client";

type ExportColumn<TRow> = {
  header: string;
  key?: string;
  value: (row: TRow) => unknown;
};

type TabularExportConfig<TRow> = {
  columns?: ExportColumn<TRow>[];
  fileName?: string;
  mapRow?: (row: TRow) => Record<string, unknown>;
  subtitle?: string;
  title?: string;
};

const FILE_NAME_DATE_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "short",
});

const GENERATED_AT_FORMATTER = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
});

const normalizeExportValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeExportValue(item)).join(", ");
  }

  if (value instanceof Date) {
    return GENERATED_AT_FORMATTER.format(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const escapeCsvValue = (value: string): string => {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
};

const escapeHtml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const sanitizeFileName = (value: string): string => {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const withFileExtension = (fileName: string, extension: string): string => {
  const normalizedName = sanitizeFileName(fileName) || "exportacion";
  return normalizedName.replace(/\.[^.]+$/, "") + extension;
};

const defaultBaseFileName = (): string => {
  return `exportacion-${FILE_NAME_DATE_FORMATTER.format(new Date())}`;
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(objectUrl);
};

const buildExportRecords = <TRow>(
  rows: TRow[],
  config?: TabularExportConfig<TRow>,
): Record<string, string>[] => {
  if (config?.columns) {
    return rows.map((row) =>
      Object.fromEntries(
        config.columns!.map((column) => [column.header, normalizeExportValue(column.value(row))]),
      ),
    );
  }

  return rows.map((row) => {
    const record = config?.mapRow
      ? config.mapRow(row)
      : (row as Record<string, unknown>);

    return Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, normalizeExportValue(value)]),
    );
  });
};

const buildTableMarkup = (
  records: Record<string, string>[],
  options: {
    subtitle?: string;
    title: string;
  },
): string => {
  const headers = Object.keys(records[0] ?? {});
  const headerMarkup = headers
    .map(
      (header) =>
        `<th style="border:1px solid #d6d3d1;padding:10px 12px;background:#f5f5f4;text-align:left;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#57534e;">${escapeHtml(header)}</th>`,
    )
    .join("");
  const rowsMarkup = records
    .map((record) => {
      const cells = headers
        .map(
          (header) =>
            `<td style="border:1px solid #e7e5e4;padding:10px 12px;font-size:13px;color:#292524;vertical-align:top;">${escapeHtml(record[header] ?? "")}</td>`,
        )
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
    <header style="margin-bottom:24px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#0f5bd7;font-weight:700;">Exportacion ERP</p>
      <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;color:#1c1917;">${escapeHtml(options.title)}</h1>
      ${
        options.subtitle
          ? `<p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#57534e;">${escapeHtml(options.subtitle)}</p>`
          : ""
      }
      <p style="margin:10px 0 0;font-size:12px;color:#78716c;">Generado el ${escapeHtml(
        GENERATED_AT_FORMATTER.format(new Date()),
      )}</p>
    </header>
    <table style="width:100%;border-collapse:collapse;"> 
      <thead><tr>${headerMarkup}</tr></thead>
      <tbody>${rowsMarkup}</tbody>
    </table>
  `;
};

export const exportRowsToCsv = <TRow>(
  rows: TRow[],
  config?: TabularExportConfig<TRow>,
) => {
  if (rows.length === 0 || typeof document === "undefined") {
    return;
  }

  const records = buildExportRecords(rows, config);
  const headers = Object.keys(records[0] ?? {});
  const lines = [
    headers.map((header) => escapeCsvValue(header)).join(","),
    ...records.map((record) =>
      headers
        .map((header) => escapeCsvValue(record[header] ?? ""))
        .join(","),
    ),
  ];

  downloadBlob(
    new Blob(["\uFEFF", lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    }),
    withFileExtension(config?.fileName ?? defaultBaseFileName(), ".csv"),
  );
};

export const exportRowsToExcel = <TRow>(
  rows: TRow[],
  config?: TabularExportConfig<TRow>,
) => {
  if (rows.length === 0 || typeof document === "undefined") {
    return;
  }

  const records = buildExportRecords(rows, config);
  const tableMarkup = buildTableMarkup(records, {
    subtitle: config?.subtitle,
    title: config?.title ?? "Reporte",
  });
  const workbookMarkup = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>${tableMarkup}</body>
    </html>
  `;

  downloadBlob(
    new Blob(["\uFEFF", workbookMarkup], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    }),
    withFileExtension(config?.fileName ?? defaultBaseFileName(), ".xls"),
  );
};

export const exportRowsToPdf = <TRow>(
  rows: TRow[],
  config?: TabularExportConfig<TRow>,
) => {
  if (rows.length === 0 || typeof window === "undefined") {
    return;
  }

  const records = buildExportRecords(rows, config);
  const printableWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");

  if (!printableWindow) {
    throw new Error("No se pudo abrir la ventana de impresion para exportar el PDF.");
  }

  printableWindow.document.write(`
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(config?.title ?? "Reporte")}</title>
        <style>
          body {
            font-family: "Segoe UI", sans-serif;
            margin: 32px;
            color: #1c1917;
          }

          @media print {
            body {
              margin: 18px;
            }
          }
        </style>
      </head>
      <body>
        ${buildTableMarkup(records, {
          subtitle: config?.subtitle,
          title: config?.title ?? "Reporte",
        })}
      </body>
    </html>
  `);
  printableWindow.document.close();
  printableWindow.focus();

  printableWindow.addEventListener(
    "load",
    () => {
      printableWindow.print();
    },
    { once: true },
  );
};

export const exportHtmlToPdf = (input: {
  bodyClassName?: string;
  html: string;
  styles?: string;
  title: string;
}) => {
  if (typeof window === "undefined") {
    return;
  }

  const printableWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");

  if (!printableWindow) {
    throw new Error("No se pudo abrir la ventana de impresion para exportar el PDF.");
  }

  printableWindow.document.write(`
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(input.title)}</title>
        <style>
          body {
            font-family: "Segoe UI", sans-serif;
            margin: 24px;
            color: #1c1917;
            background: #ffffff;
          }

          @media print {
            body {
              margin: 16px;
            }
          }

          ${input.styles ?? ""}
        </style>
      </head>
      <body class="${escapeHtml(input.bodyClassName ?? "")}">
        ${input.html}
      </body>
    </html>
  `);
  printableWindow.document.close();
  printableWindow.focus();

  printableWindow.addEventListener(
    "load",
    () => {
      printableWindow.print();
    },
    { once: true },
  );
};

export type { ExportColumn, TabularExportConfig };
