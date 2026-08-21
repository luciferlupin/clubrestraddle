import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = '',
  itemLabel = 'records',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  if (totalItems === 0) {
    return null;
  }

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav
      className={`custom-pagination ${className}`.trim()}
      aria-label="Pagination Navigation"
    >
      {/* Information text */}
      <div className="pagination-info">
        <span>
          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalItems}</strong> {itemLabel}
        </span>
      </div>

      {/* Navigation Controls */}
      <div className="pagination-controls">
        {/* First Page */}
        <button
          type="button"
          className="pagination-btn icon-btn"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          aria-label="Go to first page"
          title="First page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          className="pagination-btn prev-btn"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft size={16} />
          <span className="pagination-btn-label">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="pagination-numbers">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis" aria-hidden="true">
                  …
                </span>
              );
            }

            const pageNum = Number(page);
            const isActive = pageNum === safeCurrentPage;

            return (
              <button
                key={pageNum}
                type="button"
                className={`pagination-number ${isActive ? 'active' : ''}`}
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          className="pagination-btn next-btn"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
          aria-label="Go to next page"
        >
          <span className="pagination-btn-label">Next</span>
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          className="pagination-btn icon-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages}
          aria-label="Go to last page"
          title="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Page Size Selector */}
      {onPageSizeChange && (
        <div className="pagination-size-selector">
          <label htmlFor="pagination-page-size" className="pagination-size-label">
            Per page:
          </label>
          <select
            id="pagination-page-size"
            className="pagination-select"
            value={pageSize}
            onChange={e => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1); // reset to page 1 on page size change
            }}
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
};
