import { useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import { loadArchiveIndex, loadArticles, loadSourceStatus } from './lib/data';
import type { ArchiveIndexEntry, Article, SourceStatus } from './lib/types';
import { Dashboard } from './pages/Dashboard';
import { Archive } from './pages/Archive';
import { SourcesPage } from './pages/Sources';
import { Tools } from './pages/Tools';
import { About } from './pages/About';

const basePath = import.meta.env.BASE_URL || '/';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [statuses, setStatuses] = useState<SourceStatus[]>([]);
  const [archive, setArchive] = useState<ArchiveIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState(getCurrentPath());

  useEffect(() => {
    Promise.all([loadArticles(), loadSourceStatus(), loadArchiveIndex()])
      .then(([loadedArticles, loadedStatuses, loadedArchive]) => {
        setArticles(loadedArticles);
        setStatuses(loadedStatuses);
        setArchive(loadedArchive);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(getCurrentPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const page = useMemo(() => {
    if (loading) {
      return <div className="rounded-lg border border-line bg-white p-8 text-center shadow-card">Loading local data...</div>;
    }

    switch (path) {
      case '/archive':
        return <Archive archive={archive} onNavigate={navigate} />;
      case '/sources':
        return <SourcesPage statuses={statuses} />;
      case '/tools':
        return <Tools />;
      case '/about':
        return <About />;
      default:
        return <Dashboard articles={articles} statuses={statuses} />;
    }
  }, [archive, articles, loading, path, statuses]);

  return (
    <Layout currentPath={path} onNavigate={navigate}>
      {page}
    </Layout>
  );

  function navigate(nextPath: string) {
    window.history.pushState({}, '', toBrowserPath(nextPath));
    setPath(nextPath);
  }
}

function getCurrentPath(): string {
  const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const pathname = window.location.pathname;
  const withoutBase = cleanBase && pathname.startsWith(cleanBase) ? pathname.slice(cleanBase.length) || '/' : pathname;
  return normalizePath(withoutBase);
}

function toBrowserPath(path: string): string {
  const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${cleanBase}${path === '/' ? '/' : path}`;
}

function normalizePath(path: string): string {
  const cleaned = path.split('?')[0].replace(/\/$/, '') || '/';
  return ['/', '/archive', '/sources', '/tools', '/about'].includes(cleaned) ? cleaned : '/';
}
