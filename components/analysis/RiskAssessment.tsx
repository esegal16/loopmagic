import { DealAnalysis } from '@/lib/types';
import { Badge } from '../ui/Badge';

interface RiskAssessmentProps {
  analysis: DealAnalysis;
}

export function RiskAssessment({ analysis }: RiskAssessmentProps) {
  const severityVariant = {
    high: 'danger' as const,
    medium: 'warning' as const,
    low: 'info' as const,
  };

  return (
    <div className="space-y-6">
      {/* Strengths */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Strengths
        </h3>
        <ul className="space-y-2">
          {analysis.strengths.map((strength, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-green-500 flex-shrink-0">+</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Weaknesses */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Weaknesses
        </h3>
        <ul className="space-y-2">
          {analysis.weaknesses.map((weakness, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-red-500 flex-shrink-0">-</span>
              <span>{weakness}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Risks */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Risk Assessment
        </h3>
        <div className="space-y-4">
          {analysis.risks.map((risk, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={severityVariant[risk.severity]} size="sm">
                  {risk.severity.toUpperCase()}
                </Badge>
                <span className="font-medium text-gray-900">{risk.category}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
              {risk.mitigation && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Mitigation: </span>
                  {risk.mitigation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Market Context */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Market Context
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Cap Rate Comparison</h4>
            <p className="text-sm text-gray-600">{analysis.marketContext.capRateComparison}</p>
          </div>
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Returns Benchmark</h4>
            <p className="text-sm text-gray-600">{analysis.marketContext.returnsBenchmark}</p>
          </div>
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Market Trends</h4>
            <p className="text-sm text-gray-600">{analysis.marketContext.marketTrends}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
