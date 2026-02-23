import { useState } from 'react';
import type { Trip, PackingItem, UserSession } from '../../types';
import { generateId } from '../../store';
import { Plus, ChevronDown, Users, User, Package } from 'lucide-react';

interface Props {
  trip: Trip;
  session: UserSession;
  onUpdate: (trip: Trip) => void;
}

type ViewMode = 'mine' | 'shared';

export function PackingTab({ trip, session, onUpdate }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('mine');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [addError, setAddError] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );

  const myPerson = trip.people.find((p) => p.phone === session.phone);
  const myId = myPerson?.id;

  const myItems = myId
    ? trip.packingItems.filter((i) => i.assignedTo === myId)
    : [];
  const sharedItems = trip.packingItems.filter((i) => !i.assignedTo);

  const activeItems = viewMode === 'mine' ? myItems : sharedItems;
  const categories = [...new Set(activeItems.map((i) => i.category))];

  const myChecked = myItems.filter((i) => i.checked).length;
  const sharedChecked = sharedItems.filter((i) => i.checked).length;

  const activeChecked = activeItems.filter((i) => i.checked).length;
  const activeTotal = activeItems.length;
  const activeProgress =
    activeTotal > 0 ? (activeChecked / activeTotal) * 100 : 0;

  function getPersonName(personId: string): string {
    return trip.people.find((p) => p.id === personId)?.name ?? '';
  }

  function toggleItem(id: string) {
    const item = trip.packingItems.find((i) => i.id === id);
    if (!item) return;
    const nowChecked = !item.checked;
    onUpdate({
      ...trip,
      packingItems: trip.packingItems.map((i) =>
        i.id === id
          ? { ...i, checked: nowChecked, checkedBy: nowChecked ? (myId ?? '') : '' }
          : i
      ),
    });
  }

  function removeItem(id: string) {
    onUpdate({
      ...trip,
      packingItems: trip.packingItems.filter((i) => i.id !== id),
    });
  }

  function setQuantity(id: string, qty: number) {
    if (qty < 1) qty = 1;
    onUpdate({
      ...trip,
      packingItems: trip.packingItems.map((i) =>
        i.id === id ? { ...i, quantity: qty } : i
      ),
    });
  }

  function addItem() {
    const name = newItemName.trim();
    const category = newItemCategory.trim();
    if (!category || category === '__new__') {
      setAddError('בחר קטגוריה');
      return;
    }
    if (!name) {
      setAddError('הזן שם פריט');
      return;
    }
    setAddError('');
    const newItem: PackingItem = {
      id: generateId(),
      category,
      name,
      checked: false,
      assignedTo: viewMode === 'mine' ? myId ?? '' : '',
    };
    onUpdate({ ...trip, packingItems: [...trip.packingItems, newItem] });
    setNewItemName('');
    setShowForm(false);
  }

  function toggleCategory(cat: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  if (!myPerson) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-3 bg-ios-gray5 rounded-2xl flex items-center justify-center">
          <Package size={32} className="text-ios-gray3" />
        </div>
        <p className="text-[17px] font-semibold text-ios-label3">אתה לא משתתף בטיול</p>
        <p className="text-[13px] text-ios-gray mt-1">
          הצטרף לטיול בטאב &quot;טיול&quot; כדי לראות את הרשימה שלך
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* iOS Segmented Control */}
      <div className="bg-ios-gray5 rounded-[10px] p-[3px] flex animate-fade-in-up">
        <button
          onClick={() => setViewMode('mine')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
            viewMode === 'mine'
              ? 'bg-ios-card text-ios-label shadow-sm'
              : 'text-ios-gray'
          }`}
        >
          <User size={14} />
          שלי
          <span className="text-[11px] opacity-60" dir="ltr">
            {myChecked}/{myItems.length}
          </span>
        </button>
        <button
          onClick={() => setViewMode('shared')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
            viewMode === 'shared'
              ? 'bg-ios-card text-ios-label shadow-sm'
              : 'text-ios-gray'
          }`}
        >
          <Users size={14} />
          כללי
          <span className="text-[11px] opacity-60" dir="ltr">
            {sharedChecked}/{sharedItems.length}
          </span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="ios-card p-4 animate-fade-in-up stagger-1">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-medium text-ios-label3">
            {viewMode === 'mine' ? 'ההתקדמות שלי' : 'התקדמות כללית'}
          </span>
          <span className="text-[13px] font-bold text-ios-blue" dir="ltr">
            {activeChecked}/{activeTotal}
          </span>
        </div>
        <div className="w-full bg-ios-gray5 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-ios-blue rounded-full transition-all duration-500 ease-out"
            style={{ width: `${activeProgress}%` }}
          />
        </div>
        {activeProgress === 100 && activeTotal > 0 && (
          <p className="text-center text-ios-green font-semibold text-[13px] mt-2 animate-scale-in">
            {viewMode === 'mine' ? 'הכל ארוז! ✓' : 'הכל מוכן! ✓'}
          </p>
        )}
      </div>

      {/* Empty state */}
      {activeItems.length === 0 && !showForm && (
        <div className="text-center py-10 animate-fade-in">
          <div className="w-14 h-14 mx-auto mb-3 bg-ios-gray5 rounded-2xl flex items-center justify-center">
            {viewMode === 'mine' ? (
              <User size={24} className="text-ios-gray3" />
            ) : (
              <Users size={24} className="text-ios-gray3" />
            )}
          </div>
          <p className="text-ios-gray text-[13px]">
            {viewMode === 'mine'
              ? 'הרשימה האישית ריקה'
              : 'הרשימה הכללית ריקה'}
          </p>
        </div>
      )}

      {/* Categories */}
      {categories.map((cat, catIdx) => {
        const catItems = activeItems.filter((i) => i.category === cat);
        const catChecked = catItems.filter((i) => i.checked).length;
        const collapsed = collapsedCategories.has(cat);

        return (
          <div
            key={cat}
            className={`ios-card overflow-hidden animate-fade-in-up stagger-${Math.min(catIdx + 2, 6)}`}
          >
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between px-4 py-3 active:bg-ios-gray6 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[15px] text-ios-label">{cat}</span>
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    catChecked === catItems.length && catItems.length > 0
                      ? 'bg-ios-green/15 text-ios-green'
                      : 'bg-ios-gray5 text-ios-gray'
                  }`}
                  dir="ltr"
                >
                  {catChecked}/{catItems.length}
                </span>
              </div>
              <div
                className={`transition-transform duration-200 ${
                  collapsed ? '' : 'rotate-180'
                }`}
              >
                <ChevronDown size={16} className="text-ios-gray3" />
              </div>
            </button>

            {!collapsed && (
              <div className="animate-slide-down">
                {catItems.map((item) => {
                  const checkerName =
                    viewMode === 'shared' && item.checked && item.checkedBy
                      ? getPersonName(item.checkedBy) || ''
                      : '';

                  const qty = item.quantity ?? 1;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 ${
                        item.checked ? 'bg-ios-gray6/50' : ''
                      } border-t border-ios-separator`}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                          item.checked
                            ? 'bg-ios-blue border-ios-blue text-white animate-check-pop'
                            : 'border-ios-gray3 active:border-ios-blue'
                        }`}
                      >
                        {item.checked && (
                          <svg width="10" height="10" viewBox="0 0 12 12">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-[15px] transition-all duration-200 ${
                            item.checked
                              ? 'line-through text-ios-gray3'
                              : 'text-ios-label'
                          }`}
                        >
                          {item.name}
                          {qty > 1 && item.checked && (
                            <span className="text-[12px] text-ios-gray3 font-medium mr-1">
                              ×{qty}
                            </span>
                          )}
                        </span>
                        {checkerName && (
                          <span className="text-[11px] text-ios-blue font-medium block">
                            ✓ {checkerName}
                          </span>
                        )}
                      </div>
                      {!item.checked && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          {qty > 1 && (
                            <button
                              onClick={() => setQuantity(item.id, qty - 1)}
                              className="w-6 h-6 rounded-full bg-ios-gray5 flex items-center justify-center text-ios-gray text-[14px] font-bold active:bg-ios-gray4 transition-colors"
                            >
                              −
                            </button>
                          )}
                          <button
                            onClick={() => setQuantity(item.id, qty + 1)}
                            className={`min-w-[24px] h-6 rounded-full flex items-center justify-center text-[12px] font-bold active:bg-ios-gray4 transition-colors ${
                              qty > 1
                                ? 'bg-ios-blue/10 text-ios-blue px-1.5'
                                : 'bg-ios-gray5 text-ios-gray3'
                            }`}
                          >
                            {qty > 1 ? `×${qty}` : '+'}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-ios-gray4 active:text-ios-red text-lg px-1 transition-colors duration-150"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Add item form */}
      {showForm ? (
        <div className="ios-card p-4 space-y-3 animate-scale-in">
          <div className="text-[13px] font-medium text-ios-gray mb-1">
            {viewMode === 'mine'
              ? 'הוספה לרשימה האישית'
              : 'הוספה לרשימה הכללית'}
          </div>
          <select
            value={newItemCategory}
            onChange={(e) => { setNewItemCategory(e.target.value); setAddError(''); }}
            className="w-full bg-ios-gray6 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
          >
            <option value="">בחר קטגוריה...</option>
            {[...new Set(trip.packingItems.map((i) => i.category))].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__new__">+ קטגוריה חדשה</option>
          </select>
          {newItemCategory === '__new__' && (
            <input
              type="text"
              placeholder="שם הקטגוריה..."
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="w-full bg-ios-gray6 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue/30 placeholder:text-ios-gray3 animate-slide-down"
            />
          )}
          <input
            type="text"
            value={newItemName}
            onChange={(e) => { setNewItemName(e.target.value); setAddError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="שם הפריט..."
            autoFocus
            className="w-full bg-ios-gray6 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue/30 placeholder:text-ios-gray3"
          />
          {addError && (
            <div className="text-center text-sm text-ios-red font-medium animate-scale-in">
              {addError}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={addItem}
              className="flex-1 bg-ios-blue text-white font-semibold py-3 rounded-xl active:opacity-80 transition-opacity"
            >
              הוסף
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNewItemName('');
                setNewItemCategory('');
                setAddError('');
              }}
              className="px-4 py-3 text-ios-blue rounded-xl active:bg-ios-gray6 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 ios-card p-3.5 text-ios-blue font-semibold text-[15px] active:bg-ios-gray6 transition-colors"
        >
          <Plus size={18} />
          הוסף פריט
        </button>
      )}
    </div>
  );
}
