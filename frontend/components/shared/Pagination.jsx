"use client";

// Builds a windowed page list: 1 … (current-1) current (current+1) … total
function getPageWindow(current, total, siblingCount = 1) {
  const totalNumbers = siblingCount * 2 + 5;
  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
    return [...leftRange, "...", total];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => total - (3 + siblingCount * 2) + i + 1
    );
    return [1, "...", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i
  );
  return [1, "...", ...middleRange, "...", total];
}

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        ‹
      </button>

      {getPageWindow(page, totalPages).map((item, i) =>
        item === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={`w-9 h-9 rounded-full text-sm font-medium transition ${
              page === item
                ? "bg-primary-dark text-white shadow-sm"
                : "bg-white text-primary-dark border border-gray-200 hover:border-primary-dark hover:bg-orange-50"
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        ›
      </button>
    </div>
  );
}