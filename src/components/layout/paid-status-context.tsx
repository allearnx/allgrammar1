'use client';

import { createContext, useContext } from 'react';

const PaidStatusContext = createContext<boolean | null>(null);

export function PaidStatusProvider({
  isPaid,
  children,
}: {
  isPaid: boolean;
  children: React.ReactNode;
}) {
  return (
    <PaidStatusContext.Provider value={isPaid}>
      {children}
    </PaidStatusContext.Provider>
  );
}

/** Returns true/false if provider exists, or null if not wrapped. */
export function useIsPaid(): boolean | null {
  return useContext(PaidStatusContext);
}
