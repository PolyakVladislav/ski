import { Mountain, PackageCheck, Receipt, CloudSnow, UtensilsCrossed } from 'lucide-react';
import type { TabId } from '../types';

const TABS: { id: TabId; label: string; icon: typeof Mountain }[] = [
  { id: 'trip', label: 'טיול', icon: Mountain },
  { id: 'resort', label: 'אתר', icon: CloudSnow },
  { id: 'food', label: 'אוכל', icon: UtensilsCrossed },
  { id: 'packing', label: 'ציוד', icon: PackageCheck },
  { id: 'expenses', label: 'הוצאות', icon: Receipt },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabNavigation({ active, onChange }: Props) {
  return (
    <>
      {/* Mobile: bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-ios-card/80 backdrop-blur-xl border-t border-ios-separator pb-[env(safe-area-inset-bottom)] z-20 md:hidden">
        <div className="flex">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1 transition-colors duration-150 ${
                  isActive ? 'text-ios-blue' : 'text-ios-gray'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop: horizontal pill tabs */}
      <div className="hidden md:flex gap-2 px-8 py-3 border-b border-ios-separator bg-ios-card/60 backdrop-blur-xl">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-ios-blue text-white shadow-md shadow-ios-blue/20'
                  : 'text-ios-gray hover:bg-ios-gray5 hover:text-ios-label'
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}
