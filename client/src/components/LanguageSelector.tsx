import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n, LOCALE_NAMES, type Locale } from '../lib/i18n';

const FLAG: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  ko: '🇰🇷',
  ja: '🇯🇵',
  zh: '🇨🇳',
};

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="fixed top-4 right-4 z-[200]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ocean-600/40
          bg-ocean-900/80 backdrop-blur-sm text-ocean-300 text-xs font-display tracking-wider
          hover:border-ocean-400/60 transition-all"
      >
        <span className="text-sm">{FLAG[locale]}</span>
        <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1 py-1 rounded-lg border border-ocean-600/40
              bg-ocean-900/95 backdrop-blur-md min-w-[140px] shadow-xl"
          >
            {(Object.keys(LOCALE_NAMES) as Locale[]).map((l) => (
              <button
                key={l}
                onClick={() => { setLocale(l); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-display tracking-wider
                  transition-colors ${l === locale
                    ? 'text-neon-blue bg-neon-blue/10'
                    : 'text-ocean-300 hover:bg-ocean-700/50 hover:text-white'
                  }`}
              >
                <span className="text-sm">{FLAG[l]}</span>
                {LOCALE_NAMES[l]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
