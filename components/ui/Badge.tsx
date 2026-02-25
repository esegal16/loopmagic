import { forwardRef } from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-lm-card text-lm-text',
      success: 'bg-lm-green/15 text-lm-green',
      warning: 'bg-lm-amber/15 text-lm-amber',
      danger: 'bg-lm-red/15 text-lm-red',
      info: 'bg-lm-blue/15 text-lm-blue',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-sm',
    };

    const classes = [
      'inline-flex items-center font-medium rounded-full',
      variants[variant],
      sizes[size],
      className,
    ].join(' ');

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };

// Specialized badge for recommendations — warm palette solid fill
export interface RecommendationBadgeProps {
  verdict: 'pursue' | 'watch' | 'pass';
  size?: 'sm' | 'md' | 'lg';
}

export function RecommendationBadge({ verdict, size = 'md' }: RecommendationBadgeProps) {
  const config = {
    pursue: { label: 'PURSUE', bg: 'bg-lm-green', text: 'text-white' },
    watch: { label: 'WATCH', bg: 'bg-lm-amber', text: 'text-white' },
    pass: { label: 'PASS', bg: 'bg-lm-red', text: 'text-white' },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-[11px]',
    lg: 'px-3.5 py-1.5 text-xs',
  };

  const entry = config[verdict as keyof typeof config];
  if (!entry) return null;
  const { label, bg, text } = entry;

  return (
    <span
      className={`inline-flex items-center font-heading font-bold tracking-wide ${bg} ${text} ${sizes[size]}`}
    >
      {label}
    </span>
  );
}
