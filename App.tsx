import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { AppState, UserSession } from './types';
import { StorageService } from './services/storage';
import { Navbar, NavRoute } from './components/Navbar';
import { UserSwitcherModal } from './components/UserSwitcherModal';
// Heavy modules are loaded on demand. This keeps tab changes responsive and avoids
// parsing/initializing every 20-70 KB view when the application starts.
const DashboardView = lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const ElevesView = lazy(() => import('./components/ElevesView').then(m => ({ default: m.ElevesView })));
const NotesView = lazy(() => import('./components/NotesView').then(m => ({ default: m.NotesView })));
const BulletinsView = lazy(() => import('./components/BulletinsView').then(m => ({ default: m.BulletinsView })));
const EmploiDuTempsView = lazy(() => import('./components/EmploiDuTempsView').then(m => ({ default: m.EmploiDuTempsView })));
const PersonnelView = lazy(() => import('./components/PersonnelView').then(m => ({ default: m.PersonnelView })));
const AbsencesSanctionsView = lazy(() => import('./components/AbsencesSanctionsView').then(m => ({ default: m.AbsencesSanctionsView })));
const PaiementsView = lazy(() => import('./components/PaiementsView').then(m => ({ default: m.PaiementsView })));
const PassageAnnuelView = lazy(() => import('./components/PassageAnnuelView').then(m => ({ default: m.PassageAnnuelView })));
const ArchivesView = lazy(() => import('./components/ArchivesView').then(m => ({ default: m.ArchivesView })));
const ParametresView = lazy(() => import('./components/ParametresView').then(m => ({ default: m.ParametresView })));
const ConvocationsView = lazy(() => import('./components/ConvocationsView').then(m => ({ default: m.ConvocationsView })));
const SujetsView = lazy(() => import('./components/SujetsView').then(m => ({ default: m.SujetsView })));
const AffichesView = lazy(() => import('./components/AffichesView').then(m => ({ default: m.AffichesView })));
const AttestationsView = lazy(() => import('./components/AttestationsView').then(m => ({ default: m.AttestationsView })));
const ImportStudentsModal = lazy(() => import('./components/ImportStudentsModal').then(m => ({ default: m.ImportStudentsModal })));
import { Logic } from './services/logic';
import { Menu, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { prefetchMainModules } from './services/modulePrefetch';

export default function App() {
  const [state, setState] = useState<AppState>(() => StorageService.load());
  const [session, setSession] = useState<UserSession>(() => ({ type: null, id: null }));
  const [authLoading, setAuthLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState<NavRoute>('dashboard');
  const [routeParams, setRouteParams] = useState<any>({});
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const restored = await StorageService.restoreSession();
        if (active) setSession(restored);
      } catch (error) {
        console.warn('Session non restaurée:', error);
      } finally {
        if (active) setAuthLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Subscribe to Storage updates
  useEffect(() => {
    const unsub = StorageService.subscribe((updated) => {
      setState(updated);
    });
    return unsub;
  }, []);

  // Warm the most-used lazy chunks when the browser is idle, rather than
  // competing with the first render.
  useEffect(() => {
    if (!authLoading && session.type) prefetchMainModules();
  }, [authLoading, session.type]);

  // Check route permission when session changes
  useEffect(() => {
    if (!Logic.canAccessRoute(state, session, currentRoute)) {
      const defaultRoute = Logic.getDefaultRouteForRole(session) as NavRoute;
      setCurrentRoute(defaultRoute);
    }
  }, [session, currentRoute, state]);

  // Handle route change with optional params and authorization check
  const handleNavigate = useCallback((route: NavRoute, params: any = {}) => {
    if (!Logic.canAccessRoute(state, session, route)) {
      alert(`Accès refusé : votre profil (${session.type}) n'a pas les droits pour accéder au module "${route}".`);
      return;
    }
    setCurrentRoute(route);
    setRouteParams(params);
    setIsMobileMenuOpen(false);
    // Avoid a smooth-scroll animation competing with the expensive module swap.
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [state, session]);

  const handleSelectSession = (newSession: UserSession) => {
    setSession(newSession);
    StorageService.setSession(newSession);
    const defaultRoute = Logic.getDefaultRouteForRole(newSession) as NavRoute;
    setCurrentRoute(defaultRoute);
  };

  const handleUpdateState = (updater: ((prev: AppState) => AppState) | AppState) => {
    setState((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      StorageService.save(updated);
      return updated;
    });
  };

  const activeIdentity = Logic.identiteActive(state, session);
  const isRouteAllowed = Logic.canAccessRoute(state, session, currentRoute);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600 text-sm">Vérification de la session sécurisée…</div>;
  }

  if (!session.type) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black">LP</div>
          <h1 className="text-xl font-serif font-bold text-slate-900">La Persévérance</h1>
          <p className="text-sm text-slate-500">Votre session a expiré ou vous n'êtes pas connecté.</p>
          <button onClick={() => setIsUserSwitcherOpen(true)} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800">Se connecter</button>
        </div>
        <UserSwitcherModal isOpen={isUserSwitcherOpen} onClose={() => setIsUserSwitcherOpen(false)} state={state} currentSession={session} onSelectSession={handleSelectSession} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* Mobile top bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-serif font-black text-sm flex items-center justify-center">
            LP
          </div>
          <div>
            <div className="font-serif font-bold text-sm leading-tight">La Persévérance</div>
            <div className="text-[10px] text-amber-400 font-mono">{state.parametres.anneeScolaire}</div>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Responsive Navbar / Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition duration-200 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:block no-print`}>
        <Navbar
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          state={state}
          session={session}
          onOpenUserSwitcher={() => {
            setIsUserSwitcherOpen(true);
            setIsMobileMenuOpen(false);
          }}
        />
      </div>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 md:hidden backdrop-blur-xs no-print"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {!isRouteAllowed ? (
          <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-slate-900">Accès Restreint</h3>
            <p className="text-xs text-slate-600">
              Votre session active <strong>({activeIdentity.label})</strong> n'est pas autorisée à consulter ce module.
            </p>
            <button
              onClick={() => handleNavigate(Logic.getDefaultRouteForRole(session) as NavRoute)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <span>Accéder à mon espace dédié</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Suspense fallback={
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
                <span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
                Chargement du module…
              </div>
            </div>
          }>
            <>
            {currentRoute === 'dashboard' && (
              <DashboardView state={state} onNavigate={handleNavigate} />
            )}

            {currentRoute === 'eleves' && (
              <ElevesView
                state={state}
                onNavigate={handleNavigate}
                onOpenImportModal={() => setIsImportModalOpen(true)}
                onUpdateState={handleUpdateState}
              />
            )}

            {currentRoute === 'notes' && (
              <NotesView
                state={state}
                session={session}
                onNavigate={handleNavigate}
                onUpdateState={handleUpdateState}
              />
            )}

            {currentRoute === 'bulletins' && (
              <BulletinsView
                state={state}
                initialMatricule={routeParams.matricule}
                initialSem={routeParams.sem}
                initialClasse={routeParams.classe}
              />
            )}

            {currentRoute === 'attestations' && (
              <AttestationsView
                state={state}
                initialMatricule={routeParams.matricule}
                onUpdateState={handleUpdateState}
                onNavigate={handleNavigate}
              />
            )}

            {currentRoute === 'sujets' && (
              <SujetsView state={state} session={session} onUpdateState={handleUpdateState} />
            )}

            {currentRoute === 'affiches' && (
              <AffichesView state={state} onUpdateState={handleUpdateState} />
            )}

            {currentRoute === 'convocations' && (
              <ConvocationsView state={state} onUpdateState={handleUpdateState} />
            )}

            {currentRoute === 'edt' && (
              <EmploiDuTempsView state={state} onUpdateState={handleUpdateState} />
            )}

            {currentRoute === 'personnel' && (
              <PersonnelView state={state} onUpdateState={handleUpdateState} />
            )}

            {currentRoute === 'absences' && (
              <AbsencesSanctionsView state={state} onUpdateState={handleUpdateState} />
            )}

            {currentRoute === 'paiements' && (
              <PaiementsView
                state={state}
                onUpdateState={handleUpdateState}
                initialMatricule={routeParams.matricule}
              />
            )}

            {currentRoute === 'passage' && (
              <PassageAnnuelView state={state} onNavigate={handleNavigate} onUpdateState={handleUpdateState} />
            )}

            {currentRoute === 'archives' && (
              <ArchivesView state={state} onUpdateState={handleUpdateState} />
            )}

            {currentRoute === 'parametres' && (
              <ParametresView state={state} onUpdateState={handleUpdateState} />
            )}
            </>
          </Suspense>
        )}
      </main>

      {/* User Switcher Modal */}
      <UserSwitcherModal
        isOpen={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
        state={state}
        currentSession={session}
        onSelectSession={handleSelectSession}
      />

      {/* Import Students Modal */}
      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        state={state}
      />
    </div>
  );
}
