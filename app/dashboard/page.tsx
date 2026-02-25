import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserStats } from '@/lib/supabase/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { BarChart3, CheckCircle, Building } from 'lucide-react';

export const metadata = {
  title: 'Dashboard - LoopMagic',
  description: 'Your LoopMagic dashboard',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const stats = await getUserStats(supabase, user.id);

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-lm-text">Dashboard</h1>
          <p className="text-lm-text-secondary mt-1">Welcome back! Here's your analysis overview.</p>
        </div>
        <Link href="/dashboard/analyze">
          <Button>New Analysis</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-lm-card rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-lm-text-secondary" />
            </div>
            <div>
              <p className="text-sm text-lm-text-secondary">Total Analyses</p>
              <p className="text-2xl font-bold text-lm-text">{stats.totalAnalyses}</p>
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-lm-green/15 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-lm-green" />
            </div>
            <div>
              <p className="text-sm text-lm-text-secondary">Completed</p>
              <p className="text-2xl font-bold text-lm-text">{stats.completedAnalyses}</p>
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-lm-blue/15 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-lm-blue" />
            </div>
            <div>
              <p className="text-sm text-lm-text-secondary">Properties</p>
              <p className="text-2xl font-bold text-lm-text">{stats.totalProperties}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Analyses */}
      <Card variant="bordered" padding="md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Analyses</CardTitle>
            <Link href="/dashboard/analyses">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          {stats.recentAnalyses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lm-text-secondary mb-4">No analyses yet</p>
              <Link href="/dashboard/analyze">
                <Button>Run Your First Analysis</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentAnalyses.map((analysis) => (
                <AnalysisCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
