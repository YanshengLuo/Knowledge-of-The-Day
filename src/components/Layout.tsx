import type { ReactNode } from 'react';

const basePath = import.meta.env.BASE_URL || '/';

type LayoutProps = {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
};

const links = [
  { label: 'Dashboard', path: '/' },
  { label: 'Archive', path: '/archive' },
  { label: 'Sources', path: '/sources' },
  { label: 'Tools', path: '/tools' },
  { label: 'About', path: '/about' }
];

export function Layout({ children, currentPath, onNavigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-panel text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <a
              href={toHref('/')}
              onClick={(event) => {
                event.preventDefault();
                onNavigate('/');
              }}
              className="text-2xl font-bold text-ink"
            >
              BioTrend Daily
            </a>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-700">
              A metadata-only industry intelligence dashboard for biotech, computational biology, AI, and translational medicine.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            {links.map((link) => (
              <a
                key={link.path}
                href={toHref(link.path)}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(link.path);
                }}
                className={`rounded-md px-3 py-2 ${
                  currentPath === link.path ? 'bg-signal text-white' : 'border border-line bg-white text-ink hover:border-signal'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

function toHref(path: string): string {
  const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${cleanBase}${path === '/' ? '/' : path}`;
}
