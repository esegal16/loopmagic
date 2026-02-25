'use client';

import { useState } from 'react';
import { DbAnalysis, DbProperty } from '@/lib/supabase/database';
import { AnalysisHeader } from './AnalysisHeader';
import { PropertyCard } from './PropertyCard';
import { KeyMetricsDashboard } from './KeyMetricsDashboard';
import { DownloadBar } from './DownloadBar';
import { CashFlowChart } from './CashFlowChart';
import { NOIComparison } from './NOIComparison';
import { RiskDot } from './RiskDot';

interface AnalysisDetailProps {
  analysis: DbAnalysis;
  property: DbProperty | null;
}

export function AnalysisDetail({ analysis, property }: AnalysisDetailProps) {
  const [downloading, setDownloading] = useState(false);

  const metrics = analysis.excel_metrics;
  const dealAnalysis = analysis.deal_analysis;
  const address = property?.address?.fullAddress || property?.property_name || 'Property Analysis';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/analyses/${analysis.id}/download`);
      if (!response.ok) throw new Error('Download failed');

      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/);
      const filename = filenameMatch?.[1] || `analysis-${analysis.id}.xlsx`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const verdictConfig: Record<string, { label: string; bg: string }> = {
    pursue: { label: 'PURSUE', bg: 'bg-lm-green' },
    watch: { label: 'WATCH', bg: 'bg-lm-amber' },
    pass: { label: 'PASS', bg: 'bg-lm-red' },
  };

  const verdict = dealAnalysis?.recommendation?.verdict;
  const vc = verdict ? verdictConfig[verdict] : null;

  // Analysis metadata
  const analyzedDate = analysis.created_at
    ? new Date(analysis.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;
  const durationSec = analysis.total_duration_ms
    ? `${Math.round(analysis.total_duration_ms / 1000)}s`
    : null;

  return (
    <div className="fixed inset-0 z-50 h-screen flex flex-col bg-white font-body">
      {/* Compact Header */}
      <AnalysisHeader />

      {/* Two-Panel Body */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT PANEL — IC Memo */}
        <div className="flex-1 overflow-y-auto bg-white lm-scrollbar">
          {/* Memo Header */}
          <div className="px-8 py-6 border-b border-lm-border">
            <div className="flex items-center gap-4">
              <h1 className="font-heading text-[22px] font-bold text-lm-text">
                {address}
              </h1>
              {vc && (
                <span
                  className={`inline-flex items-center px-3 py-1 ${vc.bg} text-white font-heading text-[11px] font-bold tracking-wide`}
                >
                  {vc.label}
                </span>
              )}
            </div>
            <p className="text-[13px] text-lm-text-tertiary font-body mt-2">
              {[
                analyzedDate ? `Analyzed ${analyzedDate}` : null,
                durationSec,
              ]
                .filter(Boolean)
                .join('  \u00B7  ')}
            </p>
          </div>

          {/* Download Excel Row */}
          <DownloadBar onDownload={handleDownload} downloading={downloading} />

          {/* Key Metrics Dashboard */}
          {metrics && <KeyMetricsDashboard metrics={metrics} />}

          {/* Memo Body */}
          <div className="px-8">
            {/* Section I: Summary */}
            {dealAnalysis?.executiveSummary && (
              <section className="py-7 border-b border-lm-border">
                <h2 className="font-heading text-[13px] font-bold tracking-wide text-lm-text mb-3">
                  I. SUMMARY
                </h2>
                <p className="text-sm text-lm-text-secondary leading-[1.7]">
                  {dealAnalysis.executiveSummary}
                </p>
              </section>
            )}

            {/* Section II: Investment Thesis */}
            {dealAnalysis?.investmentThesis && (
              <section className="py-7 border-b border-lm-border">
                <h2 className="font-heading text-[13px] font-bold tracking-wide text-lm-text mb-3">
                  II. INVESTMENT THESIS
                </h2>
                <ThesisContent text={dealAnalysis.investmentThesis} />
              </section>
            )}

            {/* Section III: Market & Submarket */}
            {dealAnalysis?.marketAndSubmarket && (
              <section className="py-7 border-b border-lm-border">
                <h2 className="font-heading text-[13px] font-bold tracking-wide text-lm-text mb-3">
                  III. MARKET & SUBMARKET
                </h2>
                <p className="text-sm text-lm-text-secondary leading-[1.7]">
                  {dealAnalysis.marketAndSubmarket}
                </p>
              </section>
            )}

            {/* Section IV: Financial Analysis */}
            {dealAnalysis?.financialAnalysis && (
              <section className="py-7 border-b border-lm-border">
                <h2 className="font-heading text-[13px] font-bold tracking-wide text-lm-text mb-4">
                  IV. FINANCIAL ANALYSIS
                </h2>

                {/* Financial Metrics Table */}
                {dealAnalysis.financialAnalysis.metrics &&
                  dealAnalysis.financialAnalysis.metrics.length > 0 && (
                    <div className="bg-lm-card rounded overflow-hidden mb-4">
                      <div className="flex justify-between items-center px-4 py-2.5 border-b-2 border-lm-text">
                        <span className="font-heading text-[11px] font-semibold tracking-wide text-lm-text">
                          METRIC
                        </span>
                        <span className="font-heading text-[11px] font-semibold tracking-wide text-lm-text">
                          VALUE
                        </span>
                      </div>
                      {dealAnalysis.financialAnalysis.metrics.map(
                        (
                          m: {
                            metric: string;
                            value: string;
                            assessment: string;
                            commentary: string;
                          },
                          i: number
                        ) => (
                          <div
                            key={i}
                            className={`flex justify-between items-center px-4 py-2.5 ${
                              i <
                              dealAnalysis.financialAnalysis.metrics.length - 1
                                ? 'border-b border-lm-border'
                                : ''
                            }`}
                          >
                            <span className="text-sm text-lm-text-secondary">
                              {m.metric}
                            </span>
                            <span className="font-heading text-sm font-semibold text-lm-text">
                              {m.value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                {/* Cash Flow Chart */}
                {metrics && <CashFlowChart metrics={metrics} />}
              </section>
            )}

            {/* Section V: Value-Add & Upside */}
            {dealAnalysis?.valueAddAndUpside && (
              <section className="py-7 border-b border-lm-border">
                <h2 className="font-heading text-[13px] font-bold tracking-wide text-lm-text mb-3">
                  V. VALUE-ADD & UPSIDE
                </h2>
                <p className="text-sm text-lm-text-secondary leading-[1.7] mb-3">
                  {dealAnalysis.valueAddAndUpside}
                </p>
                {metrics && <NOIComparison metrics={metrics} />}
              </section>
            )}

            {/* Section VI: Risk Matrix */}
            {dealAnalysis?.riskMatrix && dealAnalysis.riskMatrix.length > 0 && (
              <section className="py-7 border-b border-lm-border">
                <h2 className="font-heading text-[13px] font-bold tracking-wide text-lm-text mb-3">
                  VI. RISK MATRIX
                </h2>
                <div className="bg-lm-card rounded overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center px-4 py-2.5 border-b-2 border-lm-text">
                    <span className="flex-1 font-heading text-[11px] font-semibold tracking-wide text-lm-text">
                      RISK
                    </span>
                    <span className="w-[90px] font-heading text-[11px] font-semibold tracking-wide text-lm-text">
                      PROB
                    </span>
                    <span className="w-[90px] font-heading text-[11px] font-semibold tracking-wide text-lm-text">
                      IMPACT
                    </span>
                    <span className="flex-1 font-heading text-[11px] font-semibold tracking-wide text-lm-text">
                      MITIGATION
                    </span>
                  </div>
                  {/* Rows */}
                  {dealAnalysis.riskMatrix.map(
                    (
                      risk: {
                        risk: string;
                        probability: 'low' | 'medium' | 'high';
                        impact: 'low' | 'medium' | 'high';
                        mitigation: string;
                      },
                      i: number
                    ) => (
                      <div
                        key={i}
                        className={`flex items-center px-4 py-2.5 ${
                          i < dealAnalysis.riskMatrix.length - 1
                            ? 'border-b border-lm-border'
                            : ''
                        }`}
                      >
                        <span className="flex-1 text-[13px] text-lm-text-secondary">
                          {risk.risk}
                        </span>
                        <span className="w-[90px]">
                          <RiskDot level={risk.probability} />
                        </span>
                        <span className="w-[90px]">
                          <RiskDot level={risk.impact} />
                        </span>
                        <span className="flex-1 text-[13px] text-lm-text-tertiary">
                          {risk.mitigation}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* Section VII: Recommendation */}
            {dealAnalysis?.recommendation && (
              <section className="py-7 pb-8">
                <h2 className="font-heading text-[13px] font-bold tracking-wide text-lm-text mb-4">
                  VII. RECOMMENDATION
                </h2>

                <div className="flex items-center gap-3 mb-4">
                  <span className="font-heading text-base font-bold tracking-wide text-lm-text">
                    VERDICT:
                  </span>
                  {vc && (
                    <span
                      className={`inline-flex items-center px-3 py-1 ${vc.bg} text-white font-heading text-[11px] font-bold tracking-wide`}
                    >
                      {vc.label}
                    </span>
                  )}
                </div>

                {dealAnalysis.recommendation.reasoning && (
                  <p className="text-sm text-lm-text-secondary leading-[1.7] mb-4">
                    {dealAnalysis.recommendation.reasoning}
                  </p>
                )}

                {/* Conditions to Reconsider */}
                {dealAnalysis.recommendation.keyConditions &&
                  dealAnalysis.recommendation.keyConditions.length > 0 && (
                    <>
                      <p className="font-heading text-[11px] font-semibold tracking-wide text-lm-text-tertiary mb-2">
                        CONDITIONS TO RECONSIDER
                      </p>
                      <div className="space-y-1.5 mb-6 pl-1">
                        {dealAnalysis.recommendation.keyConditions.map(
                          (condition: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="font-heading text-sm font-bold text-lm-text">
                                {i + 1}.
                              </span>
                              <span className="text-sm text-lm-text-secondary">
                                {condition}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </>
                  )}

                {/* Due Diligence Items */}
                {dealAnalysis.recommendation.dueDiligenceItems &&
                  dealAnalysis.recommendation.dueDiligenceItems.length > 0 && (
                    <>
                      <p className="font-heading text-[11px] font-semibold tracking-wide text-lm-text-tertiary mb-2">
                        CRITICAL DD ITEMS
                      </p>
                      <div className="space-y-2 pl-1">
                        {dealAnalysis.recommendation.dueDiligenceItems.map(
                          (item: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-2.5"
                            >
                              <div className="w-4 h-4 border-[1.5px] border-lm-border rounded-sm shrink-0" />
                              <span className="text-sm text-lm-text-secondary">
                                {item}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </>
                  )}
              </section>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Property Card */}
        <PropertyCard property={property} />
      </div>
    </div>
  );
}

/**
 * Renders investment thesis text, extracting a "Key Insight" callout if found.
 * Looks for text between "Key Insight:" and the next paragraph break.
 */
function ThesisContent({ text }: { text: string }) {
  // Try to extract a "Key Insight" callout
  const insightMatch = text.match(
    /Key Insight[:\s]*([\s\S]+?)(?:\n\n|\.\s*(?=[A-Z]))/
  );

  if (insightMatch) {
    const beforeInsight = text.slice(0, insightMatch.index).trim();
    const insight = insightMatch[1].trim();
    const afterInsight = text
      .slice((insightMatch.index || 0) + insightMatch[0].length)
      .trim();

    return (
      <>
        {beforeInsight && (
          <p className="text-sm text-lm-text-secondary leading-[1.7] mb-3">
            {beforeInsight}
          </p>
        )}
        <div className="bg-[#F0EDE6] border-l-[3px] border-lm-border px-5 py-4 mb-3">
          <p className="text-[13px] text-lm-text-secondary leading-[1.7]">
            Key Insight: {insight}
          </p>
        </div>
        {afterInsight && (
          <p className="text-sm text-lm-text-secondary leading-[1.7]">
            {afterInsight}
          </p>
        )}
      </>
    );
  }

  // No callout found, render as plain text
  return (
    <p className="text-sm text-lm-text-secondary leading-[1.7]">
      {text}
    </p>
  );
}
