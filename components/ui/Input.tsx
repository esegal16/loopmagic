'use client';

import { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const inputClasses = [
      'block w-full rounded-lg border px-3 py-2 text-lm-text shadow-sm',
      'placeholder:text-lm-text-tertiary',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:bg-lm-page disabled:text-lm-text-secondary disabled:cursor-not-allowed',
      error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-lm-border focus:border-lm-green focus:ring-lm-green',
      className,
    ].join(' ');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-lm-text-secondary mb-1"
          >
            {label}
          </label>
        )}
        <input ref={ref} id={inputId} className={inputClasses} {...props} />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {hint && !error && (
          <p className="mt-1 text-sm text-lm-text-secondary">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
