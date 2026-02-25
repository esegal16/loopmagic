import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAnalysis, getProperty } from '@/lib/supabase/database';
import { AnalysisDetail } from '@/components/analysis/AnalysisDetail';
import { AnalysisLoadingState } from '@/components/analysis/AnalysisLoadingState';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const analysis = await getAnalysis(supabase, id);

  if (!analysis) {
    return { title: 'Analysis Not Found - LoopMagic' };
  }

  let propertyName = 'Property Analysis';
  if (analysis.property_id) {
    const property = await getProperty(supabase, analysis.property_id);
    if (property?.raw_data?.address?.fullAddress) {
      propertyName = property.raw_data.address.fullAddress;
    }
  }

  return {
    title: `${propertyName} - LoopMagic`,
    description: `Investment analysis for ${propertyName}`,
  };
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const analysis = await getAnalysis(supabase, id);

  if (!analysis) {
    notFound();
  }

  // Check ownership
  if (analysis.user_id !== user.id) {
    notFound();
  }

  // Get property
  let property = null;
  if (analysis.property_id) {
    property = await getProperty(supabase, analysis.property_id);
  }

  // Show loading state for processing analyses
  if (analysis.status === 'pending' || analysis.status === 'processing') {
    return <AnalysisLoadingState property={property} />;
  }

  // Show error state for failed analyses
  if (analysis.status === 'failed') {
    return (
      <div className="max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Analysis Failed</h2>
          <p className="text-red-600">{analysis.error_message || 'An error occurred during analysis'}</p>
        </div>
      </div>
    );
  }

  return <AnalysisDetail analysis={analysis} property={property} />;
}
