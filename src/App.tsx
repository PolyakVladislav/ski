import { useState, useEffect } from 'react';
import type { UserSession } from './types';
import { getSession, saveSession, clearSession, useTripList, useTrip } from './store';
import { LoginScreen } from './components/LoginScreen';
import { TripList } from './components/TripList';
import { TripView } from './components/TripView';
import { Loader2 } from 'lucide-react';

function getTripIdFromHash(): string | null {
  const hash = window.location.hash.replace('#', '');
  return hash || null;
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(getSession);
  const [activeTripId, setActiveTripId] = useState<string | null>(getTripIdFromHash);

  const { trips, loading: listLoading, addTrip, deleteTrip } = useTripList();
  const { trip: activeTrip, loading: tripLoading, updateTrip } = useTrip(activeTripId);

  useEffect(() => {
    function onHashChange() {
      setActiveTripId(getTripIdFromHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function handleLogin(s: UserSession) {
    saveSession(s);
    setSession(s);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  function selectTrip(id: string) {
    window.location.hash = id;
    setActiveTripId(id);
  }

  function goBack() {
    window.location.hash = '';
    setActiveTripId(null);
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (activeTripId && tripLoading) {
    return (
      <div className="min-h-dvh bg-ios-bg flex items-center justify-center">
        <Loader2 size={32} className="text-ios-blue animate-spin" />
      </div>
    );
  }

  if (activeTripId && activeTrip) {
    return (
      <TripView
        trip={activeTrip}
        session={session}
        onUpdate={updateTrip}
        onBack={goBack}
      />
    );
  }

  if (listLoading) {
    return (
      <div className="min-h-dvh bg-ios-bg flex items-center justify-center">
        <Loader2 size={32} className="text-ios-blue animate-spin" />
      </div>
    );
  }

  return (
    <TripList
      trips={trips}
      session={session}
      onAdd={addTrip}
      onSelect={selectTrip}
      onDelete={deleteTrip}
      onLogout={handleLogout}
    />
  );
}
