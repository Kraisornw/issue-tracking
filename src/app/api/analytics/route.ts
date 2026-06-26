import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { Issue } from '@/types';
import { differenceInDays, parseISO } from 'date-fns';

const CURRENT_DATE_STR = '2026-06-24';
const CURRENT_DATE = parseISO(CURRENT_DATE_STR);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract filters
    const project = searchParams.get('project');
    const category = searchParams.get('category');
    const discipline = searchParams.get('discipline');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const severity = searchParams.get('severity');
    const responsible = searchParams.get('responsible');
    const location = searchParams.get('location');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const description = searchParams.get('description');
    const workItemType = searchParams.get('workItemType');

    // Fetch all issues
    let issues = await dbService.getIssues();

    // Apply filters
    if (project) {
      issues = issues.filter(i => i.project.toLowerCase() === project.toLowerCase());
    }
    if (category) {
      issues = issues.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }
    if (description) {
      issues = issues.filter(i => i.description.toLowerCase() === description.toLowerCase());
    }
    if (workItemType) {
      issues = issues.filter(i => i.workItemType?.toLowerCase() === workItemType.toLowerCase());
    }
    if (discipline) {
      issues = issues.filter(i => i.discipline.toLowerCase() === discipline.toLowerCase());
    }
    if (status) {
      issues = issues.filter(i => i.status.toLowerCase() === status.toLowerCase());
    }
    if (priority) {
      issues = issues.filter(i => i.priority.toLowerCase() === priority.toLowerCase());
    }
    if (severity) {
      issues = issues.filter(i => i.severity.toLowerCase() === severity.toLowerCase());
    }
    if (responsible) {
      issues = issues.filter(i => i.responsible.toLowerCase() === responsible.toLowerCase());
    }
    if (location) {
      issues = issues.filter(i => i.location.toLowerCase() === location.toLowerCase());
    }
    if (startDate) {
      issues = issues.filter(i => i.openDate >= startDate);
    }
    if (endDate) {
      issues = issues.filter(i => i.openDate <= endDate);
    }
    if (search) {
      const q = search.toLowerCase();
      issues = issues.filter(i => 
        i.issueId.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.project.toLowerCase().includes(q) ||
        i.responsible.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }

    // 1. Status Distribution (Pie/Donut)
    const inProgressCount = issues.filter(i => i.status === 'In Progress').length;
    const pendingCount = issues.filter(i => i.status === 'Pending').length;
    const completedCount = issues.filter(i => i.status === 'Completed' || i.status === 'Closed').length;
    const statusDistribution = [
      { name: 'In Progress', value: inProgressCount },
      { name: 'Pending', value: pendingCount },
      { name: 'Completed', value: completedCount }
    ];

    // Helper to group and count
    const groupCount = (field: keyof Issue) => {
      const counts: Record<string, number> = {};
      issues.forEach(i => {
        const val = i[field] ? String(i[field]) : 'Unassigned';
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    // 2. Issues by Project
    const byProject = groupCount('project');

    // 3. Issues by Category
    const byCategory = groupCount('category');

    // 4. Issues by Priority
    const byPriority = groupCount('priority');

    // 5. Trends (Monthly Opened vs Closed and Resolution Time)
    const monthsSet = new Set<string>();
    issues.forEach(i => {
      if (i.openDate) monthsSet.add(i.openDate.substring(0, 7)); // YYYY-MM
      if (i.closedDate) monthsSet.add(i.closedDate.substring(0, 7));
    });
    
    // Sort months chronologically
    const sortedMonths = Array.from(monthsSet).sort();
    
    // If empty, default to current month
    if (sortedMonths.length === 0) {
      sortedMonths.push(CURRENT_DATE_STR.substring(0, 7));
    }

    const monthlyTrend = sortedMonths.map(month => {
      const opened = issues.filter(i => i.openDate && i.openDate.startsWith(month)).length;
      const closed = issues.filter(i => i.closedDate && i.closedDate.startsWith(month)).length;
      return { month, opened, closed };
    });

    // Resolution Time Trend
    const resolutionTimeTrend = sortedMonths.map(month => {
      const monthlyClosed = issues.filter(i => (i.status === 'Completed' || i.status === 'Closed') && i.closedDate && i.closedDate.startsWith(month));
      if (monthlyClosed.length === 0) return { month, avgDays: 0 };
      
      const totalDays = monthlyClosed.reduce((sum, i) => {
        const openD = parseISO(i.openDate);
        const closedD = parseISO(i.closedDate!);
        return sum + Math.max(0, differenceInDays(closedD, openD));
      }, 0);
      
      return { month, avgDays: parseFloat((totalDays / monthlyClosed.length).toFixed(1)) };
    });

    // 6. Pareto Analysis (80/20 Rule for Category)
    const categoryCounts = groupCount('category');
    const totalIssues = categoryCounts.reduce((sum, item) => sum + item.count, 0);
    let runningSum = 0;
    const paretoAnalysis = categoryCounts.map(item => {
      runningSum += item.count;
      const cumulativePercent = totalIssues > 0 ? parseFloat(((runningSum / totalIssues) * 100).toFixed(1)) : 0;
      return {
        category: item.name,
        count: item.count,
        cumulativePercent
      };
    });

    // 7. Top Repeated Issues (Table data)
    const topRepeatedIssues = categoryCounts.map(item => {
      const percentage = totalIssues > 0 ? parseFloat(((item.count / totalIssues) * 100).toFixed(1)) : 0;
      return {
        category: item.name,
        frequency: item.count,
        percentage
      };
    }).slice(0, 10); // top 10

    // 8. Top Topics / Agendas (Table data - replaces Responsible)
    const topicsMap: Record<string, { open: number; closed: number }> = {};
    issues.forEach(i => {
      const topic = i.project || 'General Topic';
      if (!topicsMap[topic]) {
        topicsMap[topic] = { open: 0, closed: 0 };
      }
      if (i.status === 'Completed' || i.status === 'Closed') {
        topicsMap[topic].closed++;
      } else {
        topicsMap[topic].open++;
      }
    });

    const topTopics = Object.entries(topicsMap)
      .map(([name, stats]) => {
        const total = stats.open + stats.closed;
        const rate = total > 0 ? parseFloat(((stats.closed / total) * 100).toFixed(1)) : 0;
        return { name, open: stats.open, closed: stats.closed, total, rate };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // top 10

    // 9. Aging Analysis (Open/In Progress issues age brackets)
    const openIssues = issues.filter(i => i.status !== 'Completed' && i.status !== 'Closed' && i.openDate);
    let age0_7 = 0;
    let age8_30 = 0;
    let age31_60 = 0;
    let age60Plus = 0;

    openIssues.forEach(i => {
      const age = differenceInDays(CURRENT_DATE, parseISO(i.openDate));
      if (age <= 7) age0_7++;
      else if (age <= 30) age8_30++;
      else if (age <= 60) age31_60++;
      else age60Plus++;
    });

    const agingAnalysis = [
      { range: '0–7 Days', count: age0_7 },
      { range: '8–30 Days', count: age8_30 },
      { range: '31–60 Days', count: age31_60 },
      { range: '>60 Days', count: age60Plus }
    ];

    // Overdue Issues Table (extract up to 20 overdue issues for dashboard table)
    const overdueIssues = issues
      .filter(i => i.status !== 'Completed' && i.status !== 'Closed' && i.dueDate < CURRENT_DATE_STR)
      .map(i => {
        const daysOverdue = differenceInDays(CURRENT_DATE, parseISO(i.dueDate));
        return {
          issueId: i.issueId,
          project: i.project,
          category: i.category,
          priority: i.priority,
          dueDate: i.dueDate,
          daysOverdue
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    // 12. Recent Issues by Topic (7, 14, 30 days)
    const getRecentIssuesByTopic = (days: number) => {
      const boundaryDate = new Date(CURRENT_DATE);
      boundaryDate.setDate(boundaryDate.getDate() - days);
      
      const yyyy = boundaryDate.getFullYear();
      const mm = String(boundaryDate.getMonth() + 1).padStart(2, '0');
      const dd = String(boundaryDate.getDate()).padStart(2, '0');
      const boundaryDateStr = `${yyyy}-${mm}-${dd}`;
      
      const recentIssues = issues.filter(i => i.openDate >= boundaryDateStr && i.openDate <= CURRENT_DATE_STR);
      
      const counts: Record<string, number> = {};
      recentIssues.forEach(i => {
        counts[i.project] = (counts[i.project] || 0) + 1;
      });
      
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const recentIssuesByTopic = {
      last7Days: getRecentIssuesByTopic(7),
      last14Days: getRecentIssuesByTopic(14),
      last30Days: getRecentIssuesByTopic(30)
    };

    // Filter values checklist for UI filter dropdowns (unique values in current database state)
    const allIssues = await dbService.getIssues();
    const uniqueValues = (field: keyof Issue) => {
      const vals = new Set<string>();
      allIssues.forEach(i => {
        if (i[field]) vals.add(String(i[field]));
      });
      return Array.from(vals).sort();
    };

    const filterDropdowns = {
      projects: uniqueValues('project'),
      categories: uniqueValues('category'),
      statuses: uniqueValues('status'),
      priorities: uniqueValues('priority'),
      descriptions: uniqueValues('description')
    };

    // Calculate specific KPIs for this filtered set
    const totalCount = issues.length;
    const closedCountKPI = issues.filter(i => i.status === 'Completed' || i.status === 'Closed').length;
    const openCountKPI = issues.filter(i => i.status === 'Pending').length;
    const inProgressCountKPI = issues.filter(i => i.status === 'In Progress').length;
    const overdueCountKPI = issues.filter(i => i.status !== 'Completed' && i.status !== 'Closed' && i.dueDate < CURRENT_DATE_STR).length;
    const criticalCountKPI = issues.filter(i => i.status !== 'Completed' && i.status !== 'Closed' && i.priority === 'High').length;
    const resolutionRateKPI = totalCount > 0 ? parseFloat(((closedCountKPI / totalCount) * 100).toFixed(1)) : 0;
    
    const closedIssuesList = issues.filter(i => (i.status === 'Completed' || i.status === 'Closed') && i.openDate && i.closedDate);
    let avgTimeKPI = 0;
    if (closedIssuesList.length > 0) {
      const totalDays = closedIssuesList.reduce((sum, issue) => {
        return sum + Math.max(0, differenceInDays(parseISO(issue.closedDate!), parseISO(issue.openDate)));
      }, 0);
      avgTimeKPI = parseFloat((totalDays / closedIssuesList.length).toFixed(1));
    }

    let slaKPI = 100;
    if (closedIssuesList.length > 0) {
      const compliantClosed = closedIssuesList.filter(i => i.closedDate! <= i.dueDate).length;
      slaKPI = parseFloat(((compliantClosed / closedIssuesList.length) * 100).toFixed(1));
    }

    const filteredKPIs = {
      totalIssues: totalCount,
      openIssues: openCountKPI,
      inProgressIssues: inProgressCountKPI,
      closedIssues: closedCountKPI,
      overdueIssues: overdueCountKPI,
      criticalIssues: criticalCountKPI,
      resolutionRate: resolutionRateKPI,
      averageResolutionTimeDays: avgTimeKPI,
      slaCompliance: slaKPI
    };

    return NextResponse.json({
      statusDistribution,
      byProject,
      byCategory,
      byPriority,
      monthlyTrend,
      resolutionTimeTrend,
      paretoAnalysis,
      topRepeatedIssues,
      topTopics,
      agingAnalysis,
      overdueIssues,
      recentIssuesByTopic,
      filterDropdowns,
      kpis: filteredKPIs
    });

  } catch (error: any) {
    console.error('Error generating analytics:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
