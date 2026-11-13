import React, { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
  isLoading = false,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
        <div className="inline-block animate-spin h-6 w-6 border-2 border-[#4A154B] border-t-transparent rounded-full" />
        <p className="mt-3 text-sm text-stone-500">Loading data from backend...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
        <p className="text-sm font-medium text-stone-600">{emptyMessage}</p>
        <p className="mt-1 text-xs text-stone-400">Try adjusting your filters or search keywords.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-stone-50/75 border-b border-stone-200 text-stone-600 text-xs font-semibold uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`py-3.5 px-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-stone-50/60 transition-colors"
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={`py-3.5 px-4 text-stone-700 ${col.className || ''}`}>
                    {col.cell ? col.cell(item) : (item as any)[col.accessorKey as any]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

