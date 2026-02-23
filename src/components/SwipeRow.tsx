import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

const DELETE_WIDTH = 72;
const THRESHOLD = 40;

interface Props {
  onDelete: () => void;
  children: ReactNode;
}

export function SwipeRow({ onDelete, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const touchRef = useRef({ startX: 0, startY: 0, startOffset: 0, swiping: false });

  useEffect(() => {
    function handleOutside(e: TouchEvent | MouseEvent) {
      if (open && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOffset(0);
        setOpen(false);
      }
    }
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => document.removeEventListener('touchstart', handleOutside);
  }, [open]);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, startOffset: offset, swiping: false };
  }

  function onTouchMove(e: React.TouchEvent) {
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;

    if (!touchRef.current.swiping && Math.abs(dy) > Math.abs(dx)) return;
    touchRef.current.swiping = true;

    const raw = touchRef.current.startOffset + dx;
    const clamped = Math.max(-DELETE_WIDTH, Math.min(0, raw));
    setOffset(clamped);
  }

  function onTouchEnd() {
    if (!touchRef.current.swiping) return;
    if (Math.abs(offset) > THRESHOLD) {
      setOffset(-DELETE_WIDTH);
      setOpen(true);
    } else {
      setOffset(0);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 text-white transition-opacity"
        style={{ width: DELETE_WIDTH, opacity: offset < 0 ? 1 : 0 }}
      >
        <button
          onClick={() => { setOffset(0); setOpen(false); onDelete(); }}
          className="flex flex-col items-center justify-center w-full h-full active:bg-red-600"
        >
          <Trash2 size={20} />
          <span className="text-[11px] mt-0.5">מחק</span>
        </button>
      </div>
      <div
        className="relative bg-ios-card transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${offset}px)`, transition: touchRef.current.swiping ? 'none' : undefined }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
