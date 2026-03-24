'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import ConsultationForm from './consultation-form';

const ConsultationModalContext = createContext<{ open: () => void }>({ open: () => {} });

export function useConsultationModal() {
  return useContext(ConsultationModalContext);
}

export function ConsultationModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);

  return (
    <ConsultationModalContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[55] overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="min-h-full flex items-start justify-center py-8 px-4">
            <div className="relative w-full max-w-xl animate-[fadeIn_0.2s_ease-out]">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute -top-2 -right-2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ConsultationForm onSuccess={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </ConsultationModalContext.Provider>
  );
}
