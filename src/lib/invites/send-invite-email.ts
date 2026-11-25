import { Resend } from "resend";

export type SendInviteEmailResult =
  | { ok: true }
  | { ok: false; message: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendInviteEmail(options: {
  to: string;
  organizationName: string;
  role: "admin" | "member";
  inviteUrl: string;
  invitedByName: string | null;
}): Promise<SendInviteEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "AvtalePilot <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      ok: false,
      message:
        "RESEND_API_KEY mangler. Legg den til i .env.local / Vercel for å sende invitasjoner.",
    };
  }

  const roleNb = options.role === "admin" ? "administrator" : "medlem";
  const who = options.invitedByName
    ? escapeHtml(options.invitedByName)
    : "En administrator";
  const org = escapeHtml(options.organizationName);
  const url = escapeHtml(options.inviteUrl);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: options.to,
    subject: `Invitasjon til ${options.organizationName} på AvtalePilot`,
    html: `
      <p>${who} har invitert deg til <strong>${org}</strong> på AvtalePilot som <strong>${roleNb}</strong>.</p>
      <p><a href="${url}">Åpne invitasjonen</a></p>
      <p>Lenken utløper om 7 dager. Hvis du ikke forventet denne e-posten, kan du ignorere den.</p>
    `,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
