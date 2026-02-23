import { useState, useEffect } from 'react';
import type { Trip, TabId, UserSession } from '../types';
import { TabNavigation } from './TabNavigation';
import { TripInfoTab } from './tabs/TripInfoTab';
import { PackingTab } from './tabs/PackingTab';
import { ExpensesTab } from './tabs/ExpensesTab';
import { ResortTab } from './tabs/ResortTab';
import { FoodTab } from './tabs/FoodTab';
import { ChevronRight, Share2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../useTheme';

interface Props {
  trip: Trip;
  session: UserSession;
  onUpdate: (trip: Trip) => void;
  onBack: () => void;
}

function getStoredTab(tripId: string): TabId {
  const stored = localStorage.getItem(`tab:${tripId}`);
  if (stored === 'trip' || stored === 'packing' || stored === 'expenses' || stored === 'resort' || stored === 'food') return stored;
  return 'trip';
}

export function TripView({ trip, session, onUpdate, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(() => getStoredTab(trip.id));
  const [copied, setCopied] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  function changeTab(tab: TabId) {
    setActiveTab(tab);
    localStorage.setItem(`tab:${trip.id}`, tab);
  }

  function shareLink() {
    const url = `${window.location.origin}${window.location.pathname}#${trip.id}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-dvh bg-ios-bg pb-20 md:pb-8">
      <div className="sticky top-0 z-10">
        <header className="bg-ios-card/80 backdrop-blur-xl border-b border-ios-separator md:border-b-0 px-4 md:px-8 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
          <div className="flex items-center gap-1">
            <button
              onClick={onBack}
              className="flex items-center gap-0.5 text-ios-blue active:opacity-60 transition-opacity -ms-1 py-2 pe-2"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
              <span className="text-[17px]">חזרה</span>
            </button>
            <div className="flex-1" />
            {!online && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" title="אופליין" />
            )}
            <button
              onClick={toggleTheme}
              className="text-ios-blue active:opacity-60 transition-opacity p-2 md:hover:bg-ios-gray5 md:rounded-full"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={shareLink}
              className="text-ios-blue active:opacity-60 transition-opacity p-2 -me-1 relative md:hover:bg-ios-gray5 md:rounded-full"
            >
              <Share2 size={18} />
              {copied && (
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap animate-fade-in">
                  הקישור הועתק!
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 -mt-0.5">
            <h1 className="text-[22px] md:text-[28px] font-bold text-ios-label truncate">
              {trip.name}
            </h1>
          </div>
        </header>
        <TabNavigation active={activeTab} onChange={changeTab} />
      </div>

      <main className="px-4 md:px-8 pt-3 md:pt-6 pb-2 animate-fade-in max-w-6xl mx-auto">
        {activeTab === 'trip' && (
          <TripInfoTab trip={trip} session={session} onUpdate={onUpdate} />
        )}
        {activeTab === 'packing' && (
          <PackingTab trip={trip} session={session} onUpdate={onUpdate} />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab trip={trip} session={session} onUpdate={onUpdate} />
        )}
        {activeTab === 'resort' && <ResortTab />}
        {activeTab === 'food' && (
          <FoodTab trip={trip} session={session} onUpdate={onUpdate} />
        )}
      </main>
    </div>
  );
}
