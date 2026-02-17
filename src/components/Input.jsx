import { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      id,
      label,
      error,
      hint,
      leftIcon,
      rightSlot,
      className = '',
      containerClassName = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const baseInput =
      'form-input w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-3 text-[var(--color-text-primary)] placeholder:text-gray-400 shadow-sm transition-shadow focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:outline-none';

    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-stretch">
          {leftIcon && (
            <span
              className="pointer-events-none absolute left-4 flex items-center justify-center text-gray-400"
              aria-hidden
            >
              <span className="material-symbols-outlined">{leftIcon}</span>
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={hint ? `${inputId}-hint` : undefined}
            className={`${baseInput} ${leftIcon ? 'pl-12' : ''} ${rightSlot ? 'pr-14' : ''} ${className}`}
            {...props}
          />
          {rightSlot && (
            <div className="absolute inset-y-0 right-0 flex items-center">{rightSlot}</div>
          )}
        </div>
        {hint && (
          <p id={`${inputId}-hint`} className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {hint}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
