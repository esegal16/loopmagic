interface RiskDotProps {
  level: 'low' | 'medium' | 'high';
}

const config = {
  low: {
    label: 'LOW',
    bg: 'bg-lm-green/15',
    text: 'text-lm-green',
  },
  medium: {
    label: 'MED',
    bg: 'bg-lm-amber/15',
    text: 'text-lm-amber',
  },
  high: {
    label: 'HIGH',
    bg: 'bg-lm-red/15',
    text: 'text-lm-red',
  },
};

export function RiskDot({ level }: RiskDotProps) {
  const c = config[level];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 ${c.bg} ${c.text} font-heading text-[10px] font-semibold tracking-wide rounded-sm`}
    >
      {c.label}
    </span>
  );
}
