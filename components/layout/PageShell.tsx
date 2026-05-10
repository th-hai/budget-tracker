import { ReactNode } from 'react';
import TabBar from '@/components/ui/TabBar';

interface PageShellProps {
  children: ReactNode;
  title?: string;
}

export default function PageShell({ children, title }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[color:var(--app-bg)] pb-24 text-[color:var(--text-primary)] transition-colors duration-200">
      <div className="mx-auto max-w-lg px-4 pt-8">
        {title && (
          <h1 className="text-xl font-bold mb-6">{title}</h1>
        )}
        {children}
      </div>
      <TabBar />
    </div>
  );
}
