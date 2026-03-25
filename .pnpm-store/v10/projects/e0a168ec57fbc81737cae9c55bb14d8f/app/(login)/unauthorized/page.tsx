import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { getRoleHome } from '@/lib/auth/route-rules';

export default async function UnauthorizedPage() {
  const session = await getSession();
  const homeUrl = session ? getRoleHome(session.role) : '/';
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don&apos;t have permission to access this page.</p>
        <Link href={homeUrl} className="text-orange-700 hover:text-orange-800 font-medium">
          Return to home
        </Link>
      </div>
    </div>
  );
}
