export interface StaffInvitationEmailInput {
  dealerName: string;
  expiresAt: Date;
  idempotencyKey: string;
  inviteUrl: string;
  invitedByName?: string | null;
  toEmail: string;
}

interface ResendEmailResponse {
  id?: string;
  error?: {
    message?: string;
  };
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function sendStaffInvitationEmail(
  input: StaffInvitationEmailInput
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'Jupiter <onboarding@resend.dev>';

  if (!apiKey) {
    if (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true') {
      return;
    }

    throw new Error('RESEND_API_KEY is not configured');
  }

  const inviterText = input.invitedByName
    ? `${escapeHtml(input.invitedByName)} invited you to join ${escapeHtml(input.dealerName)}`
    : `You were invited to join ${escapeHtml(input.dealerName)}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [input.toEmail],
      subject: `You're invited to join ${input.dealerName} on Jupiter`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h1 style="font-size: 20px; margin-bottom: 16px;">Complete your staff account</h1>
          <p style="margin-bottom: 12px;">${inviterText} on Jupiter.</p>
          <p style="margin-bottom: 12px;">Use the secure link below to set your password and activate your account.</p>
          <p style="margin: 24px 0;">
            <a
              href="${input.inviteUrl}"
              style="display: inline-block; background: #c2410c; color: white; text-decoration: none; padding: 12px 20px; border-radius: 9999px;"
            >
              Accept invite
            </a>
          </p>
          <p style="margin-bottom: 12px;">This invite expires on ${escapeHtml(
            input.expiresAt.toUTCString()
          )}.</p>
          <p style="color: #6b7280; font-size: 14px;">If you were not expecting this invite, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ResendEmailResponse | null;
    const detail = errorBody?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(`Failed to send invitation email: ${detail}`);
  }
}
