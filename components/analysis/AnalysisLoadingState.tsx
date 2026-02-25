'use client';

import { Check, Loader, MapPin, Repeat } from 'lucide-react';
import { DbProperty } from '@/lib/supabase/database';
import Link from 'next/link';

interface AnalysisLoadingStateProps {
  property: DbProperty | null;
}

type StepStatus = 'complete' | 'active' | 'pending';

interface Step {
  label: string;
  status: StepStatus;
}

export function AnalysisLoadingState({ property }: AnalysisLoadingStateProps) {
  const address = property?.address;
  const raw = property?.raw_data;
  const photoUrl = raw?.photos?.[0]?.url;

  // Static loading steps (real-time would need backend websockets)
  const steps: Step[] = [
    { label: 'Scraping listing data...', status: 'complete' },
    {
      label: address
        ? `Researching market: ${address.city}, ${address.state} ${address.zipCode}...`
        : 'Researching market...',
      status: 'complete',
    },
    { label: 'Extracting assumptions...', status: 'active' },
    { label: 'Building proforma...', status: 'pending' },
    { label: 'Writing investment memo...', status: 'pending' },
  ];

  const formatCurrency = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '...';
    return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const formatPricePerUnit = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '...';
    return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}/unit`;
  };

  const formatPricePerSF = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '...';
    return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}/SF`;
  };

  const dataRows = [
    { label: 'Property Type', value: property?.property_type || '...' },
    { label: 'Units', value: property?.units?.toString() || '...' },
    {
      label: 'Building Size',
      value: property?.building_size
        ? `${property.building_size.toLocaleString()} SF`
        : '...',
    },
    { label: 'Lot Size', value: raw?.lotSize || '...' },
    {
      label: 'Price',
      value: formatCurrency(property?.price),
    },
    { label: 'Price/Unit', value: formatPricePerUnit(property?.price_per_unit) },
    { label: 'Price/SF', value: formatPricePerSF(property?.price_per_sf) },
    { label: 'Listed Cap Rate', value: property?.cap_rate || '...' },
    { label: 'Year Built', value: property?.year_built?.toString() || '...' },
  ];

  return (
    <div className="fixed inset-0 z-50 h-screen flex flex-col bg-white font-body">
      {/* Header */}
      <header className="bg-white border-b border-lm-border h-12 flex items-center px-6 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-lm-text rounded flex items-center justify-center">
            <Repeat className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading text-base font-bold tracking-wide text-lm-text">
            LoopMagic
          </span>
        </Link>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Progress Panel */}
        <div className="flex-1 flex flex-col justify-center px-14 py-16">
          <h1 className="font-heading text-2xl font-bold text-lm-text mb-2">
            {address?.fullAddress || 'Property Analysis'}
          </h1>
          <p className="text-sm text-lm-text-tertiary mb-8">Analyzing property...</p>

          <div className="space-y-0 max-w-lg">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 py-3.5 ${
                  i < steps.length - 1 ? 'border-b border-lm-border' : ''
                }`}
              >
                {step.status === 'complete' && (
                  <div className="w-6 h-6 bg-lm-green rounded flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                {step.status === 'active' && (
                  <div className="w-6 h-6 bg-lm-amber rounded flex items-center justify-center shrink-0 animate-pulse">
                    <Loader className="w-3.5 h-3.5 text-white animate-spin" />
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="w-6 h-6 border-[1.5px] border-lm-border rounded shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    step.status === 'complete'
                      ? 'text-lm-green'
                      : step.status === 'active'
                        ? 'font-semibold text-lm-amber'
                        : 'text-lm-text-tertiary'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Property Preview */}
        <div className="w-[661px] shrink-0 bg-lm-page border-l border-lm-border flex flex-col">
          {/* Preview Photo */}
          <div className="w-full h-[120px] bg-lm-card relative overflow-hidden">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Property"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-lm-text-tertiary" />
              </div>
            )}
          </div>

          {/* Preview Map with pulse animation */}
          <div className="w-full h-[140px] bg-[#E0DDD5] relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Pulse rings */}
                <div className="absolute w-24 h-24 rounded-full border border-lm-text-tertiary/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute w-16 h-16 rounded-full border border-lm-text-tertiary/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                <div className="absolute w-10 h-10 rounded-full border border-lm-text-tertiary/40 animate-pulse" />
                {/* Pin */}
                <MapPin className="w-5 h-5 text-lm-amber relative z-10" />
              </div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <p className="text-[10px] text-lm-text-tertiary font-medium">
                Locating...
              </p>
            </div>
          </div>

          {/* Preview Data */}
          <div className="p-6 space-y-0">
            {dataRows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center py-2 border-b border-lm-border last:border-b-0"
              >
                <span className="font-heading text-xs font-medium text-lm-text-tertiary">
                  {row.label}
                </span>
                <span className="font-heading text-xs font-semibold text-lm-text">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
