import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-bold uppercase tracking-wide">{label}</label>
      )}
      <input className={`input-brutal ${className}`} {...props} />
    </div>
  );
}
