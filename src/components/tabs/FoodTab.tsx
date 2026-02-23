import { useState, useEffect, useRef } from 'react';
import type { Trip, UserSession } from '../../types';
import {
  Star,
  MapPin,
  Navigation,
  UtensilsCrossed,
  Pizza,
  Beef,
  Coffee,
  Wine,
  Loader2,
  ExternalLink,
  Users,
} from 'lucide-react';

interface Props {
  trip: Trip;
  session: UserSession;
  onUpdate: (trip: Trip) => void;
}

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY as string;

interface GooglePlace {
  id: string;
  displayName: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  googleMapsUri?: string;
  photos?: { name: string; widthPx: number; heightPx: number }[];
  primaryTypeDisplayName?: { text: string };
  currentOpeningHours?: { openNow?: boolean };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}

const SEARCH_QUERIES: { value: string; label: string; query: string; icon: typeof UtensilsCrossed }[] = [
  { value: 'all', label: 'הכל', query: 'restaurants cafes bars Val Thorens France', icon: UtensilsCrossed },
  { value: 'restaurant', label: 'מסעדות', query: 'restaurant Val Thorens France', icon: UtensilsCrossed },
  { value: 'pizza', label: 'פיצה', query: 'pizza Val Thorens France', icon: Pizza },
  { value: 'meat', label: 'בשרים / גריל', query: 'steakhouse grill meat Val Thorens France', icon: Beef },
  { value: 'cafe', label: 'קפה / מאפה', query: 'cafe bakery Val Thorens France', icon: Coffee },
  { value: 'bar', label: 'בר / פאב', query: 'bar pub nightclub Val Thorens France', icon: Wine },
];

const PRICE_MAP: Record<string, string> = {
  PRICE_LEVEL_FREE: '',
  PRICE_LEVEL_INEXPENSIVE: '€',
  PRICE_LEVEL_MODERATE: '€€',
  PRICE_LEVEL_EXPENSIVE: '€€€',
  PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
};

function photoUrl(photoName: string, maxWidth = 400): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}

export function FoodTab({ trip: _trip, session: _session, onUpdate: _onUpdate }: Props) {
  const [places, setPlaces] = useState<GooglePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const cache = useRef<Record<string, GooglePlace[]>>({});

  void _trip; void _session; void _onUpdate;

  useEffect(() => {
    fetchPlaces(filter);
  }, [filter]);

  async function fetchPlaces(category: string) {
    const entry = SEARCH_QUERIES.find((q) => q.value === category) ?? SEARCH_QUERIES[0];

    if (cache.current[category]) {
      setPlaces(cache.current[category]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.rating',
            'places.userRatingCount',
            'places.priceLevel',
            'places.googleMapsUri',
            'places.photos',
            'places.primaryTypeDisplayName',
            'places.currentOpeningHours',
            'places.regularOpeningHours',
          ].join(','),
        },
        body: JSON.stringify({
          textQuery: entry.query,
          maxResultCount: 20,
          languageCode: 'en',
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      const results: GooglePlace[] = data.places ?? [];
      results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      cache.current[category] = results;
      setPlaces(results);
    } catch {
      setError('לא הצלחנו לטעון מסעדות. בדוק חיבור לאינטרנט.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide animate-fade-in-up">
        {SEARCH_QUERIES.map((sq) => {
          const Icon = sq.icon;
          const active = filter === sq.value;
          return (
            <button
              key={sq.value}
              onClick={() => setFilter(sq.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium transition-all ${
                active
                  ? 'bg-ios-blue text-white shadow-sm'
                  : 'bg-ios-card text-ios-gray active:bg-ios-gray5'
              }`}
            >
              <Icon size={14} />
              {sq.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 animate-fade-in">
          <Loader2 size={32} className="mx-auto text-ios-blue animate-spin" />
          <p className="text-sm text-ios-gray mt-3">טוען מסעדות...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 bg-ios-card rounded-3xl shadow-sm flex items-center justify-center">
            <UtensilsCrossed size={36} className="text-ios-gray3" />
          </div>
          <p className="text-sm text-ios-red">{error}</p>
          <button
            onClick={() => { cache.current = {}; fetchPlaces(filter); }}
            className="mt-3 text-ios-blue text-[15px] font-medium active:opacity-60"
          >
            נסה שוב
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && places.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 bg-ios-card rounded-3xl shadow-sm flex items-center justify-center">
            <UtensilsCrossed size={36} className="text-ios-gray3" />
          </div>
          <p className="text-lg font-medium text-ios-label4">לא נמצאו תוצאות</p>
          <p className="text-sm text-ios-gray mt-1">נסה סינון אחר</p>
        </div>
      )}

      {/* Restaurant cards */}
      {!loading && !error && places.length > 0 && (
        <div className="space-y-3 animate-fade-in-up stagger-1">
          {places.map((place) => {
            const photo = place.photos?.[0];
            const price = place.priceLevel ? PRICE_MAP[place.priceLevel] : '';
            const isOpen = place.currentOpeningHours?.openNow;
            const expanded = expandedId === place.id;

            return (
              <div key={place.id} className="ios-card overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : place.id)}
                  className="w-full text-right active:bg-ios-gray6 transition-colors"
                >
                  <div className="flex gap-3 p-3">
                    {/* Photo */}
                    {photo ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-ios-gray5 shrink-0">
                        <img
                          src={photoUrl(photo.name)}
                          alt={place.displayName.text}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-ios-gray5 flex items-center justify-center shrink-0">
                        <UtensilsCrossed size={24} className="text-ios-gray3" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-[15px] text-ios-label leading-tight line-clamp-2">
                          {place.displayName.text}
                        </h3>
                        {price && (
                          <span className="text-[13px] text-ios-gray font-medium shrink-0">{price}</span>
                        )}
                      </div>

                      {/* Rating row */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {place.rating && (
                          <>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={11}
                                  className={s <= Math.round(place.rating!) ? 'text-amber-400' : 'text-ios-gray4'}
                                  fill={s <= Math.round(place.rating!) ? 'currentColor' : 'none'}
                                />
                              ))}
                            </div>
                            <span className="text-[12px] font-semibold text-ios-label">{place.rating}</span>
                          </>
                        )}
                        {place.userRatingCount != null && (
                          <span className="text-[11px] text-ios-gray" dir="ltr">
                            ({place.userRatingCount.toLocaleString()})
                          </span>
                        )}
                      </div>

                      {/* Type + open status */}
                      <div className="flex items-center gap-2 mt-1">
                        {place.primaryTypeDisplayName && (
                          <span className="text-[12px] text-ios-gray truncate">
                            {place.primaryTypeDisplayName.text}
                          </span>
                        )}
                        {isOpen !== undefined && (
                          <span className={`text-[11px] font-semibold shrink-0 ${isOpen ? 'text-green-500' : 'text-ios-red'}`}>
                            {isOpen ? 'פתוח' : 'סגור'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-ios-separator bg-ios-gray6 px-4 py-3 space-y-3 animate-slide-down">
                    {/* Address */}
                    {place.formattedAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-ios-gray3 shrink-0 mt-0.5" />
                        <p className="text-[13px] text-ios-gray leading-snug">{place.formattedAddress}</p>
                      </div>
                    )}

                    {/* Opening hours */}
                    {place.regularOpeningHours?.weekdayDescriptions && (
                      <div className="text-[12px] text-ios-gray space-y-0.5">
                        {place.regularOpeningHours.weekdayDescriptions.map((line, i) => (
                          <p key={i} dir="ltr" className="text-left">{line}</p>
                        ))}
                      </div>
                    )}

                    {/* Rating detail */}
                    {place.userRatingCount != null && (
                      <div className="flex items-center gap-1.5 text-[13px] text-ios-gray">
                        <Users size={13} />
                        <span dir="ltr">{place.userRatingCount.toLocaleString()}</span> ביקורות
                      </div>
                    )}

                    {/* More photos */}
                    {place.photos && place.photos.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide">
                        {place.photos.slice(1, 6).map((p, i) => (
                          <img
                            key={i}
                            src={photoUrl(p.name, 300)}
                            alt=""
                            className="w-28 h-20 rounded-lg object-cover shrink-0"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {place.googleMapsUri && (
                        <a
                          href={place.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-ios-blue text-white text-[14px] font-semibold rounded-xl active:opacity-80 transition-opacity"
                        >
                          <Navigation size={15} />
                          פתח במפות
                        </a>
                      )}
                      {place.googleMapsUri && (
                        <a
                          href={place.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-ios-card text-ios-blue text-[14px] font-semibold rounded-xl active:bg-ios-gray5 transition-colors"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
