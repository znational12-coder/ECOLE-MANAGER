// Prefetch heavy tabs after the first screen is idle. Vite turns these into
// separate chunks; the user gets instant navigation once a chunk is cached.
const loaders = [
  () => import('../components/ElevesView'),
  () => import('../components/NotesView'),
  () => import('../components/BulletinsView'),
  () => import('../components/PaiementsView'),
  () => import('../components/EmploiDuTempsView'),
  () => import('../components/AttestationsView'),
];

export function prefetchMainModules() {
  if (typeof window === 'undefined') return;
  const run = () => loaders.forEach(load => { void load(); });
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(run, { timeout: 2500 });
  } else {
    window.setTimeout(run, 800);
  }
}
