import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scrapeLoopNetProperty } from '@/lib/scraper/loopnet';
import { cleanPropertyData } from '@/lib/cleaner/data-cleaner';
import { mergeAssumptions } from '@/lib/assumptions/merge';
import { generateExcel } from '@/lib/excel/generator';
import { evaluateExcelMetrics } from '@/lib/analyzer/excel-evaluator';
import { analyzeDeal } from '@/lib/analyzer/deal-analyzer';
import { createProperty, createAnalysis, updateAnalysis } from '@/lib/supabase/database';
import { uploadExcelFile } from '@/lib/supabase/storage';
import { AnalyzeRequest, FinalAssumptions } from '@/lib/types';

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Please log in to analyze properties' } },
        { status: 401 }
      );
    }

    // Parse request
    const body: AnalyzeRequest = await request.json();
    const { loopnetUrl, assumptionOverrides } = body;

    if (!loopnetUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_URL', message: 'LoopNet URL is required' } },
        { status: 400 }
      );
    }

    // Step 1: Scrape property data
    const scrapeStart = Date.now();
    let property;
    try {
      property = await scrapeLoopNetProperty(loopnetUrl);
    } catch (error) {
      console.error('Scraping error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SCRAPE_FAILED',
            message: 'Could not retrieve listing data. Please check the URL and try again.',
          },
        },
        { status: 422 }
      );
    }
    const scrapeDurationMs = Date.now() - scrapeStart;

    // Step 2: Extract assumptions with Claude
    const cleanerStart = Date.now();
    const extractedAssumptions = await cleanPropertyData(property);
    const cleanerDurationMs = Date.now() - cleanerStart;

    // Step 3: Merge with defaults and overrides
    let finalAssumptions = mergeAssumptions(extractedAssumptions, property);
    if (assumptionOverrides) {
      finalAssumptions = { ...finalAssumptions, ...assumptionOverrides };
    }

    // Step 4: Save property to database
    const dbProperty = await createProperty(supabase, user.id, property);

    // Step 5: Create analysis record (processing status)
    const dbAnalysis = await createAnalysis(supabase, user.id, {
      propertyId: dbProperty.id,
      assumptions: finalAssumptions,
      status: 'processing',
    });

    // Step 6: Generate Excel
    const excelResult = await generateExcel({
      property,
      assumptions: finalAssumptions,
    });

    if (!excelResult.success || !excelResult.buffer) {
      await updateAnalysis(supabase, dbAnalysis.id, {
        status: 'failed',
        errorMessage: 'Failed to generate Excel file',
      });
      return NextResponse.json(
        { success: false, error: { code: 'EXCEL_ERROR', message: 'Failed to generate Excel file' } },
        { status: 500 }
      );
    }

    // Step 7: Extract metrics from Excel
    const excelMetrics = await evaluateExcelMetrics(excelResult.buffer);

    // Step 8: Run Claude analysis
    const analysisStart = Date.now();
    const dealAnalysis = await analyzeDeal(property, finalAssumptions, excelMetrics);
    const analysisDurationMs = Date.now() - analysisStart;

    // Step 9: Upload Excel to storage
    const { path: excelFilePath } = await uploadExcelFile(
      supabase,
      user.id,
      dbAnalysis.id,
      excelResult.buffer,
      excelResult.filename
    );

    // Step 10: Update analysis with results
    const totalDurationMs = Date.now() - startTime;
    await updateAnalysis(supabase, dbAnalysis.id, {
      excelMetrics,
      dealAnalysis,
      excelFilePath,
      status: 'complete',
      scrapeDurationMs,
      cleanerDurationMs,
      analysisDurationMs,
      totalDurationMs,
    });

    return NextResponse.json({
      success: true,
      data: {
        analysisId: dbAnalysis.id,
        property,
        assumptions: finalAssumptions,
        excelMetrics,
        dealAnalysis,
        downloadUrl: `/api/analyses/${dbAnalysis.id}/download`,
      },
      metadata: {
        processingTimeMs: totalDurationMs,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
