'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: '🏠' },
    { href: '/subscription', label: 'Subscribe', icon: '💎' },
    { href: '/spin', label: 'Spin & Win', icon: '🎡' },
    { href: '/team', label: 'Team', icon: '👥' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 px-2 py-2 z-50 bg-slate-900/95 backdrop-blur-md">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[60px] ${
                isActive
                  ? 'text-brand-400 bg-white/5 scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-2xl mb-0.5 leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
