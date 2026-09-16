import { useCallback, useEffect, useState } from 'react';
import './App.css';

import Cashier from './components/Cashier';
import Cms from './components/cms/Cms';
import Sales from './components/sales/Sales';
import LoginCard from './components/auth/LoginCard';
import PendingSync from './components/offline/PendingSync';
import { ApiError, fetchCatalog } from './api/client';
import { TOKEN_STORAGE_KEY, isTokenExpired, readStoredToken, storedTokenExpired, tokenUsername } from './api/session';
import { AuthContext } from './api/authContext';
import { syncer, setSyncTokenReader } from './offline';
import type { SyncStatus } from './offline/syncer';

// Re-exported so existing importers keep working; the definition moved out to
// break the App <-> component import cycle.
export { AuthContext } from './api/authContext';

/** The till, the catalog editor, or recorded sales. */
type View = 'cashier' | 'cms' | 'sales';

function App() {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [view, setView] = useState<View>('cashier');
  // Bumped to force the catalog effect to re-run after CMS edits.
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    online: false,
    pending: 0,
    syncing: false,
    lastError: null,
    conflicts: 0,
    lastOrderRef: null,
  });
  const [showPending, setShowPending] = useState(false);
  const [, forceTick] = useState(0);

  // The syncer reads the token lazily. An expired one is withheld so it stops
  // trying to sync (the server would 401), while the till keeps working.
  useEffect(() => {
    setSyncTokenReader(() => (token && !isTokenExpired(token) ? token : null));
    const unsubscribe = syncer.subscribe(setSyncStatus);
    syncer.start();
    return () => {
      unsubscribe();
      syncer.stop();
    };
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setCategoryItems([]);
    setCatalogError('');
    setView('cashier');
  }, []);

  const authenticate = useCallback((nextToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    // A fresh session is the moment to reconcile anything queued offline.
    syncer.poke();
  }, []);

  // Load the catalog whenever we have a token. Runs once per login rather than
  // once per render, and every state update happens in the promise callbacks.
  useEffect(() => {
    if (!token) {
      return;
    }
    if (isTokenExpired(token)) {
      // Offline with a stale session: skip the doomed request. The till renders
      // from the cached catalogue and queued sales sync after a re-login.
      return;
    }

    let cancelled = false;

    fetchCatalog(token)
      .then((items) => {
        if (cancelled) return;
        setCategoryItems(items);
        setCatalogError('');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          logout();
          return;
        }
        // Unreachable backend is expected offline. The till falls back to the
        // cached catalogue, so an error banner would be noise.
        if (error instanceof ApiError && error.status === 0) {
          return;
        }
        setCatalogError(error instanceof Error ? error.message : 'Failed to load the catalog.');
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout, catalogRevision]);

  // Re-render periodically so the "session expired" prompt appears on its own
  // rather than waiting for the next user interaction.
  useEffect(() => {
    const timer = setInterval(() => forceTick((tick) => tick + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  /** Leaving the CMS: pick up whatever the editor just changed. */
  const showCashier = useCallback(() => {
    setView('cashier');
    setCatalogRevision((revision) => revision + 1);
  }, []);

  // Recomputed whenever the token changes or a sync tick lands, so an expired
  // session is noticed without waiting for the next interaction.
  const sessionStale = token !== null && storedTokenExpired();
  const offline = !syncStatus.online;

  const statusLabel = offline
    ? `offline${syncStatus.pending > 0 ? ` · ${syncStatus.pending} queued` : ''}`
    : sessionStale && syncStatus.pending > 0
      ? 'sign in to sync'
      : syncStatus.syncing
        ? 'syncing…'
        : syncStatus.pending > 0
          ? `${syncStatus.pending} queued`
          : 'online';

  const statusTone =
    offline || (sessionStale && syncStatus.pending > 0) || syncStatus.pending > 0 ? (offline ? 'offline' : 'warn') : 'online';

  return (
    <AuthContext.Provider value={{ token, username: tokenUsername(token), logout }}>
      {catalogError && <div className="appError">{catalogError}</div>}
      {token ? (
        <div className="appShell">
          <nav className="appNav">
            <button type="button" className={view === 'cashier' ? 'appNavActive' : undefined} onClick={showCashier}>
              till
            </button>
            <button
              type="button"
              className={view === 'cms' ? 'appNavActive' : undefined}
              onClick={() => setView('cms')}
              disabled={offline}
              title={offline ? 'The catalog editor needs a connection.' : undefined}
            >
              catalog cms
            </button>
            <button
              type="button"
              className={view === 'sales' ? 'appNavActive' : undefined}
              onClick={() => setView('sales')}
              disabled={offline}
              title={offline ? 'Recorded sales need a connection.' : undefined}
            >
              sales
            </button>
            <button
              type="button"
              className={`appSyncChip appSyncChip--${statusTone}`}
              onClick={() => setShowPending(true)}
              title="Sales saved on this device"
            >
              {statusLabel}
            </button>
            <span className="appNavUser">{tokenUsername(token)}</span>
          </nav>
          {/* Takes the height left over by the nav. The till sizes itself from
              its parent, so giving the nav its own flow height used to push the
              reset/change row off the bottom of the viewport. */}
          <div className="appView">
            {view === 'cms' && <Cms token={token} onExit={showCashier} onUnauthorized={logout} />}
            {view === 'sales' && <Sales token={token} onUnauthorized={logout} />}
            {view === 'cashier' && <Cashier categoryItems={categoryItems} />}
          </div>
          {showPending && <PendingSync status={syncStatus} onClose={() => setShowPending(false)} />}
        </div>
      ) : (
        <LoginCard onAuthenticated={authenticate} />
      )}
    </AuthContext.Provider>
  );
}

export default App;
