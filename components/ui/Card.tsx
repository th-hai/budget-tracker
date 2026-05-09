import { HTMLAttributes } from 'react';

export default function Card({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-brutal p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
