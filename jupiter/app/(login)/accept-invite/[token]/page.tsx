import { getStaffInviteState } from '@/src/services/dealerStaff.service';
import { AcceptInviteForm } from './AcceptInviteForm';

interface AcceptInvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params;
  const state = await getStaffInviteState(token);

  if (state.status === 'invalid') {
    return (
      <InviteStatusPage
        title="Invalid invite link"
        description="This invite link is not valid. It may have been revoked or never existed."
        action={{ label: 'Go to sign in', href: '/sign-in' }}
      />
    );
  }

  if (state.status === 'expired') {
    return (
      <InviteStatusPage
        title="Invite link expired"
        description={`This invite to ${state.dealerName} expired. Please ask your dealer admin to send a new invite.`}
        action={{ label: 'Go to sign in', href: '/sign-in' }}
      />
    );
  }

  if (state.status === 'accepted') {
    return (
      <InviteStatusPage
        title="Invite already accepted"
        description={`This invite for ${state.email} has already been accepted. You can sign in to ${state.dealerName}.`}
        action={{ label: 'Sign in', href: '/sign-in' }}
      />
    );
  }

  if (state.status === 'deactivated') {
    return (
      <InviteStatusPage
        title="Account deactivated"
        description="This invite has been deactivated. Please contact your dealer admin for access."
        action={{ label: 'Go to sign in', href: '/sign-in' }}
      />
    );
  }

  // state.status === 'valid' — email is guaranteed to be present here
  const email = state.email ?? '';
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Activate your account
        </h1>
        <p className="text-center text-sm text-gray-600 mb-6">
          You&apos;ve been invited to join <strong>{state.dealerName}</strong> on Jupiter.
        </p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <AcceptInviteForm token={token} email={email} />
        </div>
      </div>
    </div>
  );
}

interface InviteStatusPageProps {
  title: string;
  description: string;
  action: { label: string; href: string };
}

function InviteStatusPage({ title, description, action }: InviteStatusPageProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-3">{title}</h1>
          <p className="text-sm text-gray-600 mb-6">{description}</p>
          <a
            href={action.href}
            className="inline-block bg-orange-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-orange-600 transition-colors"
          >
            {action.label}
          </a>
        </div>
      </div>
    </div>
  );
}
