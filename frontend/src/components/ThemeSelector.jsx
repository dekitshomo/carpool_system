import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react';

export const ThemeSelector = ({ variant = 'dropdown' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Laptop },
  ];

  if (variant === 'segmented') {
    return (
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200 dark:border-slate-700/60">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown style
  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition active:scale-95 text-xs font-bold"
        aria-label="Select theme"
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
      >
        <CurrentIcon className="w-4 h-4 text-brand-orange dark:text-amber-400 transition transform rotate-0 dark:rotate-90" />
        <span className="hidden sm:inline capitalize">{theme}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-white dark:bg-slate-900 shadow-uber dark:shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setTheme(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition ${
                  isSelected
                    ? 'text-brand-blue dark:text-sky-400 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

