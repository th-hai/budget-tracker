import Link from 'next/link';
import { useRouter } from 'next/router';
import { L } from '@/lib/labels';
import LogoMark from '@/components/LogoMark';

const navItems = [
  { href: '/', label: L.nav.dashboard, icon: '⌁' },
  { href: '/transactions', label: L.nav.transactions, icon: '≡' },
  { href: '/settings', label: L.nav.settings, icon: '⚙' },
];

export default function TabBar() {
  const router = useRouter();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-nero/10 bg-cream/92 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-white/8 dark:bg-[#13110C]/92">
      <div className="mx-auto flex max-w-lg items-end justify-around px-4">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-w-[78px] flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                isActive ? 'text-teal' : 'text-nero/45 hover:text-nero/70 dark:text-cream/55 dark:hover:text-cream/80'
              }`}
            >
              {item.href === '/' ? (
                <LogoMark size={22} />
              ) : (
                <span className="text-xl leading-none">{item.icon}</span>
              )}
              <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
