'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  SummaryCards 
} from '@/components/SummaryCards';
import { 
  StatusDistribution, 
  BarChartWidget, 
  MonthlyTrends, 
  ResolutionTimeTrend, 
  ParetoAnalysis, 
  AgingAnalysisChart,
  RecentIssuesByTopic 
} from '@/components/AnalyticsCharts';
import { 
  AggregateTables 
} from '@/components/AggregateTables';
import { 
  IssuesTable 
} from '@/components/IssuesTable';
import { 
  UploadHistoryTable 
} from '@/components/UploadHistoryTable';
import { 
  UploadModal 
} from '@/components/UploadModal';
import { Issue, UploadHistory, DashboardSummary, AnalyticsData } from '@/types';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileDown, 
  RefreshCw, 
  Upload as UploadIcon, 
  Filter, 
  X, 
  LayoutDashboard, 
  ListTodo, 
  History,
  Database,
  Search,
  SlidersHorizontal,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function HomePage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'issues' | 'history'>('dashboard');
  
  // Database States
  const [issues, setIssues] = useState<Issue[]>([]);
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [kpis, setKpis] = useState<DashboardSummary>({
    totalIssues: 0,
    openIssues: 0,
    inProgressIssues: 0,
    closedIssues: 0,
    overdueIssues: 0,
    criticalIssues: 0,
    resolutionRate: 0,
    averageResolutionTimeDays: 0,
    slaCompliance: 100
  });

  // Analytics states (aggregated data from server)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    statusDistribution: [],
    byProject: [],
    byCategory: [],
    byDiscipline: [],
    bySeverity: [],
    monthlyTrend: [],
    resolutionTimeTrend: [],
    paretoAnalysis: [],
    topRepeatedIssues: [],
    topResponsible: [],
    agingAnalysis: [],
    overdueIssues: []
  });

  // Unique lists for filter dropdown selections
  const [filterOptions, setFilterOptions] = useState<{
    projects: string[];
    categories: string[];
    disciplines: string[];
    statuses: string[];
    priorities: string[];
    severities: string[];
    responsibles: string[];
    locations: string[];
  }>({
    projects: [],
    categories: [],
    disciplines: [],
    statuses: [],
    priorities: [],
    severities: [],
    responsibles: [],
    locations: []
  });

  // Filter States
  const [filters, setFilters] = useState({
    project: '',
    category: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // General UI States
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch all data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Build filter query parameters for analytics
      const queryParams = new URLSearchParams();
      if (filters.project) queryParams.set('project', filters.project);
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.status) queryParams.set('status', filters.status);
      if (filters.priority) queryParams.set('priority', filters.priority);
      if (filters.startDate) queryParams.set('startDate', filters.startDate);
      if (filters.endDate) queryParams.set('endDate', filters.endDate);
      if (searchQuery) queryParams.set('search', searchQuery);

      // Fetch analytics (includes filtered KPIs, charts, dropdown unique lists, overdue table)
      const analyticsRes = await fetch(`/api/analytics?${queryParams.toString()}`);
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
        setKpis(analyticsData.kpis);
        if (analyticsData.filterDropdowns) {
          setFilterOptions(analyticsData.filterDropdowns);
        }
      }

      // Fetch full raw issues (used for table view & excel export)
      const issuesRes = await fetch('/api/issues');
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        setIssues(issuesData);
      }

      // Fetch upload history
      const historyRes = await fetch('/api/upload-history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  // Initial and reactive load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Clear all filters
  const resetFilters = () => {
    setFilters({
      project: '',
      category: '',
      status: '',
      priority: '',
      startDate: '',
      endDate: ''
    });
    setSearchQuery('');
  };

  // Reset database function
  const handleClearAllData = async () => {
    const confirmed = window.confirm("Are you sure you want to clear all issues and upload history? This will completely empty the database and cannot be undone.");
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/issues', { method: 'DELETE' });
      if (res.ok) {
        alert("Database cleared successfully!");
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to clear data'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to the database reset API.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUploadHistory = async (id: string | number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/upload-history?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("ลบประวัติการนำเข้าและข้อมูล Issues สำเร็จ!");
        fetchData();
      } else {
        const err = await res.json();
        alert(`เกิดข้อผิดพลาด: ${err.error || 'Failed to delete upload log'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to the upload history delete API.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Export CSV (Redirects directly to endpoint)
  const exportCsv = () => {
    const queryParams = new URLSearchParams();
    if (filters.project) queryParams.set('project', filters.project);
    if (filters.category) queryParams.set('category', filters.category);
    if (filters.status) queryParams.set('status', filters.status);
    if (filters.priority) queryParams.set('priority', filters.priority);
    if (filters.startDate) queryParams.set('startDate', filters.startDate);
    if (filters.endDate) queryParams.set('endDate', filters.endDate);
    
    window.open(`/api/export?${queryParams.toString()}`);
  };

  // 2. Export Excel (Client-side SheetJS)
  const exportExcel = () => {
    // Apply current filters client-side to make sure we export what's on screen
    let filtered = [...issues];
    if (filters.project) filtered = filtered.filter(i => i.project === filters.project);
    if (filters.category) filtered = filtered.filter(i => i.category === filters.category);
    if (filters.status) filtered = filtered.filter(i => i.status === filters.status);
    if (filters.priority) filtered = filtered.filter(i => i.priority === filters.priority);
    if (filters.startDate) filtered = filtered.filter(i => i.openDate >= filters.startDate);
    if (filters.endDate) filtered = filtered.filter(i => i.openDate <= filters.endDate);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.issueId.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }

    // Format data rows for Excel output
    const excelRows = filtered.map(issue => ({
      'Issue ID': issue.issueId,
      'Date': issue.openDate,
      'Topic / Agenda': issue.project,
      'Discussion': issue.category,
      'Action Item': issue.description,
      'Due Date': issue.dueDate,
      'Priority': issue.priority,
      'Status': issue.status,
      'Comment': issue.location || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Issues');
    
    // Auto-fit column widths
    const maxLens = excelRows.reduce((acc: any, row: any) => {
      Object.keys(row).forEach((key: string) => {
        const len = String(row[key]).length;
        acc[key] = Math.max(acc[key] || 10, len);
      });
      return acc;
    }, {});
    worksheet['!cols'] = Object.keys(maxLens).map((key: string) => ({ wch: maxLens[key] + 3 }));

    XLSX.writeFile(workbook, `issues_report_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  // 3. Export PDF (Capture screenshot of dashboard)
  const exportPdf = async () => {
    const dashboardElement = document.getElementById('dashboard-content');
    if (!dashboardElement) return;

    setIsExportingPdf(true);
    try {
      // Small delay to let animations/render finish
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(dashboardElement, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#f8fafc' // slate-50 base color
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add pages if dashboard is taller than single page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`dashboard_analytics_${new Date().toISOString().substring(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700">
              Issue Tracking Analytics
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 h-9 w-9 rounded-lg"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Excel Upload button */}
          <Button 
            onClick={() => setUploadModalOpen(true)}
            variant="outline"
            className="border-slate-200 bg-white text-black hover:bg-slate-50 font-bold text-xs shadow-sm px-4 py-2 h-9 rounded-lg flex items-center gap-1.5"
          >
            <UploadIcon className="w-4 h-4 text-black" /> Import Excel
          </Button>

          {/* Export Dropdown */}
          <div className="relative group">
            <Button 
              variant="outline"
              className="border-slate-200 bg-white text-slate-750 hover:bg-slate-50 text-xs font-semibold h-9 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Report
            </Button>
            <div className="absolute right-0 top-10 mt-1 w-44 rounded-lg bg-white border border-slate-200 p-1.5 shadow-xl opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50">
              <button 
                onClick={exportCsv}
                className="w-full text-left text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 p-2 rounded flex items-center gap-2 font-semibold"
              >
                <FileText className="w-4 h-4 text-orange-500" /> Export CSV
              </button>
              <button 
                onClick={exportExcel}
                className="w-full text-left text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 p-2 rounded flex items-center gap-2 font-semibold"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel (.xlsx)
              </button>
              <button 
                onClick={exportPdf}
                disabled={isExportingPdf}
                className="w-full text-left text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 p-2 rounded flex items-center gap-2 disabled:opacity-50 font-semibold"
              >
                <FileDown className="w-4 h-4 text-rose-500" /> {isExportingPdf ? 'Exporting...' : 'Export Dashboard (PDF)'}
              </button>
            </div>
          </div>

          {/* Reset Database Button */}
          <Button 
            onClick={handleClearAllData}
            variant="ghost" 
            className="text-red-500 hover:text-red-750 hover:bg-red-50/60 border border-red-200 h-9 px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 text-red-500" /> Reset Database
          </Button>

          {/* Collapsible filter toggle for small screens */}
          <Button 
            size="icon" 
            variant="outline" 
            className="lg:hidden border-slate-200 text-slate-550 hover:bg-slate-50 h-9 w-9"
            onClick={() => setSidebarOpen(true)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sticky Filters Panel (Left Sidebar) */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white p-5 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto shadow-sm shadow-slate-100/30`}>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between lg:block">
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Global Filters
              </h2>
              <Button size="icon" variant="ghost" className="lg:hidden text-slate-500 hover:text-slate-800" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Filter controls */}
            <div className="space-y-4">
              
              {/* Search Query */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Search Keywords</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-450" />
                  <input 
                    placeholder="ID, description..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-750 placeholder:text-slate-450 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Selector wrapper */}
              {[
                { label: 'Topic / Agenda', stateKey: 'project', options: filterOptions.projects },
                { label: 'Discussion Category', stateKey: 'category', options: filterOptions.categories },
                { label: 'Status', stateKey: 'status', options: filterOptions.statuses },
                { label: 'Priority', stateKey: 'priority', options: filterOptions.priorities },
              ].map((select) => (
                <div key={select.stateKey} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{select.label}</label>
                  <select 
                    value={(filters as any)[select.stateKey]}
                    onChange={(e) => setFilters(prev => ({ ...prev, [select.stateKey]: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-750 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 transition-colors font-semibold cursor-pointer"
                  >
                    <option value="">All {select.label}s</option>
                    {select.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Date Opened From</label>
                <input 
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-750 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 transition-colors font-mono cursor-pointer"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Date Opened To</label>
                <input 
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-750 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 transition-colors font-mono cursor-pointer"
                />
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-slate-250 mt-6 space-y-2">
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="w-full border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-600 text-xs font-semibold h-9 rounded-lg"
            >
              Reset Filters
            </Button>
          </div>
        </aside>

        {/* Sidebar Overlay backdrop (mobile only) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Main Content Pane */}
        <main className="flex-1 flex flex-col overflow-y-auto px-6 py-6 bg-slate-50">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 pb-3 mb-6 gap-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-100/60 border border-transparent font-semibold'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard Overview
            </button>
            <button 
              onClick={() => setActiveTab('issues')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'issues' 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-100/60 border border-transparent font-semibold'
              }`}
            >
              <ListTodo className="w-4 h-4" /> Detailed Issues List
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history' 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-100/60 border border-transparent font-semibold'
              }`}
            >
              <History className="w-4 h-4" /> Import History Log ({history.length})
            </button>
          </div>

          {/* Main Content Screens */}
          <div className="flex-1 space-y-6">
            
            {activeTab === 'dashboard' && (
              <div id="dashboard-content" className="space-y-6">
                
                {/* Summary KPIs */}
                <SummaryCards summary={kpis} />

                {/* Dashboard Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <StatusDistribution data={analytics.statusDistribution} />
                  <BarChartWidget title="Issues by Priority" desc="Categorized by importance" data={analytics.byPriority || []} color="#f43f5e" />
                  <BarChartWidget title="Issues by Topic" desc="Workload across developments" data={analytics.byProject} color="#3b82f6" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <MonthlyTrends data={analytics.monthlyTrend} />
                  <ResolutionTimeTrend data={analytics.resolutionTimeTrend} />
                  <RecentIssuesByTopic data={analytics.recentIssuesByTopic || { last7Days: [], last14Days: [], last30Days: [] }} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ParetoAnalysis data={analytics.paretoAnalysis} />
                  <AgingAnalysisChart data={analytics.agingAnalysis} />
                </div>

                {/* Analysis aggregates (Top Repeated, Overdue, workloads) */}
                <AggregateTables 
                  repeated={analytics.topRepeatedIssues} 
                  overdue={analytics.overdueIssues} 
                  topics={analytics.topTopics || []} 
                />

              </div>
            )}

            {activeTab === 'issues' && (
              <Card className="bg-white border border-slate-200/80 shadow-sm shadow-slate-100/50">
                <CardContent className="p-6">
                  <IssuesTable issues={issues} filters={filters} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'history' && (
              <UploadHistoryTable history={history} onDelete={handleDeleteUploadHistory} />
            )}

          </div>
        </main>
      </div>

      {/* Excel Upload Modal */}
      <UploadModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen} 
        onSuccess={fetchData} 
      />

    </div>
  );
}
