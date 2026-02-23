import { useState } from 'react';
import type { Trip, TabId, UserSession } from '../types';
import { TabNavigation } from './TabNavigation';
import { TripInfoTab } from './tabs/TripInfoTab';
import { PackingTab } from './tabs/PackingTab';
import { ExpensesTab } from './tabs/ExpensesTab';
import { ChevronRight, Share2 } from 'lucide-react';

interface Props {
  trip: Trip;
  session: UserSession;
  onUpdate: (trip: Trip) => void;
  onBack: () => void;
}

export function TripView({ trip, session, onUpdate, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('trip');
  const [copied, setCopied] = useState(false);

  function shareLink() {
    const url = `${window.location.origin}${window.location.pathname}#${trip.id}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-dvh bg-ios-bg pb-20">
      <header className="sticky top-0 z-10 bg-ios-card/80 backdrop-blur-xl border-b border-ios-separator px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={onBack}
            className="flex items-center gap-0.5 text-ios-blue active:opacity-60 transition-opacity -ms-1 py-2 pe-2"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
            <span className="text-[17px]">חזרה</span>
          </button>
          <div className="flex-1" />
          <button
            onClick={shareLink}
            className="text-ios-blue active:opacity-60 transition-opacity p-2 -me-1 relative"
          >
            <Share2 size={18} />
            {copied && (
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap animate-fade-in">
                הקישור הועתק!
              </span>
            )}
          </button>
        </div>
        <h1 className="text-[22px] font-bold text-ios-label truncate -mt-0.5">
          {trip.name}
        </h1>
      </header>

      <main className="px-4 pt-3 pb-2 animate-fade-in">
        {activeTab === 'trip' && (
          <TripInfoTab trip={trip} session={session} onUpdate={onUpdate} />
        )}
        {activeTab === 'packing' && (
          <PackingTab trip={trip} session={session} onUpdate={onUpdate} />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab trip={trip} session={session} onUpdate={onUpdate} />
        )}
      </main>

      <TabNavigation active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
