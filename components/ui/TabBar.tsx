import Link from 'next/link';
import { useRouter } from 'next/router';
import { L } from '@/lib/labels';
import LogoMark from '@/components/LogoMark';

const navItems = [
  { href: '/', label: L.nav.dashboard, icon: 'home' },
  { href: '/spending', label: L.nav.spending, icon: 'chart' },
  { href: '/transactions', label: L.nav.transactions, icon: 'list' },
  { href: '/settings', label: L.nav.settings, icon: 'gear' },
];

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? 'currentColor' : 'currentColor';
  switch (icon) {
    case 'home':
      return <LogoMark size={22} />;
    case 'chart':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      );
    case 'list':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
      );
    case 'gear':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
}

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
              className={`relative flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-teal' : 'text-nero/45 hover:text-nero/70 dark:text-cream/55 dark:hover:text-cream/80'
              }`}
            >
              <NavIcon icon={item.icon} active={isActive} />
              <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
