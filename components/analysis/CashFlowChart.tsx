import { ExcelMetrics } from '@/lib/types';

interface CashFlowChartProps {
  metrics: ExcelMetrics;
}

export function CashFlowChart({ metrics }: CashFlowChartProps) {
  const y1 = metrics.year1.leveredCashFlow;
  if (y1 === null) return null;

  // Generate projected years based on year 1 cash flow with ~8% annual growth
  const years = Array.from({ length: 5 }, (_, i) => {
    const val = Math.round(y1 * Math.pow(1.08, i));
    return { year: i + 1, value: val };
  });

  const maxVal = Math.max(...years.map((y) => y.value));
  const maxBarHeight = 94; // px

  const formatShort = (val: number): string => {
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    return `$${Math.round(val / 1000)}K`;
  };

  return (
    <div className="bg-lm-card rounded p-5">
      <p className="font-heading text-[11px] font-semibold tracking-wide text-lm-text-tertiary mb-3">
        PROJECTED ANNUAL CASH FLOW
      </p>
      <div className="flex items-end gap-2 h-[120px]">
        {years.map((yr) => {
          const height = Math.max(20, (yr.value / maxVal) * maxBarHeight);
          const isLast = yr.year === 5;
          return (
            <div
              key={yr.year}
              className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full"
            >
              <span className="font-heading text-[10px] font-semibold text-lm-text-tertiary">
                {formatShort(yr.value)}
              </span>
              <div
                className={`w-full ${isLast ? 'bg-lm-green' : 'bg-lm-text'} rounded-sm`}
                style={{ height: `${height}px` }}
              />
              <span className="font-heading text-[10px] font-semibold tracking-wide text-lm-text-tertiary">
                YR {yr.year}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
