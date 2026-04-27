export function Paginator({
  total,
  limit = 15,
  currentPage,
  onPageChange,
}: {
  total: number;
  limit?: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  function getPages(): (number | "...")[] {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (currentPage >= totalPages - 3)
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }

  const base =
    "min-w-[36px] h-9 px-4 rounded-md border border-gray-200 text-sm flex items-center justify-center transition-colors";
  const active = "bg-red-600 text-white border-gray-900 font-medium";
  const inactive =
    "bg-transparent text-gray-100 hover:bg-gray-100 hover:text-black";
  const disabledCls = "opacity-35 cursor-not-allowed";

  return (
    <div className="flex flex-col items-center gap-4 my-12">
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${base} ${currentPage === 1 ? disabledCls : inactive}`}
        >
          ← Prev
        </button>
        {getPages().map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="text-gray-400 px-1 text-sm">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`${base} ${page === currentPage ? active : inactive}`}
            >
              {page}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${base} ${currentPage === totalPages ? disabledCls : inactive}`}
        >
          Next →
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Page {currentPage} of {totalPages}
      </p>
    </div>
  );
}