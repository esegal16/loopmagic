import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { listUserAnalysesWithProperties } from '@/lib/supabase/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { BarChart3 } from 'lucide-react';

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
          <h1 className="text-2xl font-heading font-bold text-lm-text">Analysis History</h1>
          <p className="text-lm-text-secondary mt-1">
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
            <div className="w-12 h-12 bg-lm-card rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-lm-text-tertiary" />
            </div>
            <h2 className="text-lg font-heading font-semibold text-lm-text mb-2">No analyses yet</h2>
            <p className="text-lm-text-secondary mb-6">
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
