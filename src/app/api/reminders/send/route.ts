import { NextResponse } from "next/server";
import { sendDueReminderEmails } from "@/lib/reminders/send-due-emails";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const cronSecret =
    process.env.CRON_SECRET ?? process.env.REMINDER_CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          message:
            "CRON_SECRET / REMINDER_CRON_SECRET is not set. Add it in Vercel env vars, or use Settings → Send due reminders now.",
        },
        { status: 503 },
      ),
    };
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  return { ok: true as const };
}

async function handleSend() {
  const result = await sendDueReminderEmails();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

// Vercel Cron calls this path with GET once per day.
export async function GET(request: Request) {
  const auth = isAuthorized(request);
  if (!auth.ok) return auth.response;
  return handleSend();
}

export async function POST(request: Request) {
  const auth = isAuthorized(request);
  if (!auth.ok) return auth.response;
  return handleSend();
}
