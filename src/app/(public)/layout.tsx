import PublicHeader from '@/components/public/header';
import { getUser } from '@/lib/auth/helpers';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser().catch(() => null);

  return (
    <main className="min-h-screen bg-white">
      <PublicHeader isLoggedIn={!!user} />
      {children}
    </main>
  );
}
