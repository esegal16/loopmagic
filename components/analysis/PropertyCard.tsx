'use client';

import { DbProperty } from '@/lib/supabase/database';
import { MapPin, Pencil } from 'lucide-react';

interface PropertyCardProps {
  property: DbProperty | null;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const raw = property?.raw_data;
  const photoUrl = raw?.photos?.[0]?.url;
  const address = property?.address;

  const formatCurrency = (val: number | null | undefined): string => {
    if (val == null) return 'N/A';
    return val >= 1000000
      ? `$${(val / 1000000).toFixed(2)}M`
      : `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const dataRows = [
    { label: 'Property Type', value: property?.property_type || 'N/A' },
    { label: 'Units', value: property?.units?.toString() || 'N/A' },
    {
      label: 'Building Size',
      value: property?.building_size
        ? `${property.building_size.toLocaleString()} SF`
        : 'N/A',
    },
    { label: 'Year Built', value: property?.year_built?.toString() || 'N/A' },
    { label: 'Lot Size', value: raw?.lotSize || 'N/A' },
    { label: 'Price', value: formatCurrency(property?.price), bold: true },
    { label: 'Price / Unit', value: formatCurrency(property?.price_per_unit) },
    { label: 'Price / SF', value: formatCurrency(property?.price_per_sf) },
    { label: 'Listed Cap Rate', value: property?.cap_rate || 'N/A' },
  ];

  return (
    <div className="w-[725px] shrink-0 bg-lm-page border-l border-lm-border flex flex-col overflow-y-auto lm-scrollbar">
      {/* Property Top Row: Photo + Data side-by-side */}
      <div className="flex w-full">
        {/* Photo */}
        <div className="flex-1 bg-lm-card relative overflow-hidden min-h-[420px]">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Property"
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center absolute inset-0">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-lm-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-lm-text-tertiary">No photo available</p>
              </div>
            </div>
          )}
        </div>

        {/* Data Column */}
        <div className="w-[320px] shrink-0 px-5 py-4 flex flex-col">
          <div className="space-y-0 flex-1">
            {dataRows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center py-2 border-b border-lm-border last:border-b-0"
              >
                <span className="font-heading text-xs font-medium text-lm-text-tertiary">
                  {row.label}
                </span>
                <span
                  className={`font-heading text-xs ${
                    row.bold ? 'font-bold' : 'font-semibold'
                  } text-lm-text`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Edit Assumptions Button */}
          <button className="w-full mt-3 h-10 bg-lm-blue/15 hover:bg-lm-blue/25 flex items-center justify-center gap-2 rounded transition-colors">
            <Pencil className="w-3.5 h-3.5 text-lm-blue" />
            <span className="font-heading text-xs font-semibold tracking-wide text-lm-blue">
              EDIT ASSUMPTIONS
            </span>
          </button>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="w-full bg-[#E0DDD5] relative flex-1 min-h-[402px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-6 h-6 text-lm-text-tertiary mx-auto mb-1" />
            <p className="text-xs text-lm-text-tertiary">
              {address ? `${address.city}, ${address.state} ${address.zipCode}` : 'Location'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
