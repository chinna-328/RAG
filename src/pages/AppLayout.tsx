import { NavLink, Outlet, useLocation, useMatch } from 'react-router-dom';
import { BookMarked, MessageSquare, Settings as SettingsIcon, Upload as UploadIcon } from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';

type NavItem = {
  to: string;
  label: string;
  icon: typeof BookMarked;
  exact?: boolean;
};

const items: NavItem[] = [
  { to: '/app', label: 'Library', icon: BookMarked, exact: true },
  { to: '/app/upload', label: 'Upload', icon: UploadIcon },
  { to: '/app/settings', label: 'Settings', icon: SettingsIcon },
];

export function AppLayout() {
  const location = useLocation();
  const chatMatch = useMatch('/app/notebooks/:id');

  return (
    <div className="grid grid-cols-[64px_1fr] h-full bg-bg-0">
      <aside className="bg-bg-0 border-r border-line-1 py-4 flex flex-col items-center gap-1">
        <NavLink to="/" className="mb-3" aria-label="Home">
          <div
            className="grid place-items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-lo))',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#001218" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" fill="#001218" />
              <path d="M12 3v3M12 18v3M5 12H2M22 12h-3M6 6l1.5 1.5M16.5 16.5 18 18M6 18l1.5-1.5M16.5 7.5 18 6" />
            </svg>
          </div>
        </NavLink>
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.exact
            ? location.pathname === it.to || Boolean(chatMatch)
            : location.pathname.startsWith(it.to);
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.exact}
              title={it.label}
              className={cn(
                'w-10 h-10 rounded-md grid place-items-center transition-colors',
                active
                  ? 'bg-bg-2 text-accent shadow-[inset_0_0_0_1px_var(--line-2)]'
                  : 'text-fg-2 hover:text-fg-0 hover:bg-bg-2'
              )}
            >
              {/* If we're on a chat page and this is the Library item, show Chat icon for clarity */}
              {chatMatch && it.exact ? <MessageSquare size={18} /> : <Icon size={18} />}
            </NavLink>
          );
        })}
        <div className="flex-1" />
        <Avatar name="You" size={32} />
      </aside>
      <main className="overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
