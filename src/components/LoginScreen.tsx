import { useState } from 'react';
import type { UserSession } from '../types';
import { Mountain } from 'lucide-react';

interface Props {
  onLogin: (session: UserSession) => void;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

export function LoginScreen({ onLogin }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = normalizePhone(phone.trim());
    if (!trimmedName) {
      setError('הזן את השם שלך');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 9) {
      setError('הזן מספר טלפון תקין');
      return;
    }
    onLogin({ name: trimmedName, phone: trimmedPhone });
  }

  return (
    <div className="min-h-dvh bg-ios-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="bg-ios-blue/10 w-20 h-20 rounded-[22px] flex items-center justify-center mx-auto mb-4">
            <Mountain size={36} className="text-ios-blue" />
          </div>
          <h1 className="text-[28px] font-bold text-ios-label mb-1">טיול סקי</h1>
          <p className="text-[15px] text-ios-gray">הכנס שם ומספר טלפון כדי להתחבר</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="ios-card p-5 space-y-4 animate-fade-in-up stagger-2"
        >
          <div>
            <label className="text-[13px] font-medium text-ios-gray mb-1.5 block">
              שם
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="השם שלך..."
              autoFocus
              className="w-full bg-ios-gray6 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-ios-blue/30 placeholder:text-ios-gray3 transition-all"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-ios-gray mb-1.5 block">
              מספר טלפון
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(''); }}
              placeholder="050-1234567"
              dir="ltr"
              className="w-full bg-ios-gray6 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-ios-blue/30 placeholder:text-ios-gray3 transition-all text-left"
            />
          </div>

          {error && (
            <div className="text-center text-[13px] text-ios-red font-medium animate-scale-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-ios-blue text-white font-semibold py-3.5 rounded-xl active:opacity-80 transition-opacity text-[17px]"
          >
            כניסה
          </button>
        </form>
      </div>
    </div>
  );
}
