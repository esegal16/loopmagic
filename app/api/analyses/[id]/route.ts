import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnalysis, getProperty, deleteAnalysis } from '@/lib/supabase/database';
import { deleteAnalysisFiles } from '@/lib/supabase/storage';

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

    // Get associated property
    let property = null;
    if (analysis.property_id) {
      property = await getProperty(supabase, analysis.property_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        property,
      },
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get analysis',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete files from storage
    await deleteAnalysisFiles(supabase, user.id, id);

    // Delete from database
    await deleteAnalysis(supabase, id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete analysis',
        },
      },
      { status: 500 }
    );
  }
}
