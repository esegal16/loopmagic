'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface AnalyzeFormProps {
  onSuccess?: (analysisId: string) => void;
}

export function AnalyzeForm({ onSuccess }: AnalyzeFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const isValidLoopNetUrl = (url: string) => {
    return url.includes('loopnet.com/Listing/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidLoopNetUrl(url)) {
      setError('Please enter a valid LoopNet listing URL');
      return;
    }

    setLoading(true);
    setStatus('Scraping property data...');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loopnetUrl: url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Analysis failed');
      }

      if (onSuccess) {
        onSuccess(data.data.analysisId);
      } else {
        router.push(`/dashboard/analyses/${data.data.analysisId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <Card variant="bordered" padding="lg">
      <CardHeader>
        <CardTitle>Analyze a New Property</CardTitle>
        <CardDescription>
          Enter a LoopNet listing URL to generate a comprehensive investment analysis
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="LoopNet URL"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.loopnet.com/Listing/..."
            hint="Paste the full URL from a LoopNet multifamily listing"
            required
            disabled={loading}
          />

          {loading && status && (
            <div className="bg-lm-amber/10 border border-lm-amber/30 text-lm-amber px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {status}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading}>
            {loading ? 'Analyzing...' : 'Analyze Property'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
