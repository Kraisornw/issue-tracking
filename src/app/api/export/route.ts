import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

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

    let issues = await dbService.getIssues();

    // Apply filters
    if (project) issues = issues.filter(i => i.project.toLowerCase() === project.toLowerCase());
    if (category) issues = issues.filter(i => i.category.toLowerCase() === category.toLowerCase());
    if (discipline) issues = issues.filter(i => i.discipline.toLowerCase() === discipline.toLowerCase());
    if (status) issues = issues.filter(i => i.status.toLowerCase() === status.toLowerCase());
    if (priority) issues = issues.filter(i => i.priority.toLowerCase() === priority.toLowerCase());
    if (severity) issues = issues.filter(i => i.severity.toLowerCase() === severity.toLowerCase());
    if (responsible) issues = issues.filter(i => i.responsible.toLowerCase() === responsible.toLowerCase());
    if (location) issues = issues.filter(i => i.location.toLowerCase() === location.toLowerCase());
    if (startDate) issues = issues.filter(i => i.openDate >= startDate);
    if (endDate) issues = issues.filter(i => i.openDate <= endDate);

    // Convert issues to CSV content
    const headers = [
      'Issue ID', 'Date', 'Topic / Agenda', 'Discussion', 
      'Action Item', 'Due Date', 'Priority', 'Status', 'Comment'
    ];

    const escapeCsvCell = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [headers.join(',')];

    for (const issue of issues) {
      const row = [
        escapeCsvCell(issue.issueId),
        escapeCsvCell(issue.openDate),
        escapeCsvCell(issue.project),
        escapeCsvCell(issue.category),
        escapeCsvCell(issue.description),
        escapeCsvCell(issue.dueDate),
        escapeCsvCell(issue.priority),
        escapeCsvCell(issue.status),
        escapeCsvCell(issue.location)
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Return as downloadable file
    const headersResponse = new Headers();
    headersResponse.set('Content-Type', 'text/csv; charset=utf-8');
    headersResponse.set('Content-Disposition', `attachment; filename="issues_export_${new Date().toISOString().substring(0, 10)}.csv"`);

    return new Response(csvContent, {
      status: 200,
      headers: headersResponse
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
