'use client';

import { useConsultationModal } from './consultation-modal-context';

export default function ConsultationLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open } = useConsultationModal();
  return (
    <button onClick={open} className={className}>
      {children}
    </button>
  );
}
