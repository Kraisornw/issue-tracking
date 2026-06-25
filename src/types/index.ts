export interface Issue {
  issueId: string;
  project: string;
  category: string;
  discipline: string;
  priority: 'Low' | 'Medium' | 'High' | string;
  severity: 'Minor' | 'Major' | 'Critical' | string;
  status: 'Open' | 'In Progress' | 'Closed' | string;
  openDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  closedDate: string | null; // YYYY-MM-DD
  responsible: string;
  description: string;
  location: string;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
  uploadId?: string | number | null;
}

export interface UploadHistory {
  id?: string;
  fileName: string;
  uploadDate: string; // ISO string or Timestamp representation
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  processingTimeMs: number;
  status: 'success' | 'failed' | 'processing';
  errors?: string[];
}

export interface DashboardSummary {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  closedIssues: number;
  overdueIssues: number;
  criticalIssues: number;
  resolutionRate: number; // percentage
  averageResolutionTimeDays: number;
  slaCompliance: number; // percentage
  lastUpdated?: string;
}

export interface ValidationError {
  row: number;
  column: string;
  value?: string;
  message: string;
}

export interface AnalyticsData {
  statusDistribution: { name: string; value: number }[];
  byProject: { name: string; count: number }[];
  byCategory: { name: string; count: number }[];
  byDiscipline?: { name: string; count: number }[];
  bySeverity?: { name: string; count: number }[];
  byPriority?: { name: string; count: number }[];
  monthlyTrend: { month: string; opened: number; closed: number }[];
  resolutionTimeTrend: { month: string; avgDays: number }[];
  paretoAnalysis: { category: string; count: number; cumulativePercent: number }[];
  agingAnalysis: { range: string; count: number }[];
  topRepeatedIssues: { category: string; frequency: number; percentage: number }[];
  topResponsible?: { name: string; open: number; closed: number; rate: number }[];
  topTopics?: { name: string; open: number; closed: number; total: number; rate: number }[];
  overdueIssues: {
    issueId: string;
    project: string;
    category: string;
    priority: string;
    dueDate: string;
    daysOverdue: number;
  }[];
  recentIssuesByTopic?: {
    last7Days: { name: string; count: number }[];
    last14Days: { name: string; count: number }[];
    last30Days: { name: string; count: number }[];
  };
}
