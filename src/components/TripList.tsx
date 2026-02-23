import { useState } from 'react';
import type { Trip, UserSession } from '../types';
import { generateId, createDefaultSharedItems } from '../store';
import { Plus, Trash2, Users, Calendar, Mountain, LogOut, Share2 } from 'lucide-react';

interface Props {
  trips: Trip[];
  session: UserSession;
  onAdd: (trip: Trip) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
}

export function TripList({ trips, session, onAdd, onSelect, onDelete, onLogout }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  function handleCreate() {
    if (!name.trim()) return;
    const trip: Trip = {
      id: generateId(),
      name: name.trim(),
      startDate: '',
      endDate: '',
      people: [],
      packingItems: createDefaultSharedItems(),
      expenses: [],
    };
    onAdd(trip);
    setName('');
    setShowForm(false);
  }

  function daysBetween(start: string, end: string): number | null {
    if (!start || !end) return null;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(0, Math.ceil(ms / 86400000));
  }

  return (
    <div className="min-h-dvh bg-ios-bg">
      <header className="bg-ios-card/80 backdrop-blur-xl border-b border-ios-separator px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-ios-gray">שלום, {session.name}</div>
          <button
            onClick={onLogout}
            className="text-ios-blue active:opacity-60 transition-opacity p-1"
            title="התנתק"
          >
            <LogOut size={18} />
          </button>
        </div>
        <h1 className="text-[28px] font-bold text-ios-label">טיולי סקי</h1>
      </header>

      <main className="px-4 pt-3 space-y-3">
        {trips.length === 0 && !showForm && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-3 bg-ios-gray5 rounded-2xl flex items-center justify-center">
              <Mountain size={32} className="text-ios-gray3" />
            </div>
            <p className="text-[17px] font-semibold text-ios-label3">אין טיולים עדיין</p>
            <p className="text-[13px] text-ios-gray mt-1">לחץ + כדי ליצור טיול חדש</p>
          </div>
        )}

        {trips.map((trip, idx) => {
          const days = daysBetween(trip.startDate, trip.endDate);
          const packed = trip.packingItems.filter((i) => i.checked).length;
          const totalItems = trip.packingItems.length;
          const myPerson = trip.people.find((p) => p.phone === session.phone);

          return (
            <div
              key={trip.id}
              onClick={() => onSelect(trip.id)}
              className={`ios-card p-4 active:bg-ios-gray6 transition-colors duration-100 cursor-pointer animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[17px] text-ios-label truncate">
                    {trip.name}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[13px] text-ios-gray">
                    <span className="flex items-center gap-1">
                      <Users size={13} />
                      <span dir="ltr">{trip.people.length}</span> משתתפים
                    </span>
                    {days !== null && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        <span dir="ltr">{days}</span> ימים
                      </span>
                    )}
                  </div>
                  {myPerson && (
                    <div className="mt-1 text-[12px] text-ios-blue font-medium">
                      אתה משתתף
                    </div>
                  )}
                  {totalItems > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-ios-gray5 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full bg-ios-blue rounded-full transition-all duration-500"
                          style={{ width: `${(packed / totalItems) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-ios-gray" dir="ltr">
                        {packed}/{totalItems}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = `${window.location.origin}${window.location.pathname}#${trip.id}`;
                      navigator.clipboard?.writeText(url);
                    }}
                    className="p-2 text-ios-gray3 active:text-ios-blue rounded-full transition-colors"
                  >
                    <Share2 size={15} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(trip.id);
                    }}
                    className="p-2 text-ios-gray3 active:text-ios-red rounded-full transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {showForm && (
          <div className="ios-card p-4 space-y-3 animate-scale-in">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם הטיול..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="w-full bg-ios-gray6 rounded-xl px-4 py-3 text-right placeholder:text-ios-gray3 focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 bg-ios-blue text-white font-semibold py-3 rounded-xl active:opacity-80 transition-opacity"
              >
                צור טיול
              </button>
              <button
                onClick={() => { setShowForm(false); setName(''); }}
                className="px-4 py-3 text-ios-blue rounded-xl active:bg-ios-gray6 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </main>

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ios-blue text-white w-14 h-14 rounded-full shadow-lg shadow-ios-blue/30 flex items-center justify-center active:scale-90 transition-transform duration-150"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}
