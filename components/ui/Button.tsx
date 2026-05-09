import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'teal' | 'coral' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-yolk text-nero hover:brightness-95 active:brightness-90',
  teal: 'bg-teal text-nero hover:brightness-95 active:brightness-90',
  coral: 'bg-coral text-white hover:brightness-95 active:brightness-90',
  ghost: 'bg-white text-nero hover:bg-nero/5 active:bg-nero/10',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-bold cursor-pointer transition-all duration-150 border border-nero/10 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(26,26,26,0.06), 0 2px 8px rgba(26,26,26,0.04)' }}
      {...props}
    >
      {children}
    </button>
  );
}
