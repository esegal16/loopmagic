'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  History,
  Plus,
  User,
  SquareActivity,
} from 'lucide-react';

export function AnalysisHeader() {
  return (
    <header className="bg-white border-b border-lm-border h-12 flex items-center justify-between px-6 shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-lm-text rounded flex items-center justify-center">
          <SquareActivity className="w-4 h-4 text-white" />
        </div>
        <span className="font-heading text-base font-bold tracking-wide text-lm-text">
          LoopMagic
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-lm-page rounded transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-lm-text-secondary" />
          <span className="font-heading text-[13px] font-medium text-lm-text-secondary">
            DASHBOARD
          </span>
        </Link>
        <Link
          href="/dashboard/analyses"
          className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-lm-page rounded transition-colors"
        >
          <History className="w-3.5 h-3.5 text-lm-text-secondary" />
          <span className="font-heading text-[13px] font-medium text-lm-text-secondary">
            HISTORY
          </span>
        </Link>
        <Link
          href="/dashboard/analyze"
          className="flex items-center gap-1.5 bg-lm-text hover:bg-lm-dark px-3 py-1.5 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-lm-page" />
          <span className="font-heading text-[11px] font-semibold tracking-wide text-lm-page">
            NEW ANALYSIS
          </span>
        </Link>
        <button className="w-7 h-7 bg-lm-card hover:bg-lm-border rounded-full flex items-center justify-center transition-colors">
          <User className="w-3.5 h-3.5 text-lm-text-secondary" />
        </button>
      </div>
    </header>
  );
}
