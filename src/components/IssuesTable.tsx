'use client';

import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Search,
  Eye,
  Trash2
} from 'lucide-react';
import { Issue } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

interface IssuesTableProps {
  issues: Issue[];
  filters: any;
  onDeleteIssue?: (issueId: string) => void;
}

export function IssuesTable({ issues, filters, onDeleteIssue }: IssuesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Issue>('openDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Status Badge Colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Progress': return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-semibold">In Progress</Badge>;
      case 'Pending': return <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 font-semibold">Pending</Badge>;
      case 'Completed': 
      case 'Closed': 
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Priority Badge Colors
  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold">High</Badge>;
      case 'medium': return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 font-semibold">Medium</Badge>;
      case 'low': return <Badge className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-semibold">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const handleSort = (field: keyof Issue) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Apply filters and search term client-side
  const processedIssues = useMemo(() => {
    let result = [...issues];

    // Apply global sidebar filters
    if (filters.project) result = result.filter(i => i.project === filters.project);
    if (filters.category) result = result.filter(i => i.category === filters.category);
    if (filters.discipline) result = result.filter(i => i.discipline === filters.discipline);
    if (filters.status) result = result.filter(i => i.status === filters.status);
    if (filters.priority) result = result.filter(i => i.priority === filters.priority);
    if (filters.severity) result = result.filter(i => i.severity === filters.severity);
    if (filters.responsible) result = result.filter(i => i.responsible === filters.responsible);
    if (filters.location) result = result.filter(i => i.location === filters.location);
    if (filters.startDate) result = result.filter(i => i.openDate >= filters.startDate);
    if (filters.endDate) result = result.filter(i => i.openDate <= filters.endDate);

    // Apply real-time search term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        i => 
          i.issueId.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.project.toLowerCase().includes(q) ||
          i.responsible.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }

    // Sort issues
    result.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [issues, filters, searchTerm, sortField, sortDirection]);

  // Pagination calculations
  const totalItems = processedIssues.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedIssues.slice(start, start + pageSize);
  }, [processedIssues, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Search and Page Size controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
          <Input 
            placeholder="Search issues table..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-white border-slate-200 text-slate-800 placeholder:text-slate-450 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Show</span>
          <select 
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
          <span className="text-xs text-slate-500 font-medium">of {totalItems} entries</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200/80 rounded-xl bg-white overflow-x-auto shadow-sm shadow-slate-100/60">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="w-[100px] text-slate-600 font-bold">
                <Button variant="ghost" className="p-0 hover:bg-transparent hover:text-slate-800 text-xs font-bold" onClick={() => handleSort('issueId')}>
                  Issue ID <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-600 font-bold">
                <Button variant="ghost" className="p-0 hover:bg-transparent hover:text-slate-800 text-xs font-bold" onClick={() => handleSort('openDate')}>
                  Date <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-600 font-bold">
                <Button variant="ghost" className="p-0 hover:bg-transparent hover:text-slate-800 text-xs font-bold" onClick={() => handleSort('project')}>
                  Topic / Agenda <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-600 font-bold">Discussion</TableHead>
              <TableHead className="text-slate-600 font-bold">Action Item</TableHead>
              <TableHead className="text-slate-600 font-bold">Due Date</TableHead>
              <TableHead className="text-slate-600 font-bold">Priority</TableHead>
              <TableHead className="text-slate-600 font-bold">
                <Button variant="ghost" className="p-0 hover:bg-transparent hover:text-slate-800 text-xs font-bold" onClick={() => handleSort('status')}>
                  Status <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead className="text-slate-600 font-bold">Comment</TableHead>
              <TableHead className="text-slate-600 font-bold w-[100px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedIssues.length === 0 ? (
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableCell colSpan={10} className="h-32 text-center text-slate-400 text-sm">
                  No issues found. Try adjusting filters or upload a new file.
                </TableCell>
              </TableRow>
            ) : (
              paginatedIssues.map((issue) => (
                <TableRow key={issue.issueId} className="border-slate-200/60 hover:bg-slate-50/50 text-slate-700">
                  <TableCell className="font-mono font-bold text-indigo-600 py-3">{issue.issueId}</TableCell>
                  <TableCell className="font-mono text-slate-500">{issue.openDate}</TableCell>
                  <TableCell className="font-medium text-slate-800">{issue.project}</TableCell>
                  <TableCell className="text-slate-750">{issue.category}</TableCell>
                  <TableCell className="truncate max-w-[200px] text-slate-600" title={issue.description}>
                    {issue.description}
                  </TableCell>
                  <TableCell className="font-mono text-slate-500">{issue.dueDate}</TableCell>
                  <TableCell>{getPriorityBadge(issue.priority)}</TableCell>
                  <TableCell>{getStatusBadge(issue.status)}</TableCell>
                  <TableCell className="truncate max-w-[150px] text-slate-500" title={issue.location}>
                    {issue.location || '-'}
                  </TableCell>
                  <TableCell className="text-center py-2 flex items-center justify-center gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" 
                      onClick={() => setSelectedIssue(issue)}
                      title="ดูรายละเอียด"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {onDeleteIssue && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                        onClick={() => {
                          if (confirm(`คุณต้องการลบ Issue รหัส ${issue.issueId} ใช่หรือไม่?`)) {
                            onDeleteIssue(issue.issueId);
                          }
                        }}
                        title="ลบ Issue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-slate-500 font-medium">
          Showing {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} records
        </p>
        <div className="flex items-center gap-1.5">
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 shadow-sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-xs text-slate-600 font-bold px-3">
            Page {currentPage} of {totalPages}
          </span>

          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 shadow-sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detailed View Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={(val) => !val && setSelectedIssue(null)}>
        <DialogContent className="sm:max-w-xl bg-white border border-slate-200 text-slate-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-mono text-indigo-600 flex items-center justify-between">
              <span>Issue Details: {selectedIssue?.issueId}</span>
              <span className="mr-6">{selectedIssue && getStatusBadge(selectedIssue.status)}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedIssue && (
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm py-4 border-t border-slate-150 mt-2">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Topic / Agenda</p>
                <p className="text-slate-800 font-medium mt-0.5">{selectedIssue.project}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Comment</p>
                <p className="text-slate-800 font-medium mt-0.5">{selectedIssue.location || '-'}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Discussion Category</p>
                <p className="text-slate-800 font-medium mt-0.5">{selectedIssue.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Priority</p>
                <div className="mt-1">{getPriorityBadge(selectedIssue.priority)}</div>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Date</p>
                <p className="text-slate-700 font-mono mt-0.5">{selectedIssue.openDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Due Date</p>
                <p className="text-slate-700 font-mono mt-0.5">{selectedIssue.dueDate}</p>
              </div>

              {selectedIssue.closedDate && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 font-semibold uppercase">Closed Date</p>
                  <p className="text-slate-700 font-mono mt-0.5">{selectedIssue.closedDate}</p>
                </div>
              )}

              <div className="col-span-2 pt-2 border-t border-slate-150">
                <p className="text-xs text-slate-500 font-semibold uppercase">Action Item / Description</p>
                <p className="text-slate-750 mt-1 whitespace-pre-wrap leading-relaxed">{selectedIssue.description || 'No description provided'}</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80" onClick={() => setSelectedIssue(null)}>
              Close Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
