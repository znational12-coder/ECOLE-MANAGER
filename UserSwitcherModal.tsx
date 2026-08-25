import React, { useState } from 'react';
import { AppState, UserSession } from '../types';
import { StorageService } from '../services/storage';
import { Shield, GraduationCap, DollarSign, X, AlertCircle, LockKeyhole } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; state: AppState; currentSession: UserSession; onSelectSession: (session: UserSession) => void; }

export const UserSwitcherModal: React.FC<Props> = ({ isOpen, onClose, state, onSelectSession }) => {
  const [selected, setSelected] = useState<{type:'admin'|'prof'|'gestionnaire';id:string|null;name:string}|null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;
  const users = [
    { type: 'admin' as const, id: null, name: 'Administration Centrale', icon: Shield },
    ...(state.professeurs || []).map(p => ({ type: 'prof' as const, id: p.id, name: p.nom, icon: GraduationCap })),
    ...(state.gestionnaires || []).map(g => ({ type: 'gestionnaire' as const, id: g.id, name: g.nom, icon: DollarSign })),
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !password) return;
    setBusy(true); setError('');
    try {
      const session = await StorageService.authenticate(selected.type, selected.id, password);
      onSelectSession(session); onClose(); setPassword(''); setSelected(null);
    } catch (err: any) { setError(err.message || 'Connexion refusée.'); }
    finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
        <div><h3 className="font-semibold">Connexion sécurisée</h3><p className="text-xs text-slate-400">Authentification côté serveur</p></div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-6 space-y-4">
        {!selected ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {users.map(u => { const Icon=u.icon; return <button key={`${u.type}-${u.id||'admin'}`} onClick={() => {setSelected(u);setPassword('');setError('')}} className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-left transition flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center"><Icon className="w-5 h-5" /></div><div><div className="font-bold text-sm text-slate-900">{u.name}</div><div className="text-xs text-slate-500">{u.type==='admin'?'Administrateur':u.type==='prof'?'Enseignant':'Gestionnaire'}</div></div>
          </button>})}
        </div> : <form onSubmit={submit} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200"><div className="text-xs text-slate-500">Compte sélectionné</div><div className="font-bold text-slate-900">{selected.name}</div></div>
          <div><label className="text-xs font-semibold text-slate-700">Mot de passe / PIN</label><input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-300 outline-none focus:border-amber-500" autoComplete="current-password" /></div>
          {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex gap-2"><LockKeyhole className="w-4 h-4 shrink-0" />Les identifiants sont vérifiés uniquement par le serveur. Ils ne sont pas stockés dans le navigateur.</div>
          <div className="flex gap-2"><button type="button" onClick={()=>setSelected(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm">Retour</button><button disabled={busy} type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm disabled:opacity-50">{busy?'Connexion…':'Se connecter'}</button></div>
        </form>}
      </div>
    </div>
  </div>;
};
