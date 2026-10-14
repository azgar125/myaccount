import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const PAGE_SIZES = [10, 25, 50, 100];

export default function Pagination({
  page = 1,
  lastPage = 1,
  total = 0,
  perPage = 25,
  onChange,
  onPerPageChange,
  className = '',
}) {
  if (lastPage <= 0) return null;

  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  const pages = buildPageList(page, lastPage);

  return (
    <div className={clsx('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4', className)}>
      {/* Info + per page */}
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className="hidden sm:inline">
          Showing <span className="font-medium text-slate-900">{from}</span>–<span className="font-medium text-slate-900">{to}</span> of{' '}
          <span className="font-medium text-slate-900">{total}</span>
        </span>

        {onPerPageChange && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Rows:</label>
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page buttons */}
      <nav className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-slate-400 select-none">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={clsx(
                'min-w-[32px] h-8 px-2 text-sm rounded-lg font-medium transition-colors',
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onChange(Math.min(lastPage, page + 1))}
          disabled={page >= lastPage}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}

function buildPageList(current, last) {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages = [];
  const left  = Math.max(2, current - 1);
  const right = Math.min(last - 1, current + 1);

  pages.push(1);
  if (left > 2) pages.push('...');

  for (let i = left; i <= right; i++) pages.push(i);

  if (right < last - 1) pages.push('...');
  pages.push(last);

  return pages;
}