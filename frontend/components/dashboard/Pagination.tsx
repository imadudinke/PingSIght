import { cn } from "@/lib/utils/ui";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalRecords, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[#15171a]">
      <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
        PAGE_{currentPage}_OF_{totalPages}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "h-8 w-8 grid place-items-center",
            "border border-[#2a2d31]",
            "text-[11px] tracking-[0.26em] uppercase",
            "transition",
            currentPage === 1
              ? "bg-[rgba(255,255,255,0.01)] text-[#3f4247] cursor-not-allowed"
              : "bg-[rgba(255,255,255,0.02)] text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42]"
          )}
          aria-label="Previous page"
        >
          ‹
        </button>

        {getPageNumbers().map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="h-8 w-8 grid place-items-center text-[#5f636a] text-[11px]"
              >
                ···
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "h-8 w-8 grid place-items-center",
                "border",
                "text-[11px] tracking-[0.26em] uppercase",
                "transition",
                isActive
                  ? "border-[#f2d48a] bg-[rgba(242,212,138,0.08)] text-[#f2d48a]"
                  : "border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42]"
              )}
              aria-label={`Page ${pageNum}`}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "h-8 w-8 grid place-items-center",
            "border border-[#2a2d31]",
            "text-[11px] tracking-[0.26em] uppercase",
            "transition",
            currentPage === totalPages
              ? "bg-[rgba(255,255,255,0.01)] text-[#3f4247] cursor-not-allowed"
              : "bg-[rgba(255,255,255,0.02)] text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42]"
          )}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
        TOTAL_RECORDS: {totalRecords}
      </div>
    </div>
  );
}
