import type { RangeInput } from "./PDFsplitPreview.js";

export function RangeItem({
  range,
  index,
  totalPages,
  errors,
  onRemoveRange,
  onUpdateRange,
}: {
  range: RangeInput;
  totalPages: number;
  index: number;
  errors: Record<string, string>;
  onRemoveRange: (id: string) => void;
  onUpdateRange: (id: string, key: "start" | "end", value: string) => void;
}) {
  const rangeError = errors[range.id];
  return (
    <div key={range.id} className="rounded-lg border border-neutral-200 px-6 py-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-200">
          Range {index + 1}
        </p>

        <button
          type="button"
          onClick={() => onRemoveRange(range.id)}
          className="text-sm text-white"
        >
          <i className="fa fa-times bg-red-700 p-1 px-1.5 rounded-md"></i>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Start</span>
          <input
            type="number"
            min={1}
            max={totalPages || undefined}
            inputMode="numeric"
            value={range.start}
            onChange={(e) => onUpdateRange(range.id, "start", e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-red-500"
            placeholder="1"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">End</span>
          <input
            type="number"
            min={1}
            max={totalPages || undefined}
            inputMode="numeric"
            value={range.end}
            onChange={(e) => onUpdateRange(range.id, "end", e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-red-500"
            placeholder="3"
          />
        </label>
      </div>

      {rangeError && <p className="mt-2 text-xs text-red-600">{rangeError}</p>}
    </div>
  );
}
