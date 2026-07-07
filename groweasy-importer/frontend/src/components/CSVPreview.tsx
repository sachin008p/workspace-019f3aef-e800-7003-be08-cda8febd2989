'use client';

import { CSVRecord } from '@/types';
import { FileSpreadsheet, Rows3, Columns2 } from 'lucide-react';

interface CSVPreviewProps {
  records: CSVRecord[];
  columns: string[];
  totalRows: number;
  fileName: string;
  onContinue: () => void;
  onBack: () => void;
}

export default function CSVPreview({
  records,
  columns,
  totalRows,
  fileName,
  onContinue,
  onBack,
}: CSVPreviewProps) {
  const displayRecords = records.slice(0, 50);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">CSV Preview</h2>
            <p className="text-sm text-gray-500">{fileName}</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
            <Rows3 className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              <span className="font-medium text-gray-900">{totalRows.toLocaleString()}</span>
              <span className="text-gray-500"> rows</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
            <Columns2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              <span className="font-medium text-gray-900">{columns.length}</span>
              <span className="text-gray-500"> columns</span>
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 border-b border-gray-200 w-12">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left font-medium text-gray-600 border-b border-gray-200 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 border-r border-gray-100">
                    {idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-3 text-gray-700 max-w-[200px] truncate"
                      title={String(record[col] ?? '')}
                    >
                      {String(record[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalRows > 50 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 text-center">
            Showing first 50 of {totalRows.toLocaleString()} rows
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          ← Upload Different File
        </button>
        <button
          onClick={onContinue}
          className="px-8 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Continue to Import →
        </button>
      </div>
    </div>
  );
}
