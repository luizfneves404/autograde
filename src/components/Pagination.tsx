// components/Pagination.tsx
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // How many page numbers to show on each side of the current page
  pageNeighbours?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageNeighbours = 1, // Default to 1 neighbor on each side
}) => {
  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page or none
  }

  // --- Helper function to generate the range of pages to display ---
  const fetchPageNumbers = () => {
    const totalNumbers = pageNeighbours * 2 + 3; // e.g., 1 ... 4 5 6 ... 10
    const totalBlocks = totalNumbers + 2;

    if (totalPages > totalBlocks) {
      const startPage = Math.max(2, currentPage - pageNeighbours);
      const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
      let pages: (number | string)[] = range(startPage, endPage);

      const hasLeftSpill = startPage > 2;
      const hasRightSpill = totalPages - endPage > 1;
      const spillOffset = totalNumbers - (pages.length + 1);

      switch (true) {
        // Handle Ellipsis on the right
        case hasLeftSpill && !hasRightSpill: {
          const extraPages = range(startPage - spillOffset, startPage - 1);
          pages = ['...', ...extraPages, ...pages];
          break;
        }
        // Handle Ellipsis on the left
        case !hasLeftSpill && hasRightSpill: {
          const extraPages = range(endPage + 1, endPage + spillOffset);
          pages = [...pages, ...extraPages, '...'];
          break;
        }
        // Handle Ellipsis on both sides
        case hasLeftSpill && hasRightSpill:
        default: {
          pages = ['...', ...pages, '...'];
          break;
        }
      }
      return [1, ...pages, totalPages];
    }

    return range(1, totalPages);
  };

  // --- Helper to create a range of numbers ---
  const range = (from: number, to: number, step = 1) => {
    let i = from;
    const range = [];
    while (i <= to) {
      range.push(i);
      i += step;
    }
    return range;
  };

  const pages = fetchPageNumbers();

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex justify-center items-center gap-2"
    >
      {/* --- Previous Button --- */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>

      {/* --- Page Number Buttons --- */}
      {pages.map((page, index) =>
        typeof page === 'number' ? (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page)}
            disabled={currentPage === page}
            className={`w-10 h-10 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              currentPage === page
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100'
            }`}
          >
            {page}
          </button>
        ) : (
          <span
            key={`ellipsis-${index}`}
            className="px-3 py-2 text-neutral-500"
          >
            ...
          </span>
        ),
      )}

      {/* --- Next Button --- */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Próximo
      </button>
    </nav>
  );
};

export default Pagination;
