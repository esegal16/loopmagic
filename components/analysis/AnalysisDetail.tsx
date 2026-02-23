'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge, RecommendationBadge } from '../ui/Badge';
import { MetricsTable } from './MetricsTable';
import { RiskAssessment } from './RiskAssessment';
import { DbAnalysis, DbProperty } from '@/lib/supabase/database';

interface AnalysisDetailProps {
  analysis: DbAnalysis;
  property: DbProperty | null;
}

export function AnalysisDetail({ analysis, property }: AnalysisDetailProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'metrics' | 'risks'>('summary');
  const [downloading, setDownloading] = useState(false);

  const metrics = analysis.excel_metrics;
  const dealAnalysis = analysis.deal_analysis;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/analyses/${analysis.id}/download`);
      if (!response.ok) throw new Error('Download failed');

      // Extract filename from Content-Disposition header (set by server from storage path)
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

  const tabs = [
    { id: 'summary' as const, label: 'Summary' },
    { id: 'metrics' as const, label: 'Metrics' },
    { id: 'risks' as const, label: 'Market & Risk' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {property?.address?.fullAddress || property?.property_name || 'Property Analysis'}
          </h1>
          <p className="text-gray-600 mt-1">
            {property?.property_type || 'Property'} - {property?.units ?? '?'} units
            {property?.building_size ? ` - ${property.building_size.toLocaleString()} SF` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dealAnalysis?.recommendation && (
            <RecommendationBadge verdict={dealAnalysis.recommendation.verdict} size="lg" />
          )}
          <Button onClick={handleDownload} loading={downloading} variant="outline">
            Download Excel
          </Button>
        </div>
      </div>

      {/* Recommendation Card */}
      {dealAnalysis?.recommendation && (
        <Card variant="bordered" padding="md">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 mb-2">Recommendation</h2>
              <p className="text-gray-600">{dealAnalysis.recommendation.reasoning}</p>
            </div>
          </div>
          {dealAnalysis.recommendation.keyConditions && dealAnalysis.recommendation.keyConditions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Key Conditions</h3>
              <ul className="space-y-1">
                {dealAnalysis.recommendation.keyConditions.map((condition: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-gray-400">-</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {dealAnalysis.recommendation.dueDiligenceItems && dealAnalysis.recommendation.dueDiligenceItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Due Diligence Items</h3>
              <ul className="space-y-1">
                {dealAnalysis.recommendation.dueDiligenceItems.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-gray-400">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'summary' && dealAnalysis && (
          <div className="space-y-6">
            <Card variant="bordered" padding="md">
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent className="mt-4">
                <p className="text-gray-600 whitespace-pre-wrap">
                  {dealAnalysis.executiveSummary}
                </p>
              </CardContent>
            </Card>

            {dealAnalysis.investmentThesis && (
              <Card variant="bordered" padding="md">
                <CardHeader>
                  <CardTitle>Investment Thesis</CardTitle>
                </CardHeader>
                <CardContent className="mt-4">
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {dealAnalysis.investmentThesis}
                  </p>
                </CardContent>
              </Card>
            )}

            {dealAnalysis.financialAnalysis && (
              <Card variant="bordered" padding="md">
                <CardHeader>
                  <CardTitle>Financial Analysis</CardTitle>
                </CardHeader>
                <CardContent className="mt-4">
                  {dealAnalysis.financialAnalysis.narrative && (
                    <p className="text-gray-600 whitespace-pre-wrap mb-6">
                      {dealAnalysis.financialAnalysis.narrative}
                    </p>
                  )}
                  {dealAnalysis.financialAnalysis.metrics && dealAnalysis.financialAnalysis.metrics.length > 0 && (
                    <div className="space-y-4">
                      {dealAnalysis.financialAnalysis.metrics.map((metric: { metric: string; value: string; assessment: string; commentary: string }, i: number) => (
                        <div key={i} className="flex items-start gap-4">
                          <Badge
                            variant={
                              metric.assessment === 'strong'
                                ? 'success'
                                : metric.assessment === 'weak'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {metric.assessment.toUpperCase()}
                          </Badge>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900">{metric.metric}</span>
                              <span className="text-gray-600">{metric.value}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{metric.commentary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'metrics' && metrics && <MetricsTable metrics={metrics} />}

        {activeTab === 'risks' && dealAnalysis && <RiskAssessment analysis={dealAnalysis} />}
      </div>
    </div>
  );
}
