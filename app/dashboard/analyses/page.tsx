import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { listUserAnalysesWithProperties } from '@/lib/supabase/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';

export const metadata = {
  title: 'Analysis History - LoopMagic',
  description: 'View your analysis history',
};

export default async function AnalysesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const analyses = await listUserAnalysesWithProperties(supabase, user.id, {
    limit: 50,
  });

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
          <p className="text-gray-600 mt-1">
            {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'}
          </p>
        </div>
        <Link href="/dashboard/analyze">
          <Button>New Analysis</Button>
        </Link>
      </div>

      {analyses.length === 0 ? (
        <Card variant="bordered" padding="lg">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No analyses yet</h2>
            <p className="text-gray-500 mb-6">
              Start by analyzing a LoopNet property listing.
            </p>
            <Link href="/dashboard/analyze">
              <Button>Run Your First Analysis</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <AnalysisCard key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  );
}
