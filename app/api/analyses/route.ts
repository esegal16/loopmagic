import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listUserAnalysesWithProperties } from '@/lib/supabase/database';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') as 'pending' | 'processing' | 'complete' | 'failed' | null;

    const analyses = await listUserAnalysesWithProperties(supabase, user.id, {
      limit,
      offset,
      status: status || undefined,
    });

    return NextResponse.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    console.error('List analyses error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list analyses',
        },
      },
      { status: 500 }
    );
  }
}
