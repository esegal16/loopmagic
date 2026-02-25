import { ExcelMetrics } from '@/lib/types';

interface KeyMetricsDashboardProps {
  metrics: ExcelMetrics;
}

export function KeyMetricsDashboard({ metrics }: KeyMetricsDashboardProps) {
  const formatPct = (val: number | null): string => {
    if (val === null) return 'N/A';
    return `${(val * 100).toFixed(1)}%`;
  };

  const formatCurrency = (val: number | null): string => {
    if (val === null) return 'N/A';
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const items = [
    { label: 'LEVERED IRR', value: formatPct(metrics.irr.levered) },
    { label: 'GOING-IN CAP', value: formatPct(metrics.acquisition.goingInCapRate) },
    { label: 'YEAR 1 NOI', value: formatCurrency(metrics.year1.noi) },
    { label: 'GROSS EXIT (YR 5)', value: formatCurrency(metrics.exit.netSaleProceeds) },
  ];

  return (
    <div className="flex border-b border-lm-border bg-lm-page">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`flex-1 px-6 py-5 ${i < items.length - 1 ? 'border-r border-lm-border' : ''}`}
        >
          <p className="font-heading text-[10px] font-semibold tracking-wide text-lm-text-tertiary">
            {item.label}
          </p>
          <p className="font-heading text-2xl font-bold text-lm-text mt-1">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
