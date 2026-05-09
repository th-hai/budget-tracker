import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface PageShellProps {
  children: ReactNode;
  title?: string;
}

export default function PageShell({ children, title }: PageShellProps) {
  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        {title && (
          <h1 className="text-xl font-bold mb-6">{title}</h1>
        )}
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
