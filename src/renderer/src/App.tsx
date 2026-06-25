import { useEffect, useMemo } from 'react';
import { useAppStore } from './store';
import { useLoadSectorData } from './hooks/useSectorData';
import { buildViews } from './lib/view';
import { Topbar } from './components/Topbar';
import { SectorRail } from './components/SectorRail';
import { StatCards } from './components/StatCards';
import { PerformanceChart } from './components/PerformanceChart';
import { ReturnsMatrix } from './components/ReturnsMatrix';

function Panel(props: {
  title: string;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <section
      className={`flex flex-col rounded-lg border border-line bg-surface ${props.className ?? ''}`}
    >
      <h2 className="border-b border-line px-4 py-2 text-[0.7rem] tracking-[0.18em] text-muted uppercase">
        {props.title}
      </h2>
      <div className="min-h-0 flex-1 p-3">{props.children}</div>
    </section>
  );
}

export function App(): React.JSX.Element {
  useLoadSectorData();
  const data = useAppStore((s) => s.data);
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const notice = useAppStore((s) => s.notice);
  const range = useAppStore((s) => s.range);
  const selected = useAppStore((s) => s.selected);
  const theme = useAppStore((s) => s.theme);
  const cvd = useAppStore((s) => s.cvd);

  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-theme', theme);
    el.setAttribute('data-cvd', String(cvd));
  }, [theme, cvd]);

  const views = useMemo(
    () => (data ? buildViews(data, range, selected) : []),
    [data, range, selected],
  );

  return (
    <div className="flex h-full flex-col bg-ink text-text">
      <Topbar />
      {notice && (
        <div
          role="status"
          className="border-b border-line bg-surface px-5 py-2 text-sm text-muted"
        >
          {notice}
        </div>
      )}

      {status === 'loading' && (
        <div className="flex flex-1 items-center justify-center text-muted">
          Loading sector data…
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-loss">Couldn’t load sector data.</p>
          <p className="max-w-md text-sm text-muted">{error}</p>
        </div>
      )}

      {status === 'ready' && data && (
        <div className="flex min-h-0 flex-1">
          <aside className="w-64 shrink-0 overflow-y-auto border-r border-line py-2">
            <SectorRail data={data} range={range} />
          </aside>
          <main className="min-w-0 flex-1 overflow-y-auto p-4">
            {selected.size === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-muted">
                Select a sector from the left to chart its performance.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <StatCards data={data} range={range} />
                <Panel title="Performance — rebased to 100" className="h-80">
                  <PerformanceChart views={views} />
                </Panel>
                <Panel title="Returns matrix — monthly %">
                  <ReturnsMatrix views={views} />
                </Panel>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
