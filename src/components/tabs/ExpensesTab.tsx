import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Trip, Expense, UserSession } from '../../types';
import { generateId } from '../../store';
import { ExpenseCharts } from '../ExpenseCharts';
import { SwipeRow } from '../SwipeRow';
import { ConfirmSheet } from '../ConfirmSheet';
import {
  Plus,
  Trash2,
  Receipt,
  TrendingUp,
  Coffee,
  UtensilsCrossed,
  Wine,
  Ticket,
  ShoppingBag,
  Hotel,
  Pencil,
  Shield,
  Plane,
  Bus,
  ChevronDown,
  Snowflake,
  CheckCircle,
  Check,
  ChevronLeft,
  Smartphone,
} from 'lucide-react';

interface Props {
  trip: Trip;
  session: UserSession;
  onUpdate: (trip: Trip) => void;
}

interface Debt {
  from: string;
  to: string;
  amount: number;
}

const DEFAULT_EUR_ILS = 3.67;
const DEFAULT_USD_ILS = 3.10;

type Currency = 'EUR' | 'ILS' | 'USD';

interface Rates {
  eurIls: number;
  usdIls: number;
}

function toEur(amount: number, currency: Currency, r: Rates): number {
  if (currency === 'EUR') return amount;
  if (currency === 'ILS') return amount / r.eurIls;
  return amount * (r.usdIls / r.eurIls);
}

function toIls(amount: number, currency: Currency, r: Rates): number {
  if (currency === 'ILS') return amount;
  if (currency === 'EUR') return amount * r.eurIls;
  return amount * r.usdIls;
}

function currencySymbol(c: Currency): string {
  if (c === 'EUR') return '€';
  if (c === 'USD') return '$';
  return '₪';
}

const CURRENCY_ORDER: Currency[] = ['EUR', 'ILS', 'USD'];
function nextCurrency(c: Currency): Currency {
  const idx = CURRENCY_ORDER.indexOf(c);
  return CURRENCY_ORDER[(idx + 1) % CURRENCY_ORDER.length];
}

interface FixedCostDef {
  type: string;
  label: string;
  icon: typeof Hotel;
  color: string;
  shared: boolean;
}

const FIXED_COSTS: FixedCostDef[] = [
  { type: 'apartment', label: 'דירה', icon: Hotel, color: 'from-teal-400 to-emerald-500', shared: true },
  { type: 'tickets', label: 'כרטיסי טיסה', icon: Plane, color: 'from-sky-400 to-blue-500', shared: false },
  { type: 'insurance', label: 'ביטוח', icon: Shield, color: 'from-violet-400 to-purple-500', shared: false },
  { type: 'transfer', label: 'הסעה', icon: Bus, color: 'from-orange-400 to-amber-500', shared: false },
  { type: 'skipass', label: 'סקי פס', icon: Ticket, color: 'from-cyan-400 to-sky-500', shared: false },
  { type: 'rental', label: 'השכרת ציוד', icon: Snowflake, color: 'from-indigo-400 to-blue-500', shared: false },
  { type: 'esim', label: 'e-SIM', icon: Smartphone, color: 'from-lime-400 to-green-500', shared: false },
];

interface PurchaseTemplate {
  label: string;
  icon: typeof Coffee;
  color: string;
}

const PURCHASE_TEMPLATES: PurchaseTemplate[] = [
  { label: 'ארוחת בוקר', icon: Coffee, color: 'from-amber-400 to-orange-400' },
  { label: 'ארוחת צהריים', icon: UtensilsCrossed, color: 'from-green-400 to-emerald-500' },
  { label: 'ארוחת ערב', icon: UtensilsCrossed, color: 'from-indigo-400 to-blue-500' },
  { label: 'חטיף / פרקוס', icon: ShoppingBag, color: 'from-pink-400 to-rose-500' },
  { label: 'שתייה / אלכוהול', icon: Wine, color: 'from-purple-400 to-violet-500' },
  { label: 'סופר / קניות', icon: ShoppingBag, color: 'from-rose-400 to-red-500' },
];

const AVATAR_COLORS = [
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-green-500',
  'from-cyan-400 to-teal-500',
];

function getExpRates(exp: Expense, fallback: Rates): Rates {
  return {
    eurIls: exp.rateEurIls ?? fallback.eurIls,
    usdIls: exp.rateUsdIls ?? fallback.usdIls,
  };
}

function getPayers(paidBy: string | string[]): string[] {
  return Array.isArray(paidBy) ? paidBy : [paidBy];
}

function calculateDebts(trip: Trip, fallback: Rates): Debt[] {
  const balances = new Map<string, number>();
  trip.people.forEach((p) => balances.set(p.id, 0));

  for (const exp of trip.expenses) {
    if (exp.fixedType === 'apartment') continue;
    const r = getExpRates(exp, fallback);
    const amountEur = toEur(exp.amount, exp.currency ?? 'ILS', r);
    const payers = getPayers(exp.paidBy);
    const perPayer = amountEur / payers.length;
    const share = amountEur / exp.splitBetween.length;
    for (const payer of payers) {
      balances.set(payer, (balances.get(payer) ?? 0) + perPayer);
    }
    for (const pid of exp.splitBetween) {
      balances.set(pid, (balances.get(pid) ?? 0) - share);
    }
  }

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, bal] of balances) {
    if (bal < -0.01) debtors.push({ id, amount: -bal });
    else if (bal > 0.01) creditors.push({ id, amount: bal });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts: Debt[] = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const transfer = Math.min(debtors[di].amount, creditors[ci].amount);
    if (transfer > 0.01) {
      debts.push({
        from: debtors[di].id,
        to: creditors[ci].id,
        amount: Math.round(transfer * 100) / 100,
      });
    }
    debtors[di].amount -= transfer;
    creditors[ci].amount -= transfer;
    if (debtors[di].amount < 0.01) di++;
    if (creditors[ci].amount < 0.01) ci++;
  }

  return debts;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

function fmtEur(n: number): string {
  return `€${Math.round(n).toLocaleString()}`;
}

function fmtIls(n: number): string {
  return `₪${Math.round(n).toLocaleString()}`;
}

function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtAmount(n: number, currency: Currency): string {
  if (currency === 'EUR') return fmtEur(n);
  if (currency === 'USD') return fmtUsd(n);
  return fmtIls(n);
}

function fmtSecondary(amount: number, currency: Currency, r: Rates): string {
  const eur = toEur(amount, currency, r);
  if (currency === 'EUR') return fmtIls(eur * r.eurIls);
  return fmtEur(eur);
}

function formatConversion(amount: number, from: Currency, r: Rates): string {
  const eur = toEur(amount, from, r);
  const ils = toIls(amount, from, r);
  const parts: string[] = [];
  if (from !== 'EUR') parts.push(fmtEur(eur));
  if (from !== 'ILS') parts.push(fmtIls(ils));
  if (from !== 'USD') parts.push(fmtUsd(eur * r.eurIls / r.usdIls));
  return parts.join(' · ');
}

export function ExpensesTab({ trip, session, onUpdate }: Props) {
  const [activeTemplate, setActiveTemplate] = useState<PurchaseTemplate | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [paidBy, setPaidBy] = useState<string[]>([]);
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [validationError, setValidationError] = useState('');
  const [fixedInputs, setFixedInputs] = useState<Record<string, string>>({});
  const [fixedCurrencies, setFixedCurrencies] = useState<Record<string, Currency>>({});
  const [expandedFixed, setExpandedFixed] = useState<Set<string>>(new Set());
  const [showFixedCosts, setShowFixedCosts] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState<Currency>('EUR');
  const [editDesc, setEditDesc] = useState('');
  const [editPaidBy, setEditPaidBy] = useState<string[]>([]);
  const [editSplit, setEditSplit] = useState<string[]>([]);
  const [liveRates, setLiveRates] = useState<Rates>({ eurIls: DEFAULT_EUR_ILS, usdIls: DEFAULT_USD_ILS });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/EUR')
      .then((res) => res.json())
      .then((data) => {
        if (data.rates?.ILS && data.rates?.USD) {
          setLiveRates({
            eurIls: data.rates.ILS,
            usdIls: data.rates.ILS / data.rates.USD,
          });
        }
      })
      .catch(() => {});
  }, []);

  const totalEur = trip.expenses.reduce(
    (s, e) => s + toEur(e.amount, e.currency ?? 'ILS', getExpRates(e, liveRates)),
    0
  );
  const totalIls = totalEur * liveRates.eurIls;

  const me = trip.people.find((p) => p.phone === session.phone);
  const myEur = me
    ? trip.expenses.reduce((s, e) => {
        if (!e.splitBetween?.includes(me.id)) return s;
        const eurVal = toEur(e.amount, e.currency ?? 'ILS', getExpRates(e, liveRates));
        return s + eurVal / e.splitBetween.length;
      }, 0)
    : 0;

  const debts = calculateDebts(trip, liveRates);
  const showForm = activeTemplate !== null || customMode;

  function openAddModal() {
    resetForm();
    setShowAddModal(true);
  }

  function closeAddModal() {
    resetForm();
    setShowAddModal(false);
  }

  function getPersonName(id: string): string {
    return trip.people.find((p) => p.id === id)?.name ?? '?';
  }


  function toggleSplit(id: string) {
    setSplitBetween((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function openForm(template: PurchaseTemplate | null) {
    const firstPerson = trip.people[0]?.id;
    setActiveTemplate(template);
    setCustomMode(!template);
    setSplitBetween(trip.people.map((p) => p.id));
    setPaidBy(firstPerson ? [firstPerson] : []);
    setAmount('');
    setCurrency('EUR');
    setDesc('');
    setValidationError('');
  }

  function togglePaidBy(id: string) {
    setPaidBy((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function submitExpense(): boolean {
    const description = activeTemplate ? activeTemplate.label : desc.trim();
    if (!description) {
      setValidationError('הזן תיאור');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setValidationError('הזן סכום');
      return false;
    }
    if (paidBy.length === 0) {
      setValidationError('בחר מי שילם');
      return false;
    }
    if (splitBetween.length === 0) {
      setValidationError('בחר על מי לחלק');
      return false;
    }
    setValidationError('');
    const expense: Expense = {
      id: generateId(),
      description,
      amount: parseFloat(amount),
      currency,
      paidBy: paidBy.length === 1 ? paidBy[0] : paidBy,
      splitBetween,
      date: new Date().toISOString(),
      rateEurIls: liveRates.eurIls,
      rateUsdIls: liveRates.usdIls,
    };
    onUpdate({ ...trip, expenses: [...trip.expenses, expense] });
    resetForm();
    return true;
  }

  function resetForm() {
    setActiveTemplate(null);
    setCustomMode(false);
    setDesc('');
    setAmount('');
    setCurrency('EUR');
    setPaidBy([]);
    setSplitBetween([]);
    setValidationError('');
  }

  function removeExpense(id: string) {
    onUpdate({
      ...trip,
      expenses: trip.expenses.filter((e) => e.id !== id),
    });
    if (expandedPurchase === id) setExpandedPurchase(null);
  }

  function startEdit(exp: Expense) {
    setEditingExpense(exp.id);
    setEditDesc(exp.description);
    setEditAmount(String(exp.amount));
    setEditCurrency(exp.currency ?? 'EUR');
    setEditPaidBy(getPayers(exp.paidBy));
    setEditSplit([...exp.splitBetween]);
  }

  function saveEdit() {
    if (!editingExpense) return;
    const val = parseFloat(editAmount);
    if (!editDesc.trim() || isNaN(val) || val <= 0 || editPaidBy.length === 0 || editSplit.length === 0) return;
    onUpdate({
      ...trip,
      expenses: trip.expenses.map((e) =>
        e.id === editingExpense
          ? {
              ...e,
              description: editDesc.trim(),
              amount: val,
              currency: editCurrency,
              paidBy: editPaidBy.length === 1 ? editPaidBy[0] : editPaidBy,
              splitBetween: editSplit,
            }
          : e
      ),
    });
    setEditingExpense(null);
  }

  function cancelEdit() {
    setEditingExpense(null);
  }

  function fixedKey(type: string, personId?: string): string {
    return personId ? `${type}:${personId}` : type;
  }

  function matchesPayer(paidBy: string | string[], personId: string): boolean {
    return Array.isArray(paidBy) ? paidBy.includes(personId) : paidBy === personId;
  }

  function saveFixedExpense(
    def: FixedCostDef,
    personId: string | undefined,
    inputKey: string,
    cur: Currency
  ) {
    const raw = fixedInputs[inputKey];
    const val = parseFloat(raw);
    if (!raw || isNaN(val) || val <= 0) return;

    const existing = trip.expenses.find(
      (e) =>
        e.fixedType === def.type &&
        (personId ? matchesPayer(e.paidBy, personId) : e.splitBetween.length === trip.people.length)
    );

    if (existing) {
      onUpdate({
        ...trip,
        expenses: trip.expenses.map((e) =>
          e.id === existing.id
            ? {
                ...e,
                amount: val,
                currency: cur,
                rateEurIls: liveRates.eurIls,
                rateUsdIls: liveRates.usdIls,
                splitBetween: def.shared
                  ? trip.people.map((p) => p.id)
                  : [personId!],
              }
            : e
        ),
      });
    } else {
      const expense: Expense = {
        id: generateId(),
        description: def.label,
        amount: val,
        currency: cur,
        paidBy: personId ?? trip.people[0]?.id ?? '',
        splitBetween: def.shared
          ? trip.people.map((p) => p.id)
          : [personId!],
        date: new Date().toISOString(),
        fixedType: def.type,
        rateEurIls: liveRates.eurIls,
        rateUsdIls: liveRates.usdIls,
      };
      onUpdate({ ...trip, expenses: [...trip.expenses, expense] });
    }

    setFixedInputs((prev) => {
      const next = { ...prev };
      delete next[inputKey];
      return next;
    });
  }

  function toggleFixed(type: string) {
    setExpandedFixed((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  if (trip.people.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-4 bg-ios-card rounded-3xl shadow-sm flex items-center justify-center">
          <Receipt size={36} className="text-ios-gray3" />
        </div>
        <p className="text-lg font-medium text-ios-label4 mb-1">
          אין משתתפים עדיין
        </p>
        <p className="text-sm text-ios-gray">
          הוסף משתתפים בטאב &quot;טיול&quot; כדי לנהל הוצאות
        </p>
      </div>
    );
  }

  const fixedExpenses = trip.expenses.filter((e) => e.fixedType);
  const purchaseExpenses = trip.expenses.filter((e) => !e.fixedType);

  const purchaseTotalEur = purchaseExpenses.reduce(
    (s, e) => s + toEur(e.amount, e.currency ?? 'ILS', getExpRates(e, liveRates)),
    0
  );

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-bl from-mountain to-mountain-light rounded-xl p-4 text-center animate-fade-in-up">
          <div className="text-2xl font-bold text-white" dir="ltr">
            {fmtEur(totalEur)}
          </div>
          <div className="text-xs text-white/50 mt-0.5" dir="ltr">
            {fmtIls(totalIls)}
          </div>
          <div className="text-xs text-white/60 mt-1">סך הכל</div>
        </div>
        <div className="ios-card p-4 text-center animate-fade-in-up stagger-1">
          <div className="text-2xl font-bold text-ios-blue" dir="ltr">
            {fmtEur(myEur)}
          </div>
          <div className="text-xs text-ios-gray3 mt-0.5" dir="ltr">
            {fmtIls(myEur * liveRates.eurIls)}
          </div>
          <div className="text-xs text-ios-gray mt-1">ההוצאות שלי</div>
        </div>
      </div>

      {/* Charts */}
      <ExpenseCharts trip={trip} rates={liveRates} />

      {/* 3. Fixed Costs */}
      <div className="animate-fade-in-up stagger-3">
        <button
          onClick={() => setShowFixedCosts(!showFixedCosts)}
          className={`w-full flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
            showFixedCosts ? 'mb-3' : 'ios-card'
          }`}
        >
          <h3 className={`text-sm font-semibold ${showFixedCosts ? 'text-ios-gray' : 'text-ios-label'}`}>
            עלויות הטיול
          </h3>
          <div
            className={`transition-transform duration-200 ${
              showFixedCosts ? 'rotate-180' : ''
            }`}
          >
            <ChevronDown size={16} className={showFixedCosts ? 'text-ios-gray3' : 'text-ios-blue'} />
          </div>
        </button>
        {showFixedCosts && <div className="space-y-2 animate-slide-down">
          {FIXED_COSTS.map((def) => {
            const Icon = def.icon;
            const isExpanded = expandedFixed.has(def.type);

            if (def.shared) {
              const existing = trip.expenses.find(
                (e) => e.fixedType === def.type
              );
              const iKey = fixedKey(def.type);
              const inputVal = fixedInputs[iKey] ?? '';
              const hasSaved = !!existing;

              return (
                <div
                  key={def.type}
                  className="ios-card overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${def.color} flex items-center justify-center text-white shrink-0 shadow-sm`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ios-label text-sm">
                        {def.label}
                      </div>
                      <div className="text-xs text-ios-gray">
                        מחולק על כולם
                      </div>
                    </div>
                    {hasSaved ? (
                      <div className="text-left">
                        <div className="font-bold text-ios-label text-sm" dir="ltr">
                          {fmtAmount(existing!.amount, existing!.currency ?? 'ILS')}
                        </div>
                        <div className="text-xs text-ios-gray" dir="ltr">
                          {fmtSecondary(existing!.amount, existing!.currency ?? 'ILS', getExpRates(existing!, liveRates))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="decimal"
                            value={inputVal}
                            onChange={(e) =>
                              setFixedInputs((p) => ({
                                ...p,
                                [iKey]: e.target.value,
                              }))
                            }
                            placeholder="0"
                            dir="ltr"
                            className="w-24 bg-ios-gray6 rounded-xl px-3 py-2 text-sm text-left font-bold focus:outline-none focus:ring-2 focus:ring-ios-blue/30 placeholder:text-ios-gray3"
                          />
                          <MiniCurrencyToggle
                            currency={fixedCurrencies[iKey] ?? 'EUR'}
                            onChange={(c) =>
                              setFixedCurrencies((p) => ({ ...p, [iKey]: c }))
                            }
                          />
                          <button
                            onClick={() =>
                              saveFixedExpense(def, undefined, iKey, fixedCurrencies[iKey] ?? 'EUR')
                            }
                            className="bg-ios-blue text-white p-2 rounded-xl active:opacity-80 transition-all"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        {inputVal && parseFloat(inputVal) > 0 && (
                          <div className="text-xs text-ios-gray mt-1 text-left" dir="ltr">
                            {formatConversion(parseFloat(inputVal), fixedCurrencies[iKey] ?? 'EUR', liveRates)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {hasSaved && (
                    <div className="border-t border-ios-separator px-4 py-2 flex justify-between items-center">
                      <span className="text-xs text-ios-gray">
                        לאדם:{' '}
                        <span className="font-semibold text-ios-label" dir="ltr">
                          {fmtEur(
                            toEur(existing!.amount, existing!.currency ?? 'ILS', getExpRates(existing!, liveRates)) /
                              trip.people.length
                          )}
                        </span>
                        <span className="text-ios-gray3 mr-1" dir="ltr">
                          (
                          {fmtIls(
                            toIls(existing!.amount, existing!.currency ?? 'ILS', getExpRates(existing!, liveRates)) /
                              trip.people.length
                          )}
                          )
                        </span>
                      </span>
                      <button
                        onClick={() => removeExpense(existing!.id)}
                        className="text-ios-gray3 active:text-ios-red p-1 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={def.type}
                className="ios-card overflow-hidden"
              >
                <button
                  onClick={() => toggleFixed(def.type)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-ios-gray6 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${def.color} flex items-center justify-center text-white shrink-0 shadow-sm`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="font-semibold text-ios-label text-sm">
                      {def.label}
                    </div>
                    <div className="text-xs text-ios-gray">אישי לכל משתתף</div>
                  </div>
                  <PersonalFixedSummary
                    trip={trip}
                    fixedType={def.type}
                    rates={liveRates}
                  />
                  <div
                    className={`transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    <ChevronDown size={16} className="text-ios-gray3" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-ios-separator animate-slide-down">
                    {trip.people.map((person, idx) => {
                      const existing = trip.expenses.find(
                        (e) =>
                          e.fixedType === def.type && matchesPayer(e.paidBy, person.id)
                      );
                      const iKey = fixedKey(def.type, person.id);
                      const inputVal = fixedInputs[iKey] ?? '';
                      const hasSaved = !!existing;

                      return (
                        <div
                          key={person.id}
                          className="flex items-center gap-3 px-4 py-3 border-b border-ios-separator last:border-b-0"
                        >
                          <div
                            className={`w-7 h-7 rounded-full bg-gradient-to-br ${
                              AVATAR_COLORS[idx % AVATAR_COLORS.length]
                            } flex items-center justify-center text-white text-xs font-bold shrink-0`}
                          >
                            {person.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-ios-label flex-1 truncate">
                            {person.name}
                            {person.phone === session.phone && (
                              <span className="text-xs text-ios-blue mr-1">
                                {' '}
                                (אתה)
                              </span>
                            )}
                          </span>
                          {hasSaved ? (
                            <div className="flex items-center gap-2">
                              <div className="text-left">
                                <span
                                  className="font-bold text-ios-label text-sm"
                                  dir="ltr"
                                >
                                  {fmtAmount(existing!.amount, existing!.currency ?? 'ILS')}
                                </span>
                                <span
                                  className="text-xs text-ios-gray block"
                                  dir="ltr"
                                >
                                  {fmtSecondary(existing!.amount, existing!.currency ?? 'ILS', getExpRates(existing!, liveRates))}
                                </span>
                              </div>
                              <button
                                onClick={() => removeExpense(existing!.id)}
                                className="text-ios-gray3 active:text-ios-red p-1 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                inputMode="decimal"
                                value={inputVal}
                                onChange={(e) =>
                                  setFixedInputs((p) => ({
                                    ...p,
                                    [iKey]: e.target.value,
                                  }))
                                }
                                placeholder="0"
                                dir="ltr"
                                className="w-20 bg-ios-gray6 rounded-xl px-3 py-2 text-sm text-left font-bold focus:outline-none focus:ring-2 focus:ring-ios-blue/30 placeholder:text-ios-gray3"
                              />
                              <MiniCurrencyToggle
                                currency={fixedCurrencies[iKey] ?? 'EUR'}
                                onChange={(c) =>
                                  setFixedCurrencies((p) => ({ ...p, [iKey]: c }))
                                }
                              />
                              <button
                                onClick={() =>
                                  saveFixedExpense(
                                    def,
                                    person.id,
                                    iKey,
                                    fixedCurrencies[iKey] ?? 'EUR'
                                  )
                                }
                                className="bg-ios-blue text-white p-1.5 rounded-lg active:opacity-80 transition-all"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>}
      </div>

      {/* 4. Debts */}
      {trip.expenses.length > 0 && (
        <div className="ios-card overflow-hidden animate-fade-in-up stagger-4">
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
            <TrendingUp size={14} className="text-ios-blue" />
            <h3 className="text-xs font-semibold text-ios-gray">
              מאזן חובות
            </h3>
          </div>
          {debts.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-4 pb-4 pt-1 text-ios-green">
              <CheckCircle size={18} />
              <span className="font-semibold text-sm">הכל מאוזן!</span>
            </div>
          ) : (
            <div>
              {debts.map((d, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-ios-separator' : ''}`}
                >
                  <div className="text-[14px] text-ios-label">
                    <span className="font-semibold">{getPersonName(d.from)}</span>
                    <span className="text-ios-gray mx-1">←</span>
                    <span className="font-semibold">{getPersonName(d.to)}</span>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-[15px] font-bold text-ios-red" dir="ltr">
                      {fmtEur(d.amount)}
                    </div>
                    <div className="text-[11px] text-ios-gray" dir="ltr">
                      {fmtIls(d.amount * liveRates.eurIls)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Purchase history */}
      {purchaseExpenses.length > 0 && (
        <div className="animate-fade-in-up stagger-5">
          <h3 className="text-xs font-semibold text-ios-gray mb-3 flex items-center gap-1.5">
            רכישות
            <span className="text-ios-gray3" dir="ltr">
              {fmtEur(purchaseTotalEur)}
            </span>
          </h3>
          <div className="ios-card overflow-hidden">
            {[...purchaseExpenses].reverse().map((exp, i) => {
              const amtEur = toEur(exp.amount, exp.currency ?? 'ILS', getExpRates(exp, liveRates));
              const isOpen = expandedPurchase === exp.id;
              const isEditing = editingExpense === exp.id;
              const payers = getPayers(exp.paidBy);
              const payerNames = payers.map(getPersonName).join(', ');

              return (
                <div key={exp.id} className={i > 0 ? 'border-t border-ios-separator' : ''}>
                  <SwipeRow onDelete={() => setConfirmDelete(exp.id)}>
                  {/* Compact row */}
                  <button
                    onClick={() => setExpandedPurchase(isOpen ? null : exp.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 active:bg-ios-gray6 transition-colors text-right"
                  >
                    <div className="flex-1 min-w-0 flex items-baseline gap-2">
                      <span className="text-[14px] text-ios-label truncate">{exp.description}</span>
                      <span className="text-[11px] text-ios-gray shrink-0">
                        {formatDate(exp.date)}
                      </span>
                    </div>
                    <div className="shrink-0 ms-3 flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-ios-label" dir="ltr">
                        {fmtEur(amtEur)}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-ios-gray3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="bg-ios-gray6 px-4 py-3 space-y-2.5 animate-slide-down">
                      {!isEditing ? (
                        <>
                          <div className="flex justify-between text-[13px]">
                            <span className="text-ios-gray">סכום</span>
                            <span className="text-ios-label font-medium" dir="ltr">
                              {fmtEur(amtEur)}
                              <span className="text-ios-gray mr-1">({fmtIls(toIls(exp.amount, exp.currency ?? 'ILS', getExpRates(exp, liveRates)))})</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-[13px]">
                            <span className="text-ios-gray">שילמו</span>
                            <span className="text-ios-label font-medium">{payerNames}</span>
                          </div>
                          <div className="flex justify-between text-[13px]">
                            <span className="text-ios-gray">מחולק בין</span>
                            <span className="text-ios-label font-medium">
                              {exp.splitBetween.length === trip.people.length
                                ? 'כולם'
                                : exp.splitBetween.map(getPersonName).join(', ')}
                            </span>
                          </div>
                          {exp.splitBetween.length > 0 && (
                            <div className="flex justify-between text-[13px]">
                              <span className="text-ios-gray">לאדם</span>
                              <span className="text-ios-label font-medium" dir="ltr">
                                {fmtEur(amtEur / exp.splitBetween.length)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-[13px]">
                            <span className="text-ios-gray">תאריך</span>
                            <span className="text-ios-label font-medium" dir="ltr">
                              {formatDate(exp.date)} {formatTime(exp.date)}
                            </span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => startEdit(exp)}
                              className="flex-1 text-center text-[13px] font-semibold text-ios-blue py-2 rounded-lg bg-ios-card active:bg-ios-gray5 transition-colors"
                            >
                              ערוך
                            </button>
                            <button
                              onClick={() => removeExpense(exp.id)}
                              className="flex-1 text-center text-[13px] font-semibold text-ios-red py-2 rounded-lg bg-ios-card active:bg-ios-gray5 transition-colors"
                            >
                              מחק
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3 animate-fade-in">
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full bg-ios-card rounded-lg px-3 py-2 text-[14px] text-ios-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              dir="ltr"
                              className="flex-1 bg-ios-card rounded-lg px-3 py-2 text-[14px] text-ios-label text-left font-semibold focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
                            />
                            <MiniCurrencyToggle currency={editCurrency} onChange={setEditCurrency} />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-ios-gray mb-1.5">שילמו</p>
                            <div className="flex flex-wrap gap-1.5">
                              {trip.people.map((p) => {
                                const sel = editPaidBy.includes(p.id);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => setEditPaidBy((prev) => sel ? prev.filter((x) => x !== p.id) : [...prev, p.id])}
                                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                                      sel ? 'bg-ios-blue text-white' : 'bg-ios-card text-ios-label3'
                                    }`}
                                  >
                                    {p.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-ios-gray mb-1.5">מחולק בין</p>
                            <div className="flex flex-wrap gap-1.5">
                              {trip.people.map((p) => {
                                const sel = editSplit.includes(p.id);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => setEditSplit((prev) => sel ? prev.filter((x) => x !== p.id) : [...prev, p.id])}
                                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                                      sel ? 'bg-ios-blue text-white' : 'bg-ios-card text-ios-label3'
                                    }`}
                                  >
                                    {p.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="flex-1 bg-ios-blue text-white text-[13px] font-semibold py-2 rounded-lg active:opacity-80 transition-opacity"
                            >
                              שמור
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 text-ios-blue text-[13px] font-semibold py-2 rounded-lg bg-ios-card active:bg-ios-gray5 transition-colors"
                            >
                              ביטול
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  </SwipeRow>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmSheet
          title="למחוק את ההוצאה?"
          message="הפעולה הזאת לא ניתנת לביטול"
          onConfirm={() => { removeExpense(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="text-center pt-2 pb-4">
        <a
          href="https://www.exchangerate-api.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-ios-gray3"
        >
          Rates by ExchangeRate-API
        </a>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={openAddModal}
        className="fixed z-40 left-5 w-14 h-14 bg-ios-blue text-white rounded-full shadow-lg shadow-ios-blue/30 flex items-center justify-center active:scale-90 transition-transform fab-position"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Add Purchase Modal — fullscreen iOS style, portaled to body */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-50 bg-ios-bg md:bg-black/50 flex flex-col md:items-center md:justify-center animate-slide-up md:animate-fade-in" dir="rtl">
          <div className="contents md:flex md:flex-col md:w-full md:max-w-lg md:max-h-[85vh] md:rounded-2xl md:shadow-2xl md:overflow-hidden md:bg-ios-bg">
          {/* iOS Navigation Bar */}
          <div className="shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-3 bg-ios-card/80 backdrop-blur-xl border-b border-ios-separator md:rounded-t-2xl">
            <div className="flex items-center justify-between px-4 h-11">
              {showForm ? (
                <button
                  onClick={() => resetForm()}
                  className="text-ios-blue text-[17px] active:opacity-60 transition-opacity flex items-center gap-0.5"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} className="rotate-180" />
                  <span>חזרה</span>
                </button>
              ) : (
                <div />
              )}
              <span className="text-[17px] font-semibold text-ios-label absolute left-1/2 -translate-x-1/2">
                {showForm ? (activeTemplate?.label ?? 'הוצאה חדשה') : 'הוצאה חדשה'}
              </span>
              <button
                onClick={closeAddModal}
                className="text-ios-blue text-[17px] font-medium active:opacity-60 transition-opacity"
              >
                ביטול
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {!showForm ? (
              <div className="px-4 pt-5">
                <p className="text-[13px] font-medium text-ios-gray px-4 pb-2">בחר סוג הוצאה</p>
                <div className="ios-card overflow-hidden">
                  {PURCHASE_TEMPLATES.map((tpl, i) => {
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={tpl.label}
                        onClick={() => openForm(tpl)}
                        className={`w-full flex items-center gap-3 px-4 py-[11px] active:bg-ios-gray6 transition-colors ${
                          i > 0 ? 'border-t border-ios-separator' : ''
                        }`}
                      >
                        <div className={`w-[29px] h-[29px] rounded-[7px] bg-gradient-to-br ${tpl.color} flex items-center justify-center text-white shrink-0`}>
                          <Icon size={15} />
                        </div>
                        <span className="text-[17px] text-ios-label flex-1 text-right">{tpl.label}</span>
                        <ChevronLeft size={16} className="text-ios-gray3" />
                      </button>
                    );
                  })}
                  <button
                    onClick={() => openForm(null)}
                    className="w-full flex items-center gap-3 px-4 py-[11px] active:bg-ios-gray6 transition-colors border-t border-ios-separator"
                  >
                    <div className="w-[29px] h-[29px] rounded-[7px] bg-ios-gray flex items-center justify-center text-white shrink-0">
                      <Pencil size={15} />
                    </div>
                    <span className="text-[17px] text-ios-label flex-1 text-right">הוצאה מותאמת אישית</span>
                    <ChevronLeft size={16} className="text-ios-gray3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 pt-5 pb-4 space-y-6 animate-fade-in">
                {/* Description (custom mode only) */}
                {customMode && (
                  <div>
                    <p className="text-[13px] font-medium text-ios-gray px-4 pb-2">תיאור</p>
                    <div className="ios-card overflow-hidden">
                      <input
                        type="text"
                        value={desc}
                        onChange={(e) => { setDesc(e.target.value); setValidationError(''); }}
                        placeholder="למשל: ארוחת ערב..."
                        autoFocus
                        className="w-full px-4 py-[11px] text-[17px] text-ios-label bg-transparent placeholder:text-ios-gray3 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Amount + Currency */}
                <div>
                  <p className="text-[13px] font-medium text-ios-gray px-4 pb-2">סכום</p>
                  <div className="ios-card overflow-hidden">
                    <div className="flex items-center px-4 py-[11px]" dir="ltr">
                      <span className="text-[28px] font-bold text-ios-gray3 shrink-0 w-6 text-center">
                        {currencySymbol(currency)}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value); setValidationError(''); }}
                        placeholder="0.00"
                        autoFocus={!customMode}
                        dir="ltr"
                        className="flex-1 text-[28px] font-bold text-ios-label bg-transparent placeholder:text-ios-gray3 focus:outline-none ml-1"
                        onKeyDown={(e) => { if (e.key === 'Enter') submitExpense(); }}
                      />
                    </div>
                    {amount && parseFloat(amount) > 0 && (
                      <div className="px-4 pb-2 text-[13px] text-ios-gray" dir="ltr">
                        {formatConversion(parseFloat(amount), currency, liveRates)}
                      </div>
                    )}
                    <div className="border-t border-ios-separator px-4 py-2">
                      <div className="flex bg-ios-gray5 rounded-[9px] p-[2px]">
                        {CURRENCY_ORDER.map((c) => (
                          <button
                            key={c}
                            onClick={() => setCurrency(c)}
                            className={`flex-1 py-[6px] rounded-[7px] text-[13px] font-semibold text-center transition-all ${
                              currency === c
                                ? 'bg-ios-card text-ios-label shadow-sm'
                                : 'text-ios-gray'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paid by */}
                <div>
                  <p className="text-[13px] font-medium text-ios-gray px-4 pb-2">מי שילם?</p>
                  <div className="ios-card overflow-hidden">
                    {trip.people.map((p, idx) => {
                      const selected = paidBy.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => { togglePaidBy(p.id); setValidationError(''); }}
                          className={`w-full flex items-center gap-3 px-4 py-[11px] active:bg-ios-gray6 transition-colors ${
                            idx > 0 ? 'border-t border-ios-separator' : ''
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                            {p.name.charAt(0)}
                          </div>
                          <span className="text-[17px] text-ios-label flex-1 text-right">{p.name}</span>
                          {selected && <Check size={18} className="text-ios-blue shrink-0" strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Split between */}
                <div>
                  <div className="flex items-center justify-between px-4 pb-2">
                    <p className="text-[13px] font-medium text-ios-gray">לחלק בין</p>
                    {splitBetween.length < trip.people.length && (
                      <button
                        onClick={() => setSplitBetween(trip.people.map((p) => p.id))}
                        className="text-[13px] text-ios-blue font-medium active:opacity-60 transition-opacity"
                      >
                        בחר הכל
                      </button>
                    )}
                  </div>
                  <div className="ios-card overflow-hidden">
                    {trip.people.map((p, idx) => {
                      const selected = splitBetween.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => { toggleSplit(p.id); setValidationError(''); }}
                          className={`w-full flex items-center gap-3 px-4 py-[11px] active:bg-ios-gray6 transition-colors ${
                            idx > 0 ? 'border-t border-ios-separator' : ''
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                            {p.name.charAt(0)}
                          </div>
                          <span className="text-[17px] text-ios-label flex-1 text-right">{p.name}</span>
                          {selected && <Check size={18} className="text-ios-blue shrink-0" strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>
                  {amount && splitBetween.length > 0 && parseFloat(amount) > 0 && (
                    <p className="text-[13px] text-ios-gray px-4 pt-2">
                      לאדם:{' '}
                      <span className="text-ios-label font-medium" dir="ltr">
                        {currencySymbol(currency)}{Math.round(parseFloat(amount) / splitBetween.length).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>

                {validationError && (
                  <p className="text-center text-[15px] text-ios-red font-medium animate-scale-in">
                    {validationError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* iOS-style bottom button */}
          {showForm && (
            <div className="shrink-0 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-ios-bg">
              <button
                onClick={() => { if (submitExpense()) setShowAddModal(false); }}
                className="w-full bg-ios-blue text-white text-[17px] font-semibold py-[14px] rounded-[14px] active:opacity-80 transition-opacity"
              >
                הוסף
              </button>
            </div>
          )}
        </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function MiniCurrencyToggle({
  currency,
  onChange,
}: {
  currency: Currency;
  onChange: (c: Currency) => void;
}) {
  return (
    <button
      onClick={() => onChange(nextCurrency(currency))}
      className="px-2.5 py-2 rounded-xl bg-ios-gray5 text-xs font-bold text-ios-label3 active:bg-ios-gray4 transition-all min-w-[36px] text-center"
    >
      {currencySymbol(currency)}
    </button>
  );
}

function PersonalFixedSummary({
  trip,
  fixedType,
}: {
  trip: Trip;
  fixedType: string;
  rates: Rates;
}) {
  const filled = trip.expenses.filter((e) => e.fixedType === fixedType);
  const total = trip.people.length;
  return (
    <span className="text-xs text-ios-gray3" dir="ltr">
      {filled.length}/{total}
    </span>
  );
}
