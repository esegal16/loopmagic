import { AnalyzeForm } from '@/components/analysis/AnalyzeForm';

export const metadata = {
  title: 'New Analysis - LoopMagic',
  description: 'Analyze a new property',
};

export default function AnalyzePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Analysis</h1>
        <p className="text-gray-600 mt-1">
          Analyze a LoopNet listing to get a comprehensive investment memo.
        </p>
      </div>

      <AnalyzeForm />

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-4">What you'll get:</h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-600">
              <strong>Full Proforma Excel</strong> - 5-year cash flow projections with IRR, equity multiple, and more
            </span>
          </li>
          <li className="flex gap-3">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-600">
              <strong>AI-Powered Analysis</strong> - Executive summary, key metrics assessment, and buy/pass recommendation
            </span>
          </li>
          <li className="flex gap-3">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-600">
              <strong>Risk Assessment</strong> - Detailed breakdown of risks, strengths, and weaknesses
            </span>
          </li>
          <li className="flex gap-3">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-600">
              <strong>Market Context</strong> - How this deal compares to market benchmarks
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
