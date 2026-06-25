import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { dbService } from '@/lib/db';
import { hasFirebaseConfig, storage } from '@/lib/firebaseAdmin';
import { hasSupabaseConfig } from '@/lib/supabaseClient';
import { Issue, ValidationError } from '@/types';
import fs from 'fs';
import path from 'path';

// Helper to format date into YYYY-MM-DD
function formatDate(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  
  if (val instanceof Date) {
    // Check if valid date
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  const str = String(val).trim();
  if (!str) return '';

  // Check if YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Handle other date formats (e.g. DD/MM/YYYY, MM/DD/YYYY)
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const dObj = new Date(parsed);
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const d = String(dObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Handle serial dates (numbers)
  const num = Number(str);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const dObj = new Date(excelEpoch.getTime() + num * 24 * 60 * 60 * 1000);
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const d = String(dObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      return NextResponse.json(
        { success: false, error: 'Only .xlsx and .xls file formats are supported' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read the Excel workbook
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    if (workbook.SheetNames.length === 0) {
      return NextResponse.json({ success: false, error: 'The workbook contains no sheets' }, { status: 400 });
    }

    let worksheet = null;
    let headers: string[] = [];
    let data: any[][] = [];
    let headerRowIdx = 0;

    const possibleHeaderNames = [
      'date', 'topic/agenda', 'topic / agenda', 'topicagenda',
      'action item', 'actionitem', 'status'
    ];

    // Scan all sheets to find the one containing the issue tracking table
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
      if (sheetData.length === 0) continue;

      let found = false;
      for (let r = 0; r < Math.min(sheetData.length, 10); r++) {
        const rowCells = sheetData[r].map(cell => String(cell).trim().toLowerCase());
        const matchCount = rowCells.filter(cell => 
          possibleHeaderNames.some(name => cell === name || cell.includes(name))
        ).length;

        if (matchCount >= 3) {
          worksheet = sheet;
          data = sheetData;
          headers = sheetData[r].map(h => String(h).trim());
          headerRowIdx = r;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // Fallback to the first sheet if no matching sheet is found
    if (!worksheet) {
      const name = workbook.SheetNames[0];
      worksheet = workbook.Sheets[name];
      data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][] || [];
      headers = data.length > 0 ? data[0].map(h => String(h).trim()) : [];
      headerRowIdx = 0;
    }

    console.log("Detected Sheet Headers:", headers);

    // Helper to find index of a column matching variations
    const colIdx = (names: string[]) => {
      for (const name of names) {
        const idx = headers.indexOf(name);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    // Map indexes supporting both typed text and Excel image names
    const idxOpenDate = colIdx(['Date', 'date']);
    const idxProject = colIdx(['Topic/Agenda', 'Topic / Agenda', 'topic/agenda']);
    const idxCategory = colIdx(['Discussion', 'discussion']);
    const idxDescription = colIdx(['Action Item', 'ActionItem', 'action item']);
    const idxDueDate = colIdx(['Due date', 'Due Date', 'due date', 'DueDate']);
    const idxPriority = colIdx(['Prioriry', 'Priority', 'priority', 'prioriry']);
    const idxStatus = colIdx(['Status', 'status']);
    const idxLocation = colIdx(['comment', 'Comments', 'Comment', 'comments']);

    const missingColumns: string[] = [];
    if (idxOpenDate === -1) missingColumns.push('Date');
    if (idxProject === -1) missingColumns.push('Topic/Agenda');
    if (idxCategory === -1) missingColumns.push('Discussion');
    if (idxDescription === -1) missingColumns.push('Action Item');
    if (idxDueDate === -1) missingColumns.push('Due date');
    if (idxPriority === -1) missingColumns.push('Prioriry');
    if (idxStatus === -1) missingColumns.push('Status');
    if (idxLocation === -1) missingColumns.push('comment');

    if (missingColumns.length > 0) {
      console.log("Validation Failed: Missing required columns. Parsed:", headers);
      return NextResponse.json({
        success: false,
        errorType: 'MISSING_HEADERS',
        error: `Missing required columns: ${missingColumns.join(', ')}`
      }, { status: 400 });
    }

    const validationErrors: ValidationError[] = [];
    const parsedIssues: Issue[] = [];
    const sheetIssueIds = new Set<string>();

    // Validate rows starting from index headerRowIdx + 1 (skip headers)
    for (let r = headerRowIdx + 1; r < data.length; r++) {
      const row = data[r];
      // Skip completely empty rows
      if (row.every(cell => cell === '')) continue;

      const project = String(row[idxProject]).trim();
      const category = String(row[idxCategory]).trim();
      const description = String(row[idxDescription]).trim();
      const priority = String(row[idxPriority]).trim();
      const status = String(row[idxStatus]).trim();
      const rawOpenDate = row[idxOpenDate];
      const rawDueDate = row[idxDueDate];
      const location = String(row[idxLocation]).trim();

      // 1. Format Open Date (fallback to today if missing/invalid)
      let openDateFormatted = formatDate(rawOpenDate);
      if (!openDateFormatted) {
        openDateFormatted = new Date().toISOString().substring(0, 10);
      }

      // 2. Format Due Date (fallback to open date if missing/invalid)
      let dueDateFormatted = formatDate(rawDueDate);
      if (!dueDateFormatted) {
        dueDateFormatted = openDateFormatted;
      }

      // 3. Normalized Topic / Agenda (fallback if empty)
      const finalProject = project || 'General Topic';

      // 4. Normalized Action Item description (fallback if empty)
      const finalDescription = description || 'No details provided';

      // 5. Standardize Status (default to 'Open')
      const normalizedStatus = status.toLowerCase();
      let finalStatus = 'Open';
      if (normalizedStatus === 'in progress' || normalizedStatus === 'progress' || normalizedStatus === 'pending') {
        finalStatus = 'In Progress';
      } else if (
        normalizedStatus === 'closed' || 
        normalizedStatus === 'close' || 
        normalizedStatus === 'compliance' || 
        normalizedStatus === 'compliant' ||
        normalizedStatus === 'done' ||
        normalizedStatus === 'complete' ||
        normalizedStatus === 'completed'
      ) {
        finalStatus = 'Closed';
      }

      // Auto closed date is set to due date if status is Closed, else null
      const closedDateFormatted = finalStatus === 'Closed' ? (dueDateFormatted || openDateFormatted) : null;

      // 6. Generate unique stable Issue ID, appending counter if duplicates found in sheet
      const cleanProject = finalProject.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      const cleanDescription = finalDescription.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
      const baseIssueId = `ISS-${openDateFormatted}-${cleanProject}-${cleanDescription}`.toUpperCase();
      
      let issueId = baseIssueId;
      let counter = 1;
      while (sheetIssueIds.has(issueId)) {
        issueId = `${baseIssueId}-${counter}`;
        counter++;
      }
      sheetIssueIds.add(issueId);

      parsedIssues.push({
        issueId,
        project: finalProject,
        category: category || 'Unassigned',
        discipline: 'General',
        priority: priority || 'Medium',
        severity: 'Major',
        status: finalStatus,
        openDate: openDateFormatted,
        dueDate: dueDateFormatted,
        closedDate: closedDateFormatted,
        responsible: 'Unassigned',
        location: location || 'Unassigned',
        description: finalDescription
      });
    }

    // Return all errors if validation failed (never triggers in lenient mode)
    if (validationErrors.length > 0) {
      // Record failure in history
      const elapsed = Date.now() - startTime;
      await dbService.addUploadHistory({
        fileName,
        totalRecords: data.length - 1,
        newRecords: 0,
        updatedRecords: 0,
        processingTimeMs: elapsed,
        status: 'failed',
        errors: validationErrors.map(e => `Row ${e.row} [${e.column}]: ${e.message}`)
      });

      return NextResponse.json({
        success: false,
        errorType: 'VALIDATION_FAILED',
        errors: validationErrors
      }, { status: 400 });
    }

    // Process Incremental Updates to Database
    const { newRecords, updatedRecords } = await dbService.upsertIssues(parsedIssues);

    // Save File to Storage
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    if (hasFirebaseConfig && storage && !hasSupabaseConfig) {
      try {
        const storagePath = `uploads/${year}/${month}/${Date.now()}_${fileName}`;
        const bucketFile = storage.bucket().file(storagePath);
        await bucketFile.save(buffer, {
          metadata: { contentType: file.type }
        });
      } catch (storageError) {
        console.error('Failed to upload file to Firebase Storage, saving locally as fallback:', storageError);
        // Fallback to local storage so that database write is NOT blocked by GCS bucket name mismatch/setup issues
        try {
          const localUploadDir = path.join(process.cwd(), 'public', 'uploads', String(year), String(month));
          if (!fs.existsSync(localUploadDir)) {
            fs.mkdirSync(localUploadDir, { recursive: true });
          }
          const localFilePath = path.join(localUploadDir, `${Date.now()}_${fileName}`);
          fs.writeFileSync(localFilePath, buffer);
        } catch (localWriteError) {
          console.error('Failed to save file locally:', localWriteError);
        }
      }
    } else {
      // Save locally to public/uploads
      const localUploadDir = path.join(process.cwd(), 'public', 'uploads', String(year), String(month));
      if (!fs.existsSync(localUploadDir)) {
        fs.mkdirSync(localUploadDir, { recursive: true });
      }
      const localFilePath = path.join(localUploadDir, `${Date.now()}_${fileName}`);
      fs.writeFileSync(localFilePath, buffer);
    }

    // Add success history log
    const elapsed = Date.now() - startTime;
    await dbService.addUploadHistory({
      fileName,
      totalRecords: parsedIssues.length,
      newRecords,
      updatedRecords,
      processingTimeMs: elapsed,
      status: 'success'
    });

    return NextResponse.json({
      success: true,
      fileName,
      totalRecords: parsedIssues.length,
      newRecords,
      updatedRecords,
      processingTime: `${(elapsed / 1000).toFixed(1)}s`
    });

  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
