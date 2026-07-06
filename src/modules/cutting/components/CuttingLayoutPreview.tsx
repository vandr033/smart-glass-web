import type { CuttingPlanSheetRecord } from "@/types";

import { formatCuttingDimension } from "../ui";

type CuttingLayoutPreviewProps = {
  sheet: Pick<
    CuttingPlanSheetRecord,
    "heightMm" | "layoutJson" | "sheetSource" | "widthMm"
  >;
};

const labelFits = (widthMm: number, heightMm: number) => {
  return widthMm >= 220 && heightMm >= 120;
};

export function CuttingLayoutPreview({ sheet }: CuttingLayoutPreviewProps) {
  const pieces = sheet.layoutJson.pieces;
  const remnantOutputs = sheet.layoutJson.remnantOutputs;

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-[linear-gradient(180deg,#ffffff,#f5f8fb)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            {sheet.sheetSource.replaceAll("_", " ")}
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-950">
            {formatCuttingDimension(sheet.widthMm)} × {formatCuttingDimension(sheet.heightMm)}
          </p>
        </div>
        <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
          {pieces.length} pieces
        </div>
      </div>

      <svg
        aria-label="Cutting sheet layout"
        className="h-auto w-full rounded-[1rem] bg-stone-50"
        viewBox={`0 0 ${sheet.widthMm} ${sheet.heightMm}`}
      >
        <defs>
          <pattern
            id={`remnant-pattern-${sheet.widthMm}-${sheet.heightMm}`}
            height="80"
            patternUnits="userSpaceOnUse"
            width="80"
          >
            <path
              d="M0 0 L80 80"
              stroke="rgba(180,83,9,0.22)"
              strokeWidth="10"
            />
          </pattern>
        </defs>

        <rect
          fill="#f8fafc"
          height={sheet.heightMm}
          rx={24}
          stroke="#1f2937"
          strokeWidth={12}
          width={sheet.widthMm}
          x={0}
          y={0}
        />

        {remnantOutputs.map((remnant, index) => (
          <g key={`${remnant.xMm}-${remnant.yMm}-${index}`}>
            <rect
              fill={`url(#remnant-pattern-${sheet.widthMm}-${sheet.heightMm})`}
              height={remnant.heightMm}
              stroke={remnant.shouldCreateRemnant ? "#b45309" : "#9ca3af"}
              strokeDasharray="24 12"
              strokeWidth={8}
              width={remnant.widthMm}
              x={remnant.xMm}
              y={remnant.yMm}
            />
            {labelFits(remnant.widthMm, remnant.heightMm) ? (
              <text
                fill="#92400e"
                fontSize={46}
                fontWeight={700}
                x={remnant.xMm + remnant.widthMm / 2}
                y={remnant.yMm + remnant.heightMm / 2}
                textAnchor="middle"
              >
                {remnant.shouldCreateRemnant ? "REMNANT" : "WASTE"}
              </text>
            ) : null}
          </g>
        ))}

        {pieces.map((piece) => (
          <g key={piece.pieceId}>
            <rect
              fill={piece.rotated ? "#bfdbfe" : "#dbeafe"}
              height={piece.heightMm}
              rx={18}
              stroke="#1d4ed8"
              strokeWidth={8}
              width={piece.widthMm}
              x={piece.xMm}
              y={piece.yMm}
            />
            {labelFits(piece.widthMm, piece.heightMm) ? (
              <>
                <text
                  fill="#1e3a8a"
                  fontSize={52}
                  fontWeight={700}
                  x={piece.xMm + piece.widthMm / 2}
                  y={piece.yMm + piece.heightMm / 2 - 10}
                  textAnchor="middle"
                >
                  {piece.label}
                </text>
                <text
                  fill="#1e40af"
                  fontSize={40}
                  x={piece.xMm + piece.widthMm / 2}
                  y={piece.yMm + piece.heightMm / 2 + 42}
                  textAnchor="middle"
                >
                  {Math.round(piece.widthMm)} × {Math.round(piece.heightMm)}
                </text>
              </>
            ) : null}
          </g>
        ))}
      </svg>

      {sheet.layoutJson.warnings.length > 0 ? (
        <div className="mt-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {sheet.layoutJson.warnings.join(" ")}
        </div>
      ) : null}
    </div>
  );
}
