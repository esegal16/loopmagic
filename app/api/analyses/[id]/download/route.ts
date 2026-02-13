import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnalysis } from '@/lib/supabase/database';
import { downloadExcelFile } from '@/lib/supabase/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
        { status: 401 }
      );
    }

    const analysis = await getAnalysis(supabase, id);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Analysis not found' } },
        { status: 404 }
      );
    }

    // Check ownership
    if (analysis.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if file path exists
    if (!analysis.excel_file_path) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FILE', message: 'Excel file not available' } },
        { status: 404 }
      );
    }

    // Download file
    const buffer = await downloadExcelFile(supabase, analysis.excel_file_path);

    // Get filename from path
    const filename = analysis.excel_file_path.split('/').pop() || `analysis-${id}.xlsx`;

    // Return file
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DOWNLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to download file',
        },
      },
      { status: 500 }
    );
  }
}
