import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const history = await dbService.getUploadHistory();
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching upload history:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
