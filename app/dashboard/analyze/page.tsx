import { Check } from 'lucide-react';
import { AnalyzeForm } from '@/components/analysis/AnalyzeForm';

export const metadata = {
  title: 'New Analysis - LoopMagic',
  description: 'Analyze a new property',
};

export default function AnalyzePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-lm-text">New Analysis</h1>
        <p className="text-lm-text-secondary mt-1">
          Analyze a LoopNet listing to get a comprehensive investment memo.
        </p>
      </div>

      <AnalyzeForm />

      <div className="mt-8 bg-lm-card rounded-lg p-6">
        <h2 className="font-heading font-semibold text-lm-text mb-4">What you'll get:</h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <Check className="w-5 h-5 text-lm-green flex-shrink-0 mt-0.5" />
            <span className="text-lm-text-secondary">
              <strong className="text-lm-text">Full Proforma Excel</strong> - 5-year cash flow projections with IRR, equity multiple, and more
            </span>
          </li>
          <li className="flex gap-3">
            <Check className="w-5 h-5 text-lm-green flex-shrink-0 mt-0.5" />
            <span className="text-lm-text-secondary">
              <strong className="text-lm-text">AI-Powered Analysis</strong> - Executive summary, key metrics assessment, and buy/pass recommendation
            </span>
          </li>
          <li className="flex gap-3">
            <Check className="w-5 h-5 text-lm-green flex-shrink-0 mt-0.5" />
            <span className="text-lm-text-secondary">
              <strong className="text-lm-text">Risk Assessment</strong> - Detailed breakdown of risks, strengths, and weaknesses
            </span>
          </li>
          <li className="flex gap-3">
            <Check className="w-5 h-5 text-lm-green flex-shrink-0 mt-0.5" />
            <span className="text-lm-text-secondary">
              <strong className="text-lm-text">Market Context</strong> - How this deal compares to market benchmarks
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
