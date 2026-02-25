'use client';

import { FileSpreadsheet, Download } from 'lucide-react';

interface DownloadBarProps {
  onDownload: () => void;
  downloading?: boolean;
}

export function DownloadBar({ onDownload, downloading }: DownloadBarProps) {
  return (
    <button
      onClick={onDownload}
      disabled={downloading}
      className="flex items-center gap-2.5 bg-lm-card hover:bg-lm-border px-6 py-3 border-b border-lm-border cursor-pointer transition-colors w-full text-left disabled:opacity-60"
    >
      <div className="w-7 h-7 bg-[#1D6F42] rounded-md flex items-center justify-center shrink-0">
        <FileSpreadsheet className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm font-semibold text-lm-text">
        {downloading ? 'Downloading...' : 'Download Excel Proforma'}
      </span>
      <Download className="w-4 h-4 text-lm-text-secondary" />
    </button>
  );
}
