import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { authenticate, createSession, sessionFromToken, destroySession, getState, updateState, listUsers, listStudents, changePassword, audit, getAuditLogs, createBackup } from './server/db';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '10mb' }));
app.use((req: Request, res: Response, next: NextFunction) => {
  (res as any).cookie = (name: string, value: string, options: any = {}) => {
    const parts = [`${name}=${encodeURIComponent(value)}`];
    if (options.maxAge) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.secure) parts.push('Secure');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite[0].toUpperCase()}${options.sameSite.slice(1)}`);
    if (options.path) parts.push(`Path=${options.path}`);
    res.append('Set-Cookie', parts.join('; '));
  };
  (res as any).clearCookie = (name: string, options: any = {}) => { (res as any).cookie(name, '', { ...options, maxAge: 0 }); };
  next();
});

// In-memory IP request rate limiter to prevent flooding & abuse
const requestTracker = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40; // 40 requests / minute

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const tracker = requestTracker.get(ip);

  if (!tracker || now > tracker.resetTime) {
    requestTracker.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (tracker.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Trop de requêtes. Veuillez patienter une minute avant de réessayer.',
    });
  }

  tracker.count += 1;
  next();
}

// Server-side session authorization. The client never chooses its role via a header.
function getCookie(req: Request, name: string) {
  const raw = req.headers.cookie || '';
  const part = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : undefined;
}
function sameOrigin(req: Request, res: Response, next: NextFunction) {
  if (!['POST','PUT','PATCH','DELETE'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !origin.startsWith(`http://${req.headers.host}`) && !origin.startsWith(`https://${req.headers.host}`)) {
    return res.status(403).json({ error: 'Origine de requête refusée.' });
  }
  next();
}
app.use(sameOrigin);

function requireAuth(allowedRoles: Array<'admin' | 'prof' | 'gestionnaire'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = sessionFromToken(getCookie(req, 'lp_session'));
    if (!session || !allowedRoles.includes(session.type as any)) {
      return res.status(401).json({ error: 'Session invalide ou accès non autorisé.' });
    }
    (req as any).userSession = session;
    next();
  };
}

app.post('/api/auth/login', rateLimiter, async (req: Request, res: Response) => {
  const { type, id, password } = req.body || {};
  if (!['admin','prof','gestionnaire'].includes(type) || typeof password !== 'string' || password.length < 1) {
    return res.status(400).json({ error: 'Identifiants invalides.' });
  }
  const session = authenticate(type, type === 'admin' ? null : id, password);
  if (!session) return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
  const { token, expires } = createSession(session);
  (res as any).cookie('lp_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 8 * 60 * 60 * 1000 });
  res.json({ session, expires });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const session = sessionFromToken(getCookie(req, 'lp_session'));
  if (session) audit(session, 'auth.logout');
  destroySession(getCookie(req, 'lp_session'));
  (res as any).clearCookie('lp_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const session = sessionFromToken(getCookie(req, 'lp_session'));
  res.json({ session });
});

app.get('/api/users', requireAuth(['admin','prof','gestionnaire']), (req: Request, res: Response) => {
  res.json({ users: listUsers() });
});

app.get('/api/state', requireAuth(['admin','prof','gestionnaire']), (req: Request, res: Response) => {
  res.json({ state: getState() });
});

// Scalable student listing: SQLite handles filtering/pagination without sending the full registry.
app.get('/api/students', requireAuth(['admin','prof','gestionnaire']), (req: Request, res: Response) => {
  const result = listStudents({
    q: typeof req.query.q === 'string' ? req.query.q : '',
    classe: typeof req.query.classe === 'string' ? req.query.classe : '',
    niveau: typeof req.query.niveau === 'string' ? req.query.niveau : '',
    limit: Number(req.query.limit || 50),
    offset: Number(req.query.offset || 0),
  });
  res.json(result);
});

app.put('/api/state', requireAuth(['admin','prof','gestionnaire']), (req: Request, res: Response) => {
  try {
    const user = (req as any).userSession;
    if (!req.body || typeof req.body !== 'object' || !req.body.state) return res.status(400).json({ error: 'État applicatif invalide.' });
    const updated = updateState(req.body.state, user);
    res.json({ state: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Impossible d’enregistrer les données.' });
  }
});

app.post('/api/auth/change-password', requireAuth(['admin']), (req: Request, res: Response) => {
  try {
    const { type, id, password } = req.body || {};
    if (!['admin','prof','gestionnaire'].includes(type) || typeof password !== 'string') return res.status(400).json({ error: 'Données invalides.' });
    changePassword({ type, id: type === 'admin' ? null : id }, password, (req as any).userSession);
    res.json({ ok: true });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

app.get('/api/audit', requireAuth(['admin']), (req: Request, res: Response) => {
  res.json({ logs: getAuditLogs(Number(req.query.limit || 100)) });
});

app.post('/api/system/backup', (req: Request, res: Response) => {
  const token = req.headers['x-local-system-token'];
  if (typeof token !== 'string' || token !== process.env.LOCAL_SYSTEM_TOKEN) return res.status(403).json({ error: 'Accès système refusé.' });
  try { const result = createBackup(typeof req.body?.reason === 'string' ? req.body.reason : 'system'); res.json(result); }
  catch (error: any) { res.status(500).json({ error: error.message || 'Sauvegarde impossible.' }); }
});

// Vite & Static middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Serveur La Persévérance démarré sur http://localhost:${PORT}`);
  });
}

startServer();
