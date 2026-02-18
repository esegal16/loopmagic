import Link from 'next/link';
import { Badge, RecommendationBadge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { DbAnalysis, DbProperty } from '@/lib/supabase/database';

interface AnalysisCardProps {
  analysis: DbAnalysis & { property?: DbProperty | null };
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const property = analysis.property;
  const metrics = analysis.excel_metrics;
  const dealAnalysis = analysis.deal_analysis;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'N/A';
    return val >= 1000000
      ? `$${(val / 1000000).toFixed(1)}M`
      : `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const formatPct = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'N/A';
    return `${(val * 100).toFixed(1)}%`;
  };

  const statusConfig = {
    pending: { label: 'Pending', variant: 'default' as const },
    processing: { label: 'Processing', variant: 'info' as const },
    complete: { label: 'Complete', variant: 'success' as const },
    failed: { label: 'Failed', variant: 'danger' as const },
  };

  const status = statusConfig[analysis.status];

  return (
    <Link href={`/dashboard/analyses/${analysis.id}`}>
      <Card
        variant="bordered"
        padding="md"
        className="hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-medium text-gray-900 truncate max-w-xs">
              {property?.address?.fullAddress || property?.property_name || 'Unknown Property'}
            </h3>
            <p className="text-sm text-gray-500">
              {property?.property_type || 'Property'} - {property?.units ?? '?'} units
            </p>
          </div>
          <div className="flex items-center gap-2">
            {analysis.status === 'complete' && dealAnalysis?.recommendation && (
              <RecommendationBadge
                verdict={dealAnalysis.recommendation.verdict}
                size="sm"
              />
            )}
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
          </div>
        </div>

        {analysis.status === 'complete' && metrics && (
          <div className="grid grid-cols-4 gap-4 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <p className="text-sm font-medium">
                {formatCurrency(metrics.acquisition?.purchasePrice)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">IRR</p>
              <p className="text-sm font-medium text-blue-600">
                {formatPct(metrics.irr?.levered)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Multiple</p>
              <p className="text-sm font-medium">
                {metrics.equityMultiple?.levered?.toFixed(2) || 'N/A'}x
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">DSCR</p>
              <p className="text-sm font-medium">
                {metrics.year1?.dscr?.toFixed(2) || 'N/A'}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {formatDate(analysis.created_at)}
          </span>
          {analysis.total_duration_ms && (
            <span className="text-xs text-gray-400">
              {(analysis.total_duration_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
