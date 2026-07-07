'use client';

import { useState } from 'react';
import { CRMRecord, SkippedRecord } from '@/types';
import { STATUS_COLORS, STATUS_LABELS, truncateText } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ResultsTableProps {
  imported: CRMRecord[];
  skipped: SkippedRecord[];
  summary: {
    totalImported: number;
    totalSkipped: number;
    byStatus: Record<string, number>;
  };
}

const CRM_COLUMNS = [
  { key: 'name', label: 'Name', width: 'w-32' },
  { key: 'email', label: 'Email', width: 'w-40' },
  { key: 'mobile_without_country_code', label: 'Mobile', width: 'w-28' },
  { key: 'company', label: 'Company', width: 'w-32' },
  { key: 'city', label: 'City', width: 'w-24' },
  { key: 'state', label: 'State', width: 'w-28' },
  { key: 'country', label: 'Country', width: 'w-24' },
  { key: 'crm_status', label: 'Status', width: 'w-32' },
  { key: 'data_source', label: 'Source', width: 'w-28' },
  { key: 'crm_note', label: 'Notes', width: 'w-40' },
];

const DISPLAY_LIMIT = 50;

export default function ResultsTable({ imported, skipped, summary }: ResultsTableProps) {
  const [activeTab, setActiveTab] = useState<'imported' | 'skipped'>('imported');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleExport = () => {
    const headers = CRM_COLUMNS.map(c => c.key);
    const csvContent = [
      headers.join(','),
      ...imported.map(record => 
        headers.map(h => {
          const val = record[h as keyof CRMRecord];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n') 
            ? `"${str.replace(/"/g, '""')}"` 
            : str;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `groweasy-crm-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Total Imported"
          value={summary.totalImported}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <SummaryCard
          label="Total Skipped"
          value={summary.totalSkipped}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
        <SummaryCard
          label="Success Rate"
          value={summary.totalImported + summary.totalSkipped > 0 
            ? `${Math.round((summary.totalImported / (summary.totalImported + summary.totalSkipped)) * 100)}%`
            : '0%'}
          icon={<AlertCircle className="w-5 h-5" />}
          color="indigo"
        />
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-2">By Status</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byStatus).map(([status, count]) => (
              <span
                key={status}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]?.bg || 'bg-gray-100'} ${STATUS_COLORS[status]?.text || 'text-gray-800'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status]?.dot || 'bg-gray-500'}`} />
                {STATUS_LABELS[status] || status}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('imported')}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
            activeTab === 'imported'
              ? 'text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Successfully Imported ({imported.length})
          {activeTab === 'imported' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('skipped')}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
            activeTab === 'skipped'
              ? 'text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Skipped ({skipped.length})
          {activeTab === 'skipped' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {activeTab === 'imported' ? (
          <ImportedTable records={imported} expandedRow={expandedRow} setExpandedRow={setExpandedRow} />
        ) : (
          <SkippedTable records={skipped} />
        )}

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 text-center">
          Showing first {Math.min(DISPLAY_LIMIT, activeTab === 'imported' ? imported.length : skipped.length)} of {(activeTab === 'imported' ? imported.length : skipped.length).toLocaleString()} records
        </div>

        {(activeTab === 'imported' ? imported.length : skipped.length) === 0 && (
          <div className="px-4 py-12 text-center text-gray-500">
            {activeTab === 'imported' 
              ? 'No records were successfully imported.'
              : 'No records were skipped.'}
          </div>
        )}
      </div>

      {/* Export Button */}
      {imported.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleExport}
            className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
}

function ImportedTable({ 
  records, 
  expandedRow, 
  setExpandedRow 
}: { 
  records: CRMRecord[]; 
  expandedRow: number | null; 
  setExpandedRow: (v: number | null) => void;
}) {
  const displayRecords = records.slice(0, DISPLAY_LIMIT);

  return (
    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600 border-b border-gray-200 w-12">#</th>
            {CRM_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left font-medium text-gray-600 border-b border-gray-200 ${col.width} whitespace-nowrap`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {displayRecords.map((record, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-400 border-r border-gray-100">{idx + 1}</td>
              <td className="px-4 py-3 text-gray-900">{record.name || '-'}</td>
              <td className="px-4 py-3 text-gray-700">{record.email || '-'}</td>
              <td className="px-4 py-3 text-gray-700">
                {record.country_code && record.mobile_without_country_code 
                  ? `${record.country_code} ${record.mobile_without_country_code}`
                  : record.mobile_without_country_code || '-'}
              </td>
              <td className="px-4 py-3 text-gray-700">{record.company || '-'}</td>
              <td className="px-4 py-3 text-gray-700">{record.city || '-'}</td>
              <td className="px-4 py-3 text-gray-700">{record.state || '-'}</td>
              <td className="px-4 py-3 text-gray-700">{record.country || '-'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[record.crm_status]?.bg || 'bg-gray-100'} ${STATUS_COLORS[record.crm_status]?.text || 'text-gray-800'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[record.crm_status]?.dot || 'bg-gray-500'}`} />
                  {STATUS_LABELS[record.crm_status] || record.crm_status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-700">{record.data_source || '-'}</td>
              <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                <button
                  onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                  className="text-left hover:text-gray-700"
                >
                  {record.crm_note 
                    ? <span className="flex items-center gap-1">
                        {truncateText(record.crm_note, 30)}
                        {record.crm_note.length > 30 && (
                          expandedRow === idx ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </span>
                    : '-'}
                </button>
                {expandedRow === idx && record.crm_note && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs whitespace-pre-wrap">
                    {record.crm_note}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkippedTable({ records }: { records: SkippedRecord[] }) {
  const displayRecords = records.slice(0, DISPLAY_LIMIT);

  return (
    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600 border-b border-gray-200 w-12">#</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 border-b border-gray-200">Row</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 border-b border-gray-200 w-48">Reason</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 border-b border-gray-200">Original Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {displayRecords.map((record, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-400 border-r border-gray-100">{idx + 1}</td>
              <td className="px-4 py-3 text-gray-700">{record.rowIndex + 1}</td>
              <td className="px-4 py-3 text-red-600">{record.reason}</td>
              <td className="px-4 py-3 text-gray-500 text-xs max-w-[300px] truncate">
                {JSON.stringify(record.original)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'emerald' | 'red' | 'indigo' | 'amber';
}

function SummaryCard({ label, value, icon, color }: SummaryCardProps) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
      </div>
    </div>
  );
}
