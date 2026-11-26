"use client";

import { useState } from "react";
import type { SizeGuideChart } from "@/lib/admin/catalogue";
import { buttonClass } from "@/components/admin/ui";

const cell =
  "h-12 w-full min-w-20 rounded-md border border-line bg-surface-2 px-2 text-center text-base text-ink outline-none focus:border-silver";

/**
 * Editable measurement table. Scrolls sideways on a phone. The chart is sent
 * to the server as JSON in a hidden field of the surrounding form.
 */
export function ChartEditor({ initial }: { initial: SizeGuideChart }) {
  const [chart, setChart] = useState<SizeGuideChart>(initial);

  const setColumn = (index: number, value: string) =>
    setChart((c) => ({ ...c, columns: c.columns.map((col, i) => (i === index ? value : col)) }));

  const addColumn = () =>
    setChart((c) => ({ columns: [...c.columns, ""], rows: c.rows.map((r) => ({ ...r, values: [...r.values, ""] })) }));

  const removeColumn = (index: number) =>
    setChart((c) => ({
      columns: c.columns.filter((_, i) => i !== index),
      rows: c.rows.map((r) => ({ ...r, values: r.values.filter((_, i) => i !== index) })),
    }));

  const setCell = (rowIndex: number, colIndex: number, value: string) =>
    setChart((c) => ({
      ...c,
      rows: c.rows.map((r, i) =>
        i === rowIndex ? { ...r, values: r.values.map((v, j) => (j === colIndex ? value : v)) } : r,
      ),
    }));

  const setSize = (rowIndex: number, value: string) =>
    setChart((c) => ({ ...c, rows: c.rows.map((r, i) => (i === rowIndex ? { ...r, size: value } : r)) }));

  const addRow = () => setChart((c) => ({ ...c, rows: [...c.rows, { size: "", values: c.columns.map(() => "") }] }));
  const removeRow = (index: number) => setChart((c) => ({ ...c, rows: c.rows.filter((_, i) => i !== index) }));

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-max min-w-full border-separate border-spacing-1">
          <thead>
            <tr>
              <th scope="col" className="w-20 text-left text-xs uppercase tracking-[0.2em] text-ink-muted">
                Size
              </th>
              {chart.columns.map((column, colIndex) => (
                <th key={colIndex} scope="col">
                  <div className="flex items-center gap-1">
                    <input
                      aria-label={`Measurement ${colIndex + 1} name`}
                      value={column}
                      placeholder="e.g. Chest"
                      maxLength={40}
                      onChange={(e) => setColumn(colIndex, e.target.value)}
                      className={`${cell} font-semibold`}
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${column || "measurement"}`}
                      onClick={() => removeColumn(colIndex)}
                      disabled={chart.columns.length <= 1}
                      className="h-12 w-8 shrink-0 text-ink-muted disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>
                  <input
                    aria-label={`Size for row ${rowIndex + 1}`}
                    value={row.size}
                    maxLength={20}
                    onChange={(e) => setSize(rowIndex, e.target.value)}
                    className={`${cell} min-w-16 font-semibold`}
                  />
                </td>
                {row.values.map((value, colIndex) => (
                  <td key={colIndex}>
                    <input
                      aria-label={`${chart.columns[colIndex] || "Measurement"} for ${row.size || "size"}`}
                      value={value}
                      inputMode="decimal"
                      maxLength={20}
                      onChange={(e) => setCell(rowIndex, colIndex, e.target.value)}
                      className={cell}
                    />
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    aria-label={`Remove row ${row.size}`}
                    onClick={() => removeRow(rowIndex)}
                    disabled={chart.rows.length <= 1}
                    className="h-12 w-10 text-ink-muted disabled:opacity-30"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addColumn} disabled={chart.columns.length >= 10} className={buttonClass.secondary}>
          + Measurement
        </button>
        <button type="button" onClick={addRow} disabled={chart.rows.length >= 20} className={buttonClass.secondary}>
          + Size row
        </button>
      </div>
      <input type="hidden" name="chart" value={JSON.stringify(chart)} />
    </div>
  );
}
