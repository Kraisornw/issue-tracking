'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

interface RepeatedIssue {
  category: string;
  frequency: number;
  percentage: number;
}

interface OverdueIssue {
  issueId: string;
  project: string;
  category: string;
  priority: string;
  dueDate: string;
  daysOverdue: number;
}

interface TopicAgenda {
  name: string;
  open: number;
  closed: number;
  total: number;
  rate: number;
}

interface AggregateTablesProps {
  repeated: RepeatedIssue[];
  overdue: OverdueIssue[];
  topics: TopicAgenda[];
}

export function AggregateTables({ repeated, overdue, topics }: AggregateTablesProps) {
  
  const getPriorityColor = (pri: string) => {
    switch (pri.toLowerCase()) {
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'low': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* 1. Top Repeated Issues Table */}
      <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50 flex flex-col h-[380px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Top Repeated Issues
          </CardTitle>
          <CardDescription className="text-xs text-slate-450">Categories ranked by frequency</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-4 py-0">
          {repeated.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-16">No issues logged</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                <TableRow className="border-slate-200/60 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-bold h-9 text-xs">Category</TableHead>
                  <TableHead className="text-slate-500 font-bold h-9 text-xs text-right">Frequency</TableHead>
                  <TableHead className="text-slate-500 font-bold h-9 text-xs text-right">Share (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repeated.map((row, idx) => (
                  <TableRow key={idx} className="border-slate-100 hover:bg-slate-50/50 text-slate-700">
                    <TableCell className="font-medium text-slate-800 py-3 text-xs whitespace-normal break-words leading-relaxed max-w-[220px]">{row.category}</TableCell>
                    <TableCell className="text-right py-2.5 font-bold font-mono text-slate-800 text-xs">{row.frequency}</TableCell>
                    <TableCell className="text-right py-2.5 font-mono text-slate-500 text-xs">{row.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 2. Overdue Issues Table */}
      <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50 flex flex-col h-[380px] xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Overdue Issues
          </CardTitle>
          <CardDescription className="text-xs text-slate-455">Unresolved issues past due dates</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-4 py-0">
          {overdue.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-16">No overdue issues! Great job.</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                <TableRow className="border-slate-200/60 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-bold h-9 text-xs">Issue ID</TableHead>
                  <TableHead className="text-slate-500 font-bold h-9 text-xs">Priority</TableHead>
                  <TableHead className="text-slate-500 font-bold h-9 text-xs text-right">Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.map((row, idx) => (
                  <TableRow key={idx} className="border-slate-100 hover:bg-slate-50/50 text-slate-700">
                    <TableCell className="font-semibold text-slate-800 py-2.5 text-xs">
                      <div className="flex flex-col">
                        <span>{row.issueId}</span>
                        <span className="text-[10px] text-slate-400 font-normal whitespace-normal break-words leading-normal max-w-[150px]">{row.project}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border font-semibold ${getPriorityColor(row.priority)}`}>
                        {row.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-2.5 text-xs font-bold text-rose-600 font-mono">
                      <span className="flex items-center justify-end gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {row.daysOverdue}d
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 3. Top Topics / Agendas Table */}
      <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50 flex flex-col h-[380px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Top Topics / Agendas
          </CardTitle>
          <CardDescription className="text-xs text-slate-455">Meetings and agendas workload</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-4 py-0">
          {topics.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-16">No topics found</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                <TableRow className="border-slate-200/60 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-bold h-9 text-xs">Topic / Agenda</TableHead>
                  <TableHead className="text-slate-500 font-bold h-9 text-xs text-center">Pending</TableHead>
                  <TableHead className="text-slate-500 font-bold h-9 text-xs text-center">Completed</TableHead>
                  <TableHead className="text-slate-500 font-bold h-9 text-xs text-right">Resolution %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics.map((row, idx) => (
                  <TableRow key={idx} className="border-slate-100 hover:bg-slate-50/50 text-slate-700">
                    <TableCell className="font-medium text-slate-800 py-3 text-xs whitespace-normal break-words leading-relaxed max-w-[180px]" title={row.name}>{row.name}</TableCell>
                    <TableCell className="text-center py-2.5 font-bold text-amber-600 font-mono text-xs">{row.open}</TableCell>
                    <TableCell className="text-center py-2.5 font-bold text-emerald-600 font-mono text-xs">{row.closed}</TableCell>
                    <TableCell className="text-right py-2.5 font-bold font-mono text-xs">
                      <span className={row.rate >= 80 ? 'text-emerald-600' : row.rate >= 50 ? 'text-amber-600' : 'text-rose-600'}>
                        {row.rate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
