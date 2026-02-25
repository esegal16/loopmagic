import { DealAnalysis } from '@/lib/types';
import { Badge } from '../ui/Badge';

interface RiskAssessmentProps {
  analysis: DealAnalysis;
}

export function RiskAssessment({ analysis }: RiskAssessmentProps) {
  const probabilityVariant = {
    high: 'danger' as const,
    medium: 'warning' as const,
    low: 'info' as const,
  };

  const impactVariant = {
    high: 'danger' as const,
    medium: 'warning' as const,
    low: 'info' as const,
  };

  return (
    <div className="space-y-6">
      {/* Market & Submarket */}
      {analysis.marketAndSubmarket && (
        <div>
          <h3 className="text-sm font-semibold text-lm-text-secondary uppercase tracking-wider mb-3">
            Market & Submarket
          </h3>
          <div className="bg-white rounded-lg border border-lm-border p-4">
            <p className="text-sm text-lm-text-secondary whitespace-pre-wrap">
              {analysis.marketAndSubmarket}
            </p>
          </div>
        </div>
      )}

      {/* Value-Add & Upside */}
      {analysis.valueAddAndUpside && (
        <div>
          <h3 className="text-sm font-semibold text-lm-text-secondary uppercase tracking-wider mb-3">
            Value-Add & Upside
          </h3>
          <div className="bg-white rounded-lg border border-lm-border p-4">
            <p className="text-sm text-lm-text-secondary whitespace-pre-wrap">
              {analysis.valueAddAndUpside}
            </p>
          </div>
        </div>
      )}

      {/* Risk Matrix */}
      {analysis.riskMatrix && analysis.riskMatrix.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-lm-text-secondary uppercase tracking-wider mb-3">
            Risk Matrix
          </h3>
          <div className="space-y-4">
            {analysis.riskMatrix.map((risk: { risk: string; probability: 'low' | 'medium' | 'high'; impact: 'low' | 'medium' | 'high'; mitigation: string }, i: number) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-lm-border p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={probabilityVariant[risk.probability]} size="sm">
                    P: {risk.probability.toUpperCase()}
                  </Badge>
                  <Badge variant={impactVariant[risk.impact]} size="sm">
                    I: {risk.impact.toUpperCase()}
                  </Badge>
                  <span className="font-medium text-lm-text">{risk.risk}</span>
                </div>
                {risk.mitigation && (
                  <p className="text-sm text-lm-text-secondary">
                    <span className="font-medium">Mitigation: </span>
                    {risk.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
