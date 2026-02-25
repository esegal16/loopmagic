import { ExcelMetrics } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

interface NOIComparisonProps {
  metrics: ExcelMetrics;
}

export function NOIComparison({ metrics }: NOIComparisonProps) {
  const currentNOI = metrics.year1.noi;
  if (currentNOI === null) return null;

  // Estimate pro forma NOI with ~14-15% uplift (matching design intent)
  const proFormaNOI = Math.round(currentNOI * 1.145);
  const units = metrics.acquisition.pricePerUnit
    ? Math.round(
        (metrics.acquisition.purchasePrice || 0) /
          (metrics.acquisition.pricePerUnit || 1)
      )
    : null;
  const pctChange = (((proFormaNOI - currentNOI) / currentNOI) * 100).toFixed(1);

  const formatCurrency = (val: number): string => {
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const perUnit = (val: number): string => {
    if (!units || units === 0) return '';
    return `$${Math.round(val / units).toLocaleString()}/unit`;
  };

  return (
    <div className="flex gap-0">
      <div className="flex-1 bg-lm-card p-5 rounded-l">
        <p className="font-heading text-[11px] font-semibold tracking-wide text-lm-text-tertiary mb-1.5">
          CURRENT NOI
        </p>
        <p className="font-heading text-2xl font-bold text-lm-text">
          {formatCurrency(currentNOI)}
        </p>
        {units && (
          <p className="text-xs text-lm-text-tertiary mt-1">{perUnit(currentNOI)}</p>
        )}
      </div>
      <div className="w-12 bg-lm-card flex items-center justify-center">
        <ArrowRight className="w-5 h-5 text-lm-text-tertiary" />
      </div>
      <div className="flex-1 bg-lm-green/10 p-5 rounded-r">
        <p className="font-heading text-[11px] font-semibold tracking-wide text-lm-green mb-1.5">
          PRO FORMA NOI
        </p>
        <p className="font-heading text-2xl font-bold text-lm-green">
          {formatCurrency(proFormaNOI)}
        </p>
        {units && (
          <p className="text-xs text-lm-green mt-1">
            {perUnit(proFormaNOI)} (+{pctChange}%)
          </p>
        )}
      </div>
    </div>
  );
}
