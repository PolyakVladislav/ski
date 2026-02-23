import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Trip, PackingItem, UserSession } from './types';

const SESSION_KEY = 'ski-user-session';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---- Session (localStorage only for user identity) ----

export function getSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ---- Default packing items ----

const SHARED_ITEMS: Omit<PackingItem, 'id' | 'checked' | 'assignedTo'>[] = [
  { category: 'מסמכים משותפים', name: 'הזמנת מלון / צימר' },
  { category: 'מסמכים משותפים', name: 'הזמנת רכב' },
  { category: 'מסמכים משותפים', name: 'כתובות ומפות' },
  { category: 'ציוד משותף', name: 'ערכת עזרה ראשונה' },
  { category: 'ציוד משותף', name: 'משחקי קלפים / קופסא' },
  { category: 'ציוד משותף', name: 'רמקול בלוטוס' },
  { category: 'ציוד משותף', name: 'מפצל / שנאי חשמל' },
  { category: 'אוכל ושתייה', name: 'חטיפים לדרך' },
  { category: 'אוכל ושתייה', name: 'תה / קפה' },
  { category: 'אוכל ושתייה', name: 'תרמוס' },
];

const PERSONAL_ITEMS: Omit<PackingItem, 'id' | 'checked' | 'assignedTo'>[] = [
  { category: 'מסמכים', name: 'דרכון' },
  { category: 'מסמכים', name: 'ביטוח נסיעות' },
  { category: 'מסמכים', name: 'כרטיס טיסה' },
  { category: 'ביגוד', name: 'תרמית עליונה' },
  { category: 'ביגוד', name: 'תרמית תחתונה' },
  { category: 'ביגוד', name: 'מעיל סקי' },
  { category: 'ביגוד', name: 'מכנסי סקי' },
  { category: 'ביגוד', name: 'גרביים תרמיות (x2)' },
  { category: 'ביגוד', name: 'כפפות' },
  { category: 'ביגוד', name: 'כובע / צוואר' },
  { category: 'ביגוד', name: 'בגדי החלפה' },
  { category: 'ביגוד', name: 'פיג׳מה' },
  { category: 'ציוד סקי', name: 'קסדה' },
  { category: 'ציוד סקי', name: 'משקפי סקי' },
  { category: 'ציוד סקי', name: 'סקי פס' },
  { category: 'ביגוד', name: 'נעליים חמות / מגפיים' },
  { category: 'ביגוד', name: 'סנדלים / כפכפים (למלון)' },
  { category: 'טיפוח ובריאות', name: 'קרם הגנה' },
  { category: 'טיפוח ובריאות', name: 'שפתון הגנה' },
  { category: 'טיפוח ובריאות', name: 'משככי כאבים' },
  { category: 'טיפוח ובריאות', name: 'מברשת שיניים + משחה' },
  { category: 'טיפוח ובריאות', name: 'דאודורנט' },
  { category: 'טיפוח ובריאות', name: 'מגבת' },
  { category: 'טכנולוגיה', name: 'מטען טלפון' },
  { category: 'טכנולוגיה', name: 'אוזניות' },
  { category: 'טכנולוגיה', name: 'סוללה ניידת' },
  { category: 'טכנולוגיה', name: 'מתאם חשמל (אירופאי)' },
  { category: 'טכנולוגיה', name: 'GoPro / מצלמה' },
  { category: 'אלכוהול ונשנושים', name: 'פלאסק לוויסקי' },
  { category: 'אלכוהול ונשנושים', name: 'בקבוק אלכוהול' },
  { category: 'אלכוהול ונשנושים', name: 'חטיפים / אנרגיה' },
  { category: 'שונות', name: 'מזומן (יורו)' },
  { category: 'שונות', name: 'כרטיס אשראי' },
  { category: 'שונות', name: 'משקפי שמש' },
  { category: 'שונות', name: 'תיק גב קטן' },
  { category: 'שונות', name: 'שקית ניילון לבגדים רטובים' },
];

export function createDefaultSharedItems(): PackingItem[] {
  return SHARED_ITEMS.map((item) => ({
    ...item,
    id: generateId(),
    checked: false,
  }));
}

export function createPersonalItems(personId: string): PackingItem[] {
  return PERSONAL_ITEMS.map((item) => ({
    ...item,
    id: generateId(),
    checked: false,
    assignedTo: personId,
  }));
}

// ---- Firestore hooks ----

export function useTrip(tripId: string | null) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(!!tripId);

  useEffect(() => {
    if (!tripId) return;
    const unsubscribe = onSnapshot(
      doc(db, 'trips', tripId),
      (snap) => {
        if (snap.exists()) {
          setTrip({ id: snap.id, ...snap.data() } as Trip);
        } else {
          setTrip(null);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, [tripId]);

  const updateTrip = useCallback(
    async (updated: Trip) => {
      const { id, ...data } = updated;
      await setDoc(doc(db, 'trips', id), data);
    },
    []
  );

  return { trip, loading, updateTrip };
}

export function useTripList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'trips'), (snapshot) => {
      const list = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Trip
      );
      setTrips(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addTrip = useCallback(async (trip: Trip) => {
    const { id, ...data } = trip;
    await setDoc(doc(db, 'trips', id), data);
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'trips', id));
  }, []);

  return { trips, loading, addTrip, deleteTrip };
}

// Keep getDocs for one-off fetches
export async function fetchTrip(tripId: string): Promise<Trip | null> {
  const snap = await getDocs(collection(db, 'trips'));
  const found = snap.docs.find((d) => d.id === tripId);
  if (!found) return null;
  return { id: found.id, ...found.data() } as Trip;
}
