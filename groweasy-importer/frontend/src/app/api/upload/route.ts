import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const csvContent = await file.text();
    
    let records;
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (parseError) {
      // Try with auto-detect columns
      try {
        records = parse(csvContent, {
          columns: (headers: string[]) => headers.map((h, i) => h || `column_${i + 1}`),
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        });
      } catch (retryError) {
        return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400 });
      }
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Extract headers
    let columns: string[] = [];
    if (records && records.length > 0) {
      columns = Object.keys(records[0] as any);
    }

    return NextResponse.json({
      preview: records.slice(0, 100), // First 100 for preview
      columns,
      totalRows: records.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to parse CSV file' }, { status: 500 });
  }
}
