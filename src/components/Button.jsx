import { forwardRef } from 'react';

const variantStyles = {
  primary:
    'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm',
  secondary:
    'bg-[var(--color-secondary)] hover:bg-gray-200 text-[var(--color-text-primary)]',
  outline:
    'border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white',
  ghost: 'hover:bg-black/5 text-[var(--color-text-primary)]',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
};

const sizeStyles = {
  sm: 'h-9 px-4 text-sm rounded-lg',
  md: 'h-11 px-6 text-base rounded-xl',
  lg: 'h-14 px-8 text-lg rounded-full',
  icon: 'h-10 w-10 rounded-full p-0 flex items-center justify-center',
  iconLg: 'h-12 w-12 rounded-full p-0 flex items-center justify-center',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className = '',
      type = 'button',
      disabled = false,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
    const classes = [
      base,
      variantStyles[variant] || variantStyles.primary,
      sizeStyles[size] || sizeStyles.md,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled}
        {...props}
      >
        {leftIcon && <span className="material-symbols-outlined shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="material-symbols-outlined shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
