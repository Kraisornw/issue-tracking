import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { Issue } from '@/types';

// Helper to calculate hash code for stable IDs
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return (hash >>> 0).toString(16).toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    const issues = await dbService.getIssues();
    // Sort by openDate descending by default, then by issueId
    const sorted = [...issues].sort((a, b) => {
      const dateCompare = b.openDate.localeCompare(a.openDate);
      if (dateCompare !== 0) return dateCompare;
      return b.issueId.localeCompare(a.issueId);
    });
    return NextResponse.json(sorted);
  } catch (error: any) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      project, 
      category, 
      description, 
      openDate, 
      dueDate, 
      priority, 
      severity, 
      status, 
      location, 
      responsible, 
      discipline 
    } = body;
    
    if (!project || !category || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Format dates if not valid
    const formattedOpen = openDate || new Date().toISOString().substring(0, 10);
    const formattedDue = dueDate || formattedOpen;
    
    // Generate stable unique issueId
    const finalLocation = location || 'Unassigned';
    const uniqueKey = `${formattedOpen}|${project}|${category}|${finalLocation}|${description}`;
    const issueId = `ISS-${hashCode(uniqueKey)}`;
    
    const finalStatus = status || 'Open';
    const closedDate = finalStatus === 'Closed' ? formattedDue : null;
    
    const issue: Issue = {
      issueId,
      project,
      category,
      discipline: discipline || 'General',
      priority: priority || 'Medium',
      severity: severity || 'Major',
      status: finalStatus,
      openDate: formattedOpen,
      dueDate: formattedDue,
      closedDate,
      responsible: responsible || 'Unassigned',
      location: finalLocation,
      description,
      uploadId: null // manual issues don't have an uploadId
    };
    
    await dbService.upsertIssues([issue]);
    
    return NextResponse.json({ success: true, issue });
  } catch (error: any) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (id) {
      await dbService.deleteIssue(id);
      return NextResponse.json({ success: true, message: `Issue ${id} deleted successfully` });
    } else {
      await dbService.clearAllData();
      return NextResponse.json({ success: true, message: 'All data cleared successfully' });
    }
  } catch (error: any) {
    console.error('Error deleting issue/data:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
