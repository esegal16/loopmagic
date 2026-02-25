import { ExcelMetrics } from '@/lib/types';
import { Badge } from '../ui/Badge';

interface MetricsTableProps {
  metrics: ExcelMetrics;
}

export function MetricsTable({ metrics }: MetricsTableProps) {
  const formatCurrency = (val: number | null): string => {
    if (val === null) return 'N/A';
    return val >= 1000000
      ? `$${(val / 1000000).toFixed(2)}M`
      : `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const formatPct = (val: number | null): string => {
    if (val === null) return 'N/A';
    return `${(val * 100).toFixed(2)}%`;
  };

  const formatMultiple = (val: number | null): string => {
    if (val === null) return 'N/A';
    return `${val.toFixed(2)}x`;
  };

  const formatNum = (val: number | null): string => {
    if (val === null) return 'N/A';
    return val.toFixed(2);
  };

  const sections = [
    {
      title: 'Returns Summary',
      metrics: [
        { label: 'Levered IRR', value: formatPct(metrics.irr.levered), highlight: true },
        { label: 'Unlevered IRR', value: formatPct(metrics.irr.unlevered) },
        { label: 'Equity Multiple', value: formatMultiple(metrics.equityMultiple.levered), highlight: true },
        { label: 'Cash-on-Cash (Y1)', value: formatPct(metrics.cashOnCash), highlight: true },
        { label: 'Total Profit', value: formatCurrency(metrics.profit.levered) },
      ],
    },
    {
      title: 'Acquisition',
      metrics: [
        { label: 'Purchase Price', value: formatCurrency(metrics.acquisition.purchasePrice) },
        { label: 'Total Acquisition Cost', value: formatCurrency(metrics.acquisition.totalAcquisitionCost) },
        { label: 'Going-in Cap Rate', value: formatPct(metrics.acquisition.goingInCapRate) },
        { label: 'Price Per Unit', value: formatCurrency(metrics.acquisition.pricePerUnit) },
        { label: 'Price Per SF', value: formatCurrency(metrics.acquisition.pricePerSF) },
        { label: 'Equity Required', value: formatCurrency(metrics.acquisition.equityRequired) },
        { label: 'Loan Amount', value: formatCurrency(metrics.acquisition.loanAmount) },
      ],
    },
    {
      title: 'Year 1 Operations',
      metrics: [
        { label: 'Effective Gross Income', value: formatCurrency(metrics.year1.effectiveGrossIncome) },
        { label: 'Total Operating Expenses', value: formatCurrency(metrics.year1.totalOperatingExpenses) },
        { label: 'Net Operating Income', value: formatCurrency(metrics.year1.noi), highlight: true },
        { label: 'NOI Margin', value: formatPct(metrics.year1.noiMargin) },
        { label: 'Yield on Cost', value: formatPct(metrics.year1.yieldOnCost) },
        { label: 'DSCR', value: formatNum(metrics.year1.dscr), highlight: true },
        { label: 'CapEx Reserves', value: formatCurrency(metrics.year1.capexReserves) },
        { label: 'Debt Service', value: formatCurrency(metrics.year1.totalDebtService) },
        { label: 'Levered Cash Flow', value: formatCurrency(metrics.year1.leveredCashFlow), highlight: true },
      ],
    },
    {
      title: 'Exit Analysis',
      metrics: [
        { label: 'Exit Cap Rate', value: formatPct(metrics.exit.exitCapRate) },
        { label: 'Hold Period', value: `${metrics.exit.holdPeriodYears} years` },
        { label: 'Net Sale Proceeds', value: formatCurrency(metrics.exit.netSaleProceeds) },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold text-lm-text-secondary uppercase tracking-wider mb-3">
            {section.title}
          </h3>
          <div className="bg-white rounded-lg border border-lm-border divide-y divide-lm-border">
            {section.metrics.map((metric) => (
              <div
                key={metric.label}
                className="flex justify-between items-center px-4 py-3"
              >
                <span className="text-sm text-lm-text-secondary">{metric.label}</span>
                <span
                  className={`text-sm font-medium ${
                    metric.highlight ? 'text-lm-green' : 'text-lm-text'
                  }`}
                >
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Summary metrics component for cards/headers
interface MetricsSummaryProps {
  metrics: ExcelMetrics;
}

export function MetricsSummary({ metrics }: MetricsSummaryProps) {
  const formatPct = (val: number | null): string => {
    if (val === null) return 'N/A';
    return `${(val * 100).toFixed(1)}%`;
  };

  const formatMultiple = (val: number | null): string => {
    if (val === null) return 'N/A';
    return `${val.toFixed(2)}x`;
  };

  const summaryMetrics = [
    { label: 'IRR', value: formatPct(metrics.irr.levered) },
    { label: 'Multiple', value: formatMultiple(metrics.equityMultiple.levered) },
    { label: 'CoC', value: formatPct(metrics.cashOnCash) },
    { label: 'DSCR', value: metrics.year1.dscr?.toFixed(2) || 'N/A' },
  ];

  return (
    <div className="flex gap-4">
      {summaryMetrics.map((m) => (
        <div key={m.label} className="text-center">
          <p className="text-xs text-lm-text-secondary uppercase">{m.label}</p>
          <p className="text-lg font-semibold text-lm-text">{m.value}</p>
        </div>
      ))}
    </div>
  );
}
