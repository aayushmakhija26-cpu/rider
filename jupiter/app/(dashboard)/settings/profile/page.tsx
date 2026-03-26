import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getDealerProfile } from '@/src/services/dealer.service';
import { ProfileSettingsForm } from './ProfileSettingsForm';

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session) redirect('/dealer/sign-in');
  if (session.role !== 'DEALER_ADMIN') redirect('/unauthorized');

  const profile = await getDealerProfile(session.dealerId).catch(() => redirect('/dashboard'));

  return <ProfileSettingsForm dealerId={session.dealerId} initialValues={profile} />;
}
