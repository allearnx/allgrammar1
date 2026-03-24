import PublicHeader from '@/components/public/header';
import PublicFooter from '@/components/public/footer';
import { ConsultationModalProvider } from '@/components/public/consultation-modal-context';
import { getUser } from '@/lib/auth/helpers';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser().catch(() => null);

  return (
    <ConsultationModalProvider>
      <main className="min-h-screen bg-white">
        <PublicHeader isLoggedIn={!!user} />
        {children}
        <PublicFooter />
      </main>
    </ConsultationModalProvider>
  );
}
