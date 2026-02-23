import { useState } from 'react';
import type { Trip, UserSession } from '../../types';
import { generateId, createPersonalItems } from '../../store';
import {
  Plane,
  Bus,
  MapPin,
  Clock,
  Users,
  Wallet,
  Calendar,
  ChevronDown,
  UserPlus,
  X,
  Phone,
  Mountain,
  Home,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

const AVATAR_COLORS = [
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-green-500',
  'from-cyan-400 to-teal-500',
];

interface Props {
  trip: Trip;
  session: UserSession;
  onUpdate: (trip: Trip) => void;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

export function TripInfoTab({ trip, session, onUpdate }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [copied, setCopied] = useState(false);

  function copyConfirmation() {
    navigator.clipboard.writeText('HM2TRCRKF8');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isMeInTrip = trip.people.some((p) => p.phone === session.phone);
  const totalExpenses = trip.expenses.reduce((s, e) => s + e.amount, 0);

  function addPerson() {
    const trimmedName = personName.trim();
    const trimmedPhone = normalizePhone(personPhone.trim());
    if (!trimmedName || !trimmedPhone) return;
    if (trip.people.some((p) => p.phone === trimmedPhone)) return;
    const personId = generateId();
    const personalItems = createPersonalItems(personId);
    onUpdate({
      ...trip,
      people: [
        ...trip.people,
        { id: personId, name: trimmedName, phone: trimmedPhone },
      ],
      packingItems: [...trip.packingItems, ...personalItems],
    });
    setPersonName('');
    setPersonPhone('');
  }

  function addSelf() {
    if (isMeInTrip) return;
    const personId = generateId();
    const personalItems = createPersonalItems(personId);
    onUpdate({
      ...trip,
      people: [
        ...trip.people,
        { id: personId, name: session.name, phone: session.phone },
      ],
      packingItems: [...trip.packingItems, ...personalItems],
    });
  }

  function removePerson(id: string) {
    onUpdate({
      ...trip,
      people: trip.people.filter((p) => p.id !== id),
      packingItems: trip.packingItems.filter((i) => i.assignedTo !== id),
    });
  }

  return (
    <div className="space-y-3">
      {/* Join */}
      {!isMeInTrip && (
        <button
          onClick={addSelf}
          className="w-full bg-ios-blue text-white font-semibold py-4 rounded-xl active:opacity-80 transition-opacity text-[17px] animate-scale-in"
        >
          הצטרף לטיול
        </button>
      )}

      {/* Hero card */}
      <div className="bg-gradient-to-bl from-mountain to-mountain-light rounded-2xl p-5 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-3 left-6 opacity-10">
          <Mountain size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-sky-300" />
            <span className="text-white/60 text-[13px] font-medium">Val Thorens, France</span>
          </div>
          <h2 className="text-[22px] font-bold mb-3">סקי באלפים</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/60">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span dir="ltr">25.02 – 04.03</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              7 ימים
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {trip.people.length} משתתפים
            </span>
            {totalExpenses > 0 && (
              <span className="flex items-center gap-1.5">
                <Wallet size={14} />
                <span dir="ltr">₪{totalExpenses.toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Outbound flight */}
      <div className="ios-card overflow-hidden animate-fade-in-up stagger-1">
        <div className="bg-sky-50 px-4 py-3 flex items-center gap-2">
          <Plane size={16} className="text-sky-600" />
          <span className="font-bold text-sky-800 text-sm">טיסת הלוך</span>
          <span className="text-xs text-sky-500 mr-auto" dir="ltr">
            יום ד׳ 25.02.2026
          </span>
        </div>
        <div className="p-4 space-y-0">
          {/* Leg 1 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-sky-500 ring-2 ring-sky-200" />
              <div className="w-0.5 flex-1 bg-sky-200" />
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gray-900" dir="ltr">05:20</span>
                <span className="text-xs text-gray-400">Terminal 3</span>
              </div>
              <div className="text-sm text-gray-700 font-medium">Tel Aviv Ben Gurion</div>
              <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                <span dir="ltr" className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">A3929</span>
                <span>Aegean Airlines</span>
                <span>·</span>
                <span dir="ltr">2 שעות 10 דק׳</span>
              </div>
            </div>
          </div>

          {/* Athens arrival */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200" />
              <div className="w-0.5 flex-1 bg-amber-200 border-dashed" />
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gray-900" dir="ltr">07:30</span>
              </div>
              <div className="text-sm text-gray-700 font-medium">Athens El. Venizelos</div>
              <div className="mt-1.5 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700 font-medium">
                <Clock size={12} className="inline ml-1" />
                המתנה 50 דקות
              </div>
            </div>
          </div>

          {/* Leg 2 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-sky-500 ring-2 ring-sky-200" />
              <div className="w-0.5 flex-1 bg-sky-200" />
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gray-900" dir="ltr">08:20</span>
                <span className="text-xs text-gray-400">Terminal 3</span>
              </div>
              <div className="text-sm text-gray-700 font-medium">Athens El. Venizelos</div>
              <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                <span dir="ltr" className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">A3854</span>
                <span>Aegean Airlines</span>
                <span>·</span>
                <span dir="ltr">2 שעות 50 דק׳</span>
              </div>
            </div>
          </div>

          {/* Geneva arrival */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gray-900" dir="ltr">10:10</span>
                <span className="text-xs text-gray-400">Terminal 1</span>
              </div>
              <div className="text-sm text-gray-700 font-medium">Geneva Int. Airport</div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-3 text-xs text-gray-400">
          <span>ComfortFlex · Economy</span>
          <span dir="ltr">סה״כ 5:50 שעות</span>
        </div>
      </div>

      {/* Transfer */}
      <div className="ios-card overflow-hidden animate-fade-in-up stagger-2">
        <div className="bg-emerald-50 px-4 py-3 flex items-center gap-2">
          <Bus size={16} className="text-emerald-600" />
          <span className="font-bold text-emerald-800 text-sm">הסעה לאתר</span>
          <span className="text-xs text-emerald-500 mr-auto" dir="ltr">
            25.02.2026
          </span>
        </div>
        <div className="p-4 space-y-0">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <div className="w-0.5 flex-1 bg-emerald-200" />
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gray-900" dir="ltr">~11:30</span>
                <span className="text-xs text-emerald-500 font-medium">איסוף משוער</span>
              </div>
              <div className="text-sm text-gray-700 font-medium">Geneva Airport</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-600 ring-2 ring-emerald-200" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-700 font-medium">Val Thorens</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Gare Routiere, Place des Arolles
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-3 text-xs text-gray-400">
          Shared Transfer · Fixed Point
        </div>
      </div>

      {/* Accommodation */}
      <div className="ios-card overflow-hidden animate-fade-in-up stagger-2">
        <div className="bg-rose-50 px-4 py-3 flex items-center gap-2">
          <Home size={16} className="text-rose-600" />
          <span className="font-bold text-rose-800 text-sm">לינה</span>
          <span className="text-xs text-rose-500 mr-auto" dir="ltr">
            Airbnb · 7 לילות
          </span>
        </div>
        <div className="relative">
          <img
            src="/hotel.jpg"
            alt="Apartment in Les Belleville"
            className="w-full h-48 object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
            Les Belleville
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-gray-900">Home in Les Belleville</h3>
            <p className="text-sm text-gray-500">Hosted by Damien</p>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5">
              <div className="text-xs text-gray-400 font-medium">Check-in</div>
              <div className="font-bold text-gray-800 text-sm" dir="ltr">Wed, Feb 25</div>
              <div className="text-xs text-gray-500" dir="ltr">4:00 PM</div>
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5">
              <div className="text-xs text-gray-400 font-medium">Checkout</div>
              <div className="font-bold text-gray-800 text-sm" dir="ltr">Wed, Mar 4</div>
              <div className="text-xs text-gray-500" dir="ltr">11:00 AM</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-600" dir="ltr">
              Grande Rue Lac du loup, Les Belleville, 73440
            </span>
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
            <div>
              <div className="text-xs text-gray-400">Confirmation code</div>
              <div className="font-mono font-bold text-gray-800 text-sm" dir="ltr">HM2TRCRKF8</div>
            </div>
            <button
              onClick={copyConfirmation}
              className="text-gray-400 active:text-sky-500 p-1.5 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>

          <a
            href="https://www.airbnb.com/trips/v1/reservation-details/ro/RESERVATION2_CHECKIN/HM2TRCRKF8"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50 transition-colors"
          >
            <ExternalLink size={14} />
            פתח ב-Airbnb
          </a>
        </div>
        <div className="px-4 pb-3 text-xs text-gray-400">
          Non-refundable · Auvergne-Rhône-Alpes, France
        </div>
      </div>

      {/* Return transfer */}
      <div className="ios-card overflow-hidden animate-fade-in-up stagger-3">
        <div className="bg-orange-50 px-4 py-3 flex items-center gap-2">
          <Bus size={16} className="text-orange-600" />
          <span className="font-bold text-orange-800 text-sm">הסעה לשדה התעופה</span>
          <span className="text-xs text-orange-500 mr-auto" dir="ltr">
            04.03.2026
          </span>
        </div>
        <div className="p-4 space-y-0">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-200" />
              <div className="w-0.5 flex-1 bg-orange-200" />
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gray-900" dir="ltr">05:00</span>
                <span className="text-xs text-orange-500 font-medium">איסוף משוער</span>
              </div>
              <div className="text-sm text-gray-700 font-medium">Val Thorens</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Gare Routiere, Place des Arolles
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-orange-600 ring-2 ring-orange-200" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-700 font-medium">Geneva Airport</div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-3 text-xs text-gray-400">
          Shared Transfer · Fixed Point
        </div>
      </div>

      {/* Return flight */}
      <div className="ios-card overflow-hidden animate-fade-in-up stagger-4">
        <div className="bg-violet-50 px-4 py-3 flex items-center gap-2">
          <Plane size={16} className="text-violet-600 rotate-180" />
          <span className="font-bold text-violet-800 text-sm">טיסת חזור</span>
          <span className="text-xs text-violet-500 mr-auto" dir="ltr">
            יום ד׳ 04.03.2026
          </span>
        </div>
        <div className="p-4 space-y-0">
          {/* Geneva depart */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-violet-500 ring-2 ring-violet-200" />
              <div className="w-0.5 flex-1 bg-violet-200" />
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gray-900" dir="ltr">11:05</span>
                <span className="text-xs text-gray-400">Terminal 1</span>
              </div>
              <div className="text-sm text-gray-700 font-medium">Geneva Int. Airport</div>
              <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                <span dir="ltr" className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">A3855</span>
                <span>Aegean Airlines</span>
                <span>·</span>
                <span dir="ltr">2 שעות 45 דק׳</span>
              </div>
            </div>
          </div>

          {/* Athens */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200" />
              <div className="w-0.5 flex-1 bg-amber-200" />
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gray-900" dir="ltr">14:50</span>
                <span className="text-xs text-gray-400">Terminal 1</span>
              </div>
              <div className="text-sm text-gray-700 font-medium">Athens El. Venizelos</div>
              <div className="mt-1.5 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700 font-medium">
                <Clock size={12} className="inline ml-1" />
                המתנה שעה ו-20 דקות
              </div>
            </div>
          </div>

          {/* Leg 2 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-violet-500 ring-2 ring-violet-200" />
              <div className="w-0.5 flex-1 bg-violet-200" />
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gray-900" dir="ltr">16:10</span>
                <span className="text-xs text-gray-400">Terminal 1</span>
              </div>
              <div className="text-sm text-gray-700 font-medium">Athens El. Venizelos</div>
              <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                <span dir="ltr" className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">A3926</span>
                <span>Aegean Airlines</span>
                <span>·</span>
                <span dir="ltr">שעתיים</span>
              </div>
            </div>
          </div>

          {/* TLV arrival */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gray-900" dir="ltr">18:10</span>
                <span className="text-xs text-gray-400">Terminal 3</span>
              </div>
              <div className="text-sm text-gray-700 font-medium">Tel Aviv Ben Gurion</div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-3 text-xs text-gray-400">
          <span>ComfortFlex · Economy</span>
          <span dir="ltr">סה״כ 6:05 שעות</span>
        </div>
      </div>

      {/* People & Edit - collapsible */}
      <div className="ios-card overflow-hidden animate-fade-in-up stagger-5">
        <button
          onClick={() => setShowEdit(!showEdit)}
          className="w-full flex items-center justify-between px-4 py-3 active:bg-ios-gray6 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users size={16} className="text-ios-gray" />
            <span className="font-semibold text-[15px] text-ios-label">
              משתתפים ({trip.people.length})
            </span>
          </div>
          <div
            className={`transition-transform duration-200 ${
              showEdit ? 'rotate-180' : ''
            }`}
          >
            <ChevronDown size={16} className="text-ios-gray3" />
          </div>
        </button>

        {showEdit && (
          <div className="border-t border-ios-separator p-4 space-y-3 animate-slide-down">
            <div className="space-y-1">
              {trip.people.map((person, idx) => {
                const isMe = person.phone === session.phone;
                return (
                  <div
                    key={person.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                      isMe ? 'bg-ios-blue/8' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                          AVATAR_COLORS[idx % AVATAR_COLORS.length]
                        } flex items-center justify-center text-white text-[13px] font-bold`}
                      >
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-[15px] text-ios-label">
                          {person.name}
                          {isMe && (
                            <span className="text-[12px] text-ios-blue font-semibold mr-1">
                              {' '}(אתה)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1 text-[12px] text-ios-gray">
                          <Phone size={10} />
                          <span dir="ltr">{person.phone}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removePerson(person.id)}
                      className="text-ios-gray4 active:text-ios-red p-1 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="שם..."
                className="w-full bg-ios-gray6 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue/30 placeholder:text-ios-gray3 transition-all"
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={personPhone}
                  onChange={(e) => setPersonPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  placeholder="טלפון..."
                  dir="ltr"
                  className="flex-1 bg-ios-gray6 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue/30 placeholder:text-ios-gray3 transition-all text-left"
                />
                <button
                  onClick={addPerson}
                  className="bg-ios-blue text-white p-3 rounded-xl active:opacity-80 transition-opacity"
                >
                  <UserPlus size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
