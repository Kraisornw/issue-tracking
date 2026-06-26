import fs from 'fs';
import path from 'path';
import { db, hasFirebaseConfig } from './firebaseAdmin';
import { supabase, hasSupabaseConfig } from './supabaseClient';
import { Issue, UploadHistory, DashboardSummary } from '@/types';
import { differenceInDays, parseISO } from 'date-fns';

const LOCAL_DB_PATH = path.join(process.cwd(), 'local_db.json');

// Helper to check if a date is overdue
const isOverdue = (dueDateStr: string, status: string, currentDateStr = '2026-06-24') => {
  if (status === 'Closed' || status === 'Completed') return false;
  return dueDateStr < currentDateStr;
};

// Standard Mock Data
const MOCK_ISSUES: Issue[] = [
  {
    issueId: "ISS-001",
    project: "ETON",
    category: "Architectural",
    discipline: "AR",
    priority: "High",
    severity: "Critical",
    status: "Open",
    openDate: "2026-06-01",
    dueDate: "2026-06-08",
    closedDate: null,
    responsible: "Contractor A",
    location: "Level 15",
    description: "Wall finishing in elevator lobby has visible cracks and paint peeling.",
    createdAt: new Date('2026-06-01T08:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-01T08:00:00Z').toISOString()
  },
  {
    issueId: "ISS-002",
    project: "ETON",
    category: "Structural",
    discipline: "ST",
    priority: "Medium",
    severity: "Major",
    status: "In Progress",
    openDate: "2026-06-05",
    dueDate: "2026-06-20",
    closedDate: null,
    responsible: "Contractor B",
    location: "Basement 1",
    description: "Micro-cracks detected on retaining wall slab column B4.",
    createdAt: new Date('2026-06-05T09:30:00Z').toISOString(),
    updatedAt: new Date('2026-06-10T14:20:00Z').toISOString()
  },
  {
    issueId: "ISS-003",
    project: "MAVEN",
    category: "MEP",
    discipline: "MEP",
    priority: "Low",
    severity: "Minor",
    status: "Closed",
    openDate: "2026-05-10",
    dueDate: "2026-05-15",
    closedDate: "2026-05-14",
    responsible: "Contractor C",
    location: "Level 5",
    description: "Water dripping from AC drain pipe in corridor.",
    createdAt: new Date('2026-05-10T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-05-14T16:00:00Z').toISOString()
  },
  {
    issueId: "ISS-004",
    project: "APEX",
    category: "Architectural",
    discipline: "AR",
    priority: "High",
    severity: "Major",
    status: "Open",
    openDate: "2026-06-10",
    dueDate: "2026-06-15",
    closedDate: null,
    responsible: "Contractor A",
    location: "Roof Floor",
    description: "Puncture on waterproofing membrane near exhaust fan foundation.",
    createdAt: new Date('2026-06-10T11:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-10T11:00:00Z').toISOString()
  },
  {
    issueId: "ISS-005",
    project: "MAVEN",
    category: "MEP",
    discipline: "MEP",
    priority: "High",
    severity: "Critical",
    status: "Closed",
    openDate: "2026-05-01",
    dueDate: "2026-05-07",
    closedDate: "2026-05-06",
    responsible: "Contractor C",
    location: "Main Plant Room",
    description: "Main generator cooling system pressure sensor failure, caused auto shutdown.",
    createdAt: new Date('2026-05-01T07:15:00Z').toISOString(),
    updatedAt: new Date('2026-05-06T18:30:00Z').toISOString()
  },
  {
    issueId: "ISS-006",
    project: "ETON",
    category: "Architectural",
    discipline: "AR",
    priority: "Low",
    severity: "Minor",
    status: "Closed",
    openDate: "2026-05-20",
    dueDate: "2026-06-05",
    closedDate: "2026-06-02",
    responsible: "Contractor A",
    location: "Main Lobby",
    description: "Granite tiles misaligned near receptionist counter.",
    createdAt: new Date('2026-05-20T13:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-02T10:00:00Z').toISOString()
  },
  {
    issueId: "ISS-007",
    project: "APEX",
    category: "Structural",
    discipline: "ST",
    priority: "High",
    severity: "Critical",
    status: "Open",
    openDate: "2026-04-15",
    dueDate: "2026-04-30",
    closedDate: null,
    responsible: "Contractor B",
    location: "Level 22",
    description: "Deflection detected on cantilever slab post-tensioning. Exceeds standard 15mm.",
    createdAt: new Date('2026-04-15T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-04-15T09:00:00Z').toISOString()
  },
  {
    issueId: "ISS-008",
    project: "ETON",
    category: "MEP",
    discipline: "MEP",
    priority: "Medium",
    severity: "Minor",
    status: "In Progress",
    openDate: "2026-06-12",
    dueDate: "2026-06-25",
    closedDate: null,
    responsible: "Contractor D",
    location: "Level 12",
    description: "HVAC duct layout conflicts with sprinkler piping in Zone B.",
    createdAt: new Date('2026-06-12T15:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-15T11:00:00Z').toISOString()
  }
];

const MOCK_HISTORY: UploadHistory[] = [
  {
    id: "hist-001",
    fileName: "initial_seed_data.xlsx",
    uploadDate: new Date('2026-06-24T10:00:00Z').toISOString(),
    totalRecords: 8,
    newRecords: 8,
    updatedRecords: 0,
    processingTimeMs: 120,
    status: "success"
  }
];

// Helper to initialize local DB if not present
const getLocalData = (): { issues: Issue[]; uploadHistory: UploadHistory[]; dashboardCache: DashboardSummary | null } => {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initialData = {
      issues: MOCK_ISSUES,
      uploadHistory: MOCK_HISTORY,
      dashboardCache: null
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading local db file, resetting...", e);
    const initialData = { issues: MOCK_ISSUES, uploadHistory: MOCK_HISTORY, dashboardCache: null };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
};

const saveLocalData = (data: { issues: Issue[]; uploadHistory: UploadHistory[]; dashboardCache: DashboardSummary | null }) => {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

// Calculate KPIs
export const calculateKPIs = (issues: Issue[], currentDateStr = '2026-06-24'): DashboardSummary => {
  const total = issues.length;
  if (total === 0) {
    return {
      totalIssues: 0,
      openIssues: 0,
      inProgressIssues: 0,
      closedIssues: 0,
      overdueIssues: 0,
      criticalIssues: 0,
      resolutionRate: 0,
      averageResolutionTimeDays: 0,
      slaCompliance: 100
    };
  }

  const open = issues.filter(i => i.status === 'Pending').length;
  const inProgress = issues.filter(i => i.status === 'In Progress').length;
  const closed = issues.filter(i => i.status === 'Closed' || i.status === 'Completed').length;
  const critical = issues.filter(i => i.status !== 'Closed' && i.status !== 'Completed' && i.priority === 'High').length;
  const overdue = issues.filter(i => isOverdue(i.dueDate, i.status, currentDateStr)).length;

  const resolutionRate = parseFloat(((closed / total) * 100).toFixed(1));

  // Average Resolution Time (for closed issues)
  const closedIssuesList = issues.filter(i => (i.status === 'Closed' || i.status === 'Completed') && i.openDate && i.closedDate);
  let averageResolutionTimeDays = 0;
  if (closedIssuesList.length > 0) {
    const totalDays = closedIssuesList.reduce((sum, issue) => {
      const openDate = parseISO(issue.openDate);
      const closedDate = parseISO(issue.closedDate!);
      return sum + Math.max(0, differenceInDays(closedDate, openDate));
    }, 0);
    averageResolutionTimeDays = parseFloat((totalDays / closedIssuesList.length).toFixed(1));
  }

  // SLA Compliance (closed issues resolved on or before due date)
  let slaCompliance = 100;
  if (closedIssuesList.length > 0) {
    const compliantClosed = closedIssuesList.filter(i => i.closedDate! <= i.dueDate).length;
    slaCompliance = parseFloat(((compliantClosed / closedIssuesList.length) * 100).toFixed(1));
  }

  return {
    totalIssues: total,
    openIssues: open,
    inProgressIssues: inProgress,
    closedIssues: closed,
    overdueIssues: overdue,
    criticalIssues: critical,
    resolutionRate,
    averageResolutionTimeDays,
    slaCompliance,
    lastUpdated: new Date().toISOString()
  };
};

// Database Service Class
class DatabaseService {
  async getIssues(): Promise<Issue[]> {
    let rawIssues: Issue[] = [];
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('issues').select('*');
      if (error) {
        console.error('Supabase getIssues error:', error);
        throw error;
      }
      rawIssues = (data || []) as Issue[];
    } else if (hasFirebaseConfig && db) {
      const snapshot = await db.collection('issues').get();
      rawIssues = snapshot.docs.map((doc: any) => doc.data() as Issue);
    } else {
      rawIssues = getLocalData().issues;
    }

    // Normalize legacy status values dynamically and default workItemType
    return rawIssues.map(i => ({
      ...i,
      status: i.status === 'Closed' ? 'Completed' : i.status === 'Open' ? 'Pending' : i.status,
      workItemType: i.workItemType || 'Issue'
    }));
  }

  async upsertIssues(issuesList: Issue[], uploadId?: string | number): Promise<{ newRecords: number; updatedRecords: number }> {
    let newRecords = 0;
    let updatedRecords = 0;

    if (hasSupabaseConfig && supabase) {
      const existingIssues = await this.getIssues();
      const existingMap = new Map<string, Issue>();
      existingIssues.forEach(i => existingMap.set(i.issueId, i));

      const toUpsert: any[] = [];
      const numericUploadId = uploadId !== undefined && uploadId !== null && !isNaN(Number(uploadId)) ? Number(uploadId) : uploadId;
      
      for (const issue of issuesList) {
        const existing = existingMap.get(issue.issueId);
        
        if (existing) {
          // Check if changed
          const isChanged = JSON.stringify({ ...existing, createdAt: undefined, updatedAt: undefined, uploadId: undefined }) !== 
                            JSON.stringify({ ...issue, createdAt: undefined, updatedAt: undefined, uploadId: undefined });
          
          if (isChanged) {
            toUpsert.push({
              ...issue,
              uploadId: numericUploadId || null,
              createdAt: existing.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            updatedRecords++;
          }
        } else {
          toUpsert.push({
            ...issue,
            uploadId: numericUploadId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          newRecords++;
        }
      }

      if (toUpsert.length > 0) {
        const { error } = await supabase.from('issues').upsert(toUpsert);
        if (error) {
          console.error('Supabase upsertIssues error:', error);
          throw error;
        }
        
        // Refresh cache
        const allIssues = await this.getIssues();
        const newSummary = calculateKPIs(allIssues);
        await supabase.from('dashboard_cache').upsert({
          key: 'summary',
          data: newSummary,
          updatedAt: new Date().toISOString()
        });
      }
    } else if (hasFirebaseConfig && db) {
      // Firebase Incremental Upload
      const existingIssuesMap = new Map<string, Issue>();
      const snapshot = await db.collection('issues').get();
      snapshot.docs.forEach((doc: any) => {
        const issue = doc.data() as Issue;
        existingIssuesMap.set(issue.issueId, issue);
      });

      const batch = db.batch();
      
      for (const issue of issuesList) {
        const docRef = db.collection('issues').doc(issue.issueId);
        const existing = existingIssuesMap.get(issue.issueId);
        
        if (existing) {
          // Check if changed
          const isChanged = JSON.stringify({ ...existing, createdAt: undefined, updatedAt: undefined, uploadId: undefined }) !== 
                            JSON.stringify({ ...issue, createdAt: undefined, updatedAt: undefined, uploadId: undefined });
          
          if (isChanged) {
            batch.set(docRef, {
              ...issue,
              uploadId: uploadId || null,
              createdAt: existing.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
            updatedRecords++;
          }
        } else {
          batch.set(docRef, {
            ...issue,
            uploadId: uploadId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          newRecords++;
        }
      }

      if (newRecords > 0 || updatedRecords > 0) {
        await batch.commit();
        // Refresh cache
        const allIssuesSnapshot = await db.collection('issues').get();
        const allIssues = allIssuesSnapshot.docs.map((doc: any) => doc.data() as Issue);
        const newSummary = calculateKPIs(allIssues);
        await db.collection('dashboard_cache').doc('summary').set(newSummary);
      }
    } else {
      // Local JSON DB Incremental Upload
      const data = getLocalData();
      const existingMap = new Map<string, Issue>();
      data.issues.forEach(i => existingMap.set(i.issueId, i));

      const updatedIssues = [...data.issues];

      for (const issue of issuesList) {
        const existing = existingMap.get(issue.issueId);
        if (existing) {
          const isChanged = JSON.stringify({ ...existing, createdAt: undefined, updatedAt: undefined, uploadId: undefined }) !== 
                            JSON.stringify({ ...issue, createdAt: undefined, updatedAt: undefined, uploadId: undefined });
          
          if (isChanged) {
            const index = updatedIssues.findIndex(i => i.issueId === issue.issueId);
            updatedIssues[index] = {
              ...issue,
              uploadId: uploadId || null,
              createdAt: existing.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            updatedRecords++;
          }
        } else {
          updatedIssues.push({
            ...issue,
            uploadId: uploadId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          newRecords++;
        }
      }

      if (newRecords > 0 || updatedRecords > 0) {
        const newSummary = calculateKPIs(updatedIssues);
        saveLocalData({
          issues: updatedIssues,
          uploadHistory: data.uploadHistory,
          dashboardCache: newSummary
        });
      }
    }

    return { newRecords, updatedRecords };
  }

  async getUploadHistory(): Promise<UploadHistory[]> {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase
        .from('upload_history')
        .select('*')
        .order('uploadDate', { ascending: false });
      if (error) {
        console.error('Supabase getUploadHistory error:', error);
        throw error;
      }
      return (data || []) as UploadHistory[];
    } else if (hasFirebaseConfig && db) {
      const snapshot = await db.collection('upload_history').orderBy('uploadDate', 'desc').get();
      return snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          fileName: data.fileName,
          uploadDate: data.uploadDate,
          totalRecords: data.totalRecords,
          newRecords: data.newRecords,
          updatedRecords: data.updatedRecords,
          processingTimeMs: data.processingTimeMs,
          status: data.status,
          errors: data.errors
        } as UploadHistory;
      });
    } else {
      return [...getLocalData().uploadHistory].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
    }
  }

  async addUploadHistory(record: Omit<UploadHistory, 'id' | 'uploadDate'>): Promise<string | number> {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase
        .from('upload_history')
        .insert({
          ...record,
          uploadDate: new Date().toISOString()
        })
        .select('id')
        .single();
      if (error) {
        console.error('Supabase addUploadHistory error:', error);
        throw error;
      }
      return data.id;
    } else if (hasFirebaseConfig && db) {
      const docRef = await db.collection('upload_history').add({
        ...record,
        uploadDate: new Date().toISOString()
      });
      return docRef.id;
    } else {
      const data = getLocalData();
      const id = `hist-${Date.now()}`;
      data.uploadHistory.push({
        id,
        ...record,
        uploadDate: new Date().toISOString()
      });
      saveLocalData(data);
      return id;
    }
  }

  async updateUploadHistory(id: string | number, updates: Partial<UploadHistory>): Promise<void> {
    const numericId = typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : id;
    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase
        .from('upload_history')
        .update(updates)
        .eq('id', numericId);
      if (error) {
        console.error('Supabase updateUploadHistory error:', error);
        throw error;
      }
    } else if (hasFirebaseConfig && db) {
      await db.collection('upload_history').doc(id as string).update(updates);
    } else {
      const data = getLocalData();
      const index = data.uploadHistory.findIndex(h => h.id === id || h.id === numericId);
      if (index !== -1) {
        data.uploadHistory[index] = {
          ...data.uploadHistory[index],
          ...updates
        };
        saveLocalData(data);
      }
    }
  }

  async deleteUploadHistory(id: string | number): Promise<void> {
    const numericId = typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : id;

    if (hasSupabaseConfig && supabase) {
      // In Supabase, ON DELETE CASCADE handles deleting related issues.
      const { error } = await supabase
        .from('upload_history')
        .delete()
        .eq('id', numericId);
      
      if (error) {
        console.error('Supabase deleteUploadHistory error:', error);
        throw error;
      }
    } else if (hasFirebaseConfig && db) {
      const batch = db.batch();
      // Find all issues with uploadId == id
      const issuesSnapshot = await db.collection('issues').where('uploadId', '==', id).get();
      issuesSnapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
      // Delete history record
      batch.delete(db.collection('upload_history').doc(id as string));
      await batch.commit();
    } else {
      const data = getLocalData();
      data.issues = data.issues.filter(i => i.uploadId !== id && i.uploadId !== numericId);
      data.uploadHistory = data.uploadHistory.filter(h => h.id !== id && h.id !== numericId);
      saveLocalData(data);
    }

    // Refresh cache
    const allIssues = await this.getIssues();
    const newSummary = calculateKPIs(allIssues);
    if (hasSupabaseConfig && supabase) {
      await supabase.from('dashboard_cache').upsert({
        key: 'summary',
        data: newSummary,
        updatedAt: new Date().toISOString()
      });
    } else if (hasFirebaseConfig && db) {
      await db.collection('dashboard_cache').doc('summary').set(newSummary);
    } else {
      const data = getLocalData();
      data.dashboardCache = newSummary;
      saveLocalData(data);
    }
  }

  async deleteIssue(issueId: string): Promise<void> {
    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('issueId', issueId);
      
      if (error) {
        console.error('Supabase deleteIssue error:', error);
        throw error;
      }
    } else if (hasFirebaseConfig && db) {
      const snapshot = await db.collection('issues').where('issueId', '==', issueId).get();
      const batch = db.batch();
      snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
      await batch.commit();
    } else {
      const data = getLocalData();
      data.issues = data.issues.filter(i => i.issueId !== issueId);
      saveLocalData(data);
    }

    // Refresh cache
    const allIssues = await this.getIssues();
    const newSummary = calculateKPIs(allIssues);
    if (hasSupabaseConfig && supabase) {
      await supabase.from('dashboard_cache').upsert({
        key: 'summary',
        data: newSummary,
        updatedAt: new Date().toISOString()
      });
    } else if (hasFirebaseConfig && db) {
      await db.collection('dashboard_cache').doc('summary').set(newSummary);
    } else {
      const data = getLocalData();
      data.dashboardCache = newSummary;
      saveLocalData(data);
    }
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase
        .from('dashboard_cache')
        .select('data')
        .eq('key', 'summary')
        .single();
      
      if (!error && data) {
        return data.data as DashboardSummary;
      }
      
      // If cache missing, recalculate
      const issues = await this.getIssues();
      const summary = calculateKPIs(issues);
      await supabase.from('dashboard_cache').upsert({
        key: 'summary',
        data: summary,
        updatedAt: new Date().toISOString()
      });
      return summary;
    } else if (hasFirebaseConfig && db) {
      const doc = await db.collection('dashboard_cache').doc('summary').get();
      if (doc.exists) {
        return doc.data() as DashboardSummary;
      }
      // If cache missing, recalculate
      const issues = await this.getIssues();
      const summary = calculateKPIs(issues);
      await db.collection('dashboard_cache').doc('summary').set(summary);
      return summary;
    } else {
      const data = getLocalData();
      if (data.dashboardCache) {
        return data.dashboardCache;
      }
      const summary = calculateKPIs(data.issues);
      data.dashboardCache = summary;
      saveLocalData(data);
      return summary;
    }
  }

  async clearAllData(): Promise<void> {
    if (hasSupabaseConfig && supabase) {
      // Delete all issues
      const { error: issuesErr } = await supabase.from('issues').delete().neq('issueId', '');
      // Delete all history
      const { error: historyErr } = await supabase.from('upload_history').delete().neq('id', 0);
      // Delete dashboard cache
      const { error: cacheErr } = await supabase.from('dashboard_cache').delete().neq('key', '');
      
      if (issuesErr || historyErr || cacheErr) {
        console.error('Supabase clearAllData error:', { issuesErr, historyErr, cacheErr });
        throw new Error('Failed to clear database tables');
      }
    } else if (hasFirebaseConfig && db) {
      // Firebase clear logic
      const issuesSnapshot = await db.collection('issues').get();
      const historySnapshot = await db.collection('upload_history').get();
      const cacheSnapshot = await db.collection('dashboard_cache').get();
      
      const batch = db.batch();
      issuesSnapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
      historySnapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
      cacheSnapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
      await batch.commit();
    } else {
      // Local fallback DB clear
      saveLocalData({
        issues: [],
        uploadHistory: [],
        dashboardCache: null
      });
    }
  }
}

export const dbService = new DatabaseService();
