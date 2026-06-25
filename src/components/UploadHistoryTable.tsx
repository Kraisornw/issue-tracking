'use client';

import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UploadHistory } from '@/types';
import { ChevronDown, ChevronUp, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface UploadHistoryTableProps {
  history: UploadHistory[];
}

export function UploadHistoryTable({ history }: UploadHistoryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm shadow-slate-100/50">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="border-slate-200 hover:bg-transparent">
            <TableHead className="w-[40px]"></TableHead>
            <TableHead className="text-slate-500 font-bold">Upload Date</TableHead>
            <TableHead className="text-slate-500 font-bold">File Name</TableHead>
            <TableHead className="text-slate-500 font-bold text-center">Total Rows</TableHead>
            <TableHead className="text-slate-500 font-bold text-center">New</TableHead>
            <TableHead className="text-slate-500 font-bold text-center">Updated</TableHead>
            <TableHead className="text-slate-500 font-bold text-center">Duration</TableHead>
            <TableHead className="text-slate-500 font-bold text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableCell colSpan={8} className="h-32 text-center text-slate-400 text-sm">
                No uploads recorded yet. Upload an Excel file to get started.
              </TableCell>
            </TableRow>
          ) : (
            history.map((record) => {
              const recordId = record.id || `hist-${record.uploadDate}`;
              const isExpanded = expandedId === recordId;
              const hasErrors = record.errors && record.errors.length > 0;
              
              return (
                <>
                  <TableRow 
                    key={recordId} 
                    className={`border-slate-100 hover:bg-slate-50/50 text-slate-700 transition-colors ${
                      record.status === 'failed' ? 'hover:bg-rose-50/20' : ''
                    }`}
                  >
                    <TableCell className="p-2 text-center">
                      {hasErrors ? (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-slate-450 hover:text-slate-700 hover:bg-slate-100"
                          onClick={() => toggleRow(recordId)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs py-3">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-medium">{formatDate(record.uploadDate)}</span>
                        <span className="text-[10px] text-slate-450 mt-0.5">
                          {formatDistanceToNow(parseISO(record.uploadDate), { addSuffix: true })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className={`w-4 h-4 ${record.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
                        <span className="truncate max-w-[200px] sm:max-w-md">{record.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold font-mono text-xs text-slate-850">{record.totalRecords}</TableCell>
                    <TableCell className="text-center font-bold font-mono text-xs text-emerald-600">{record.status === 'success' ? `+${record.newRecords}` : '-'}</TableCell>
                    <TableCell className="text-center font-bold font-mono text-xs text-blue-600">{record.status === 'success' ? `~${record.updatedRecords}` : '-'}</TableCell>
                    <TableCell className="text-center font-mono text-xs text-slate-500">{formatTime(record.processingTimeMs)}</TableCell>
                    <TableCell className="text-right py-2">
                      <Badge className={
                        record.status === 'success' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold'
                      }>
                        {record.status === 'success' ? 'Success' : 'Failed'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded error row */}
                  {isExpanded && hasErrors && (
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50 border-slate-100">
                      <TableCell colSpan={8} className="p-4">
                        <div className="space-y-2 bg-white rounded-lg p-4 border border-rose-200 shadow-sm">
                          <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5 uppercase tracking-wider">
                            <AlertCircle className="w-4 h-4" /> Validation Failure Log ({record.errors?.length} items)
                          </p>
                          <ul className="text-xs text-slate-600 space-y-1 max-h-40 overflow-y-auto pl-1 pr-2 font-mono">
                            {record.errors?.map((err, idx) => (
                              <li key={idx} className="flex gap-2 items-start py-1 border-b border-slate-100 last:border-0">
                                <span className="text-rose-600">•</span>
                                <span>{err}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
