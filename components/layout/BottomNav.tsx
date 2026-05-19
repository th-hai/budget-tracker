import Link from 'next/link';
import { useRouter } from 'next/router';
import { L } from '@/lib/labels';

const navItems = [
  { href: '/', label: L.nav.dashboard, icon: '📊' },
  { href: '/transactions', label: L.nav.transactions, icon: '📋' },
  { href: '/settings', label: L.nav.settings, icon: '⚙️' },
];

export default function BottomNav() {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2.5 px-4 text-xs font-semibold transition-colors ${
                isActive ? 'text-teal font-bold' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
