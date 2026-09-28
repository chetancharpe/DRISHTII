import React, { useState, useRef, KeyboardEvent } from 'react';
import { Search, Table as TableIcon } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, rowIndex: number) => React.ReactNode;
}

export interface AccessibleDataTableProps<T = Record<string, any>> {
  caption: string;
  description?: string;
  columns?: ColumnDef<T>[];
  data?: T[];
  headers?: string[];
  rows?: (string | number)[][];
  searchable?: boolean;
  searchPlaceholder?: string;
  filterPredicate?: (row: T, query: string) => boolean;
  className?: string;
}

export function AccessibleDataTable<T extends Record<string, any> = Record<string, any>>({
  caption,
  description,
  columns,
  data,
  headers,
  rows,
  searchable = false,
  searchPlaceholder = 'Filter rows...',
  filterPredicate,
  className = '',
}: AccessibleDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  const tableRef = useRef<HTMLTableElement | null>(null);

  const effectiveColumns: ColumnDef<any>[] = React.useMemo(() => {
    if (columns && columns.length > 0) return columns;
    if (headers && headers.length > 0) {
      return headers.map((h, i) => ({
        key: `col_${i}`,
        header: h,
      }));
    }
    return [];
  }, [columns, headers]);

  const effectiveData: any[] = React.useMemo(() => {
    if (data && data.length > 0) return data;
    if (rows && rows.length > 0) {
      return rows.map((r, rIdx) => {
        const rowObj: Record<string, any> = { id: `row_${rIdx}` };
        r.forEach((cell, cIdx) => {
          rowObj[`col_${cIdx}`] = cell;
        });
        return rowObj;
      });
    }
    return [];
  }, [data, rows]);

  // Filter rows if search query is provided
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return effectiveData;
    const q = searchQuery.toLowerCase();
    if (filterPredicate) {
      return effectiveData.filter((row) => filterPredicate(row, q));
    }
    return effectiveData.filter((row) =>
      effectiveColumns.some((col) => {
        const val = row[col.key];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
      })
    );
  }, [effectiveData, searchQuery, effectiveColumns, filterPredicate]);

  // Handle accessible arrow key grid navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    if (!focusedCell) return;
    const totalRows = filteredData.length;
    const totalCols = effectiveColumns.length;

    let { row, col } = focusedCell;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (col < totalCols - 1) col++;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (col > 0) col--;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (row < totalRows - 1) row++;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (row > 0) row--;
    } else if (e.key === 'Home') {
      e.preventDefault();
      col = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      col = totalCols - 1;
    }

    if (row !== focusedCell.row || col !== focusedCell.col) {
      setFocusedCell({ row, col });
      // Focus element
      const targetCell = tableRef.current?.querySelector(
        `[data-row="${row}"][data-col="${col}"]`
      ) as HTMLElement | null;
      targetCell?.focus();
    }
  };

  const tableId = React.useId();
  const descId = `${tableId}-desc`;

  return (
    <div className={`flex flex-col gap-3 my-4 ${className}`}>
      {/* Search Bar if enabled */}
      {searchable && (
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={`Search rows in ${caption}`}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {searchQuery && (
            <span className="text-[11px] font-mono text-foreground-muted whitespace-nowrap">
              {filteredData.length} of {effectiveData.length}
            </span>
          )}
        </div>
      )}

      {description && (
        <p id={descId} className="sr-only">
          {description}
        </p>
      )}

      {/* Accessible Table Wrapper */}
      <div className="rounded-xl border border-border bg-surface overflow-x-auto shadow-xs">
        <table
          ref={tableRef}
          role="grid"
          aria-labelledby={`${tableId}-caption`}
          aria-describedby={description ? descId : undefined}
          onKeyDown={handleKeyDown}
          className="w-full text-xs text-left border-collapse"
        >
          <caption id={`${tableId}-caption`} className="text-left font-bold text-foreground text-sm p-4 border-b border-border bg-surface-elevated/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>{caption}</span>
              </div>
              <span className="text-[11px] font-mono font-normal text-foreground-muted">
                Navigate cells with Arrow Keys
              </span>
            </div>
          </caption>

          <thead>
            <tr className="border-b border-border bg-surface-elevated/60">
              {effectiveColumns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-foreground ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {filteredData.length > 0 ? (
              filteredData.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="hover:bg-surface-elevated/30 transition-colors"
                >
                  {effectiveColumns.map((col, cIdx) => {
                    const isFocused =
                      focusedCell?.row === rIdx && focusedCell?.col === cIdx;
                    return (
                      <td
                        key={col.key}
                        tabIndex={rIdx === 0 && cIdx === 0 ? 0 : isFocused ? 0 : -1}
                        data-row={rIdx}
                        data-col={cIdx}
                        onFocus={() => setFocusedCell({ row: rIdx, col: cIdx })}
                        className={`py-3 px-4 text-foreground outline-none transition-all ${
                          isFocused ? 'ring-2 ring-inset ring-primary bg-primary/5 font-semibold' : ''
                        } ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row, rIdx) : row[col.key]}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={effectiveColumns.length || 1}
                  className="p-6 text-center text-foreground-muted italic"
                >
                  No matching entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
