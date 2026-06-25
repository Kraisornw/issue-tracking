import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

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

export async function DELETE(req: NextRequest) {
  try {
    await dbService.clearAllData();
    return NextResponse.json({ success: true, message: 'All data cleared successfully' });
  } catch (error: any) {
    console.error('Error clearing data:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
