import { Mountain, PackageCheck, Receipt, CloudSnow } from 'lucide-react';
import type { TabId } from '../types';

const TABS: { id: TabId; label: string; icon: typeof Mountain }[] = [
  { id: 'trip', label: 'טיול', icon: Mountain },
  { id: 'resort', label: 'אתר', icon: CloudSnow },
  { id: 'packing', label: 'ציוד', icon: PackageCheck },
  { id: 'expenses', label: 'הוצאות', icon: Receipt },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabNavigation({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ios-card/80 backdrop-blur-xl border-t border-ios-separator pb-[env(safe-area-inset-bottom)] z-20">
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
  );
}
