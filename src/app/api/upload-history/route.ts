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

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing log ID' }, { status: 400 });
    }
    
    await dbService.deleteUploadHistory(id);
    return NextResponse.json({ success: true, message: 'Upload history log and associated issues deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting upload history:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
