"use server";

import { requireProfile } from "@/lib/auth/profile";
import {
  sendDueReminderEmails,
  type SendDueEmailsResult,
} from "@/lib/reminders/send-due-emails";

export type ReminderEmailState = {
  result?: SendDueEmailsResult;
  error?: string;
};

export async function sendDueReminderEmailsAction(
  _prevState: ReminderEmailState,
  _formData: FormData,
): Promise<ReminderEmailState> {
  const { profile } = await requireProfile();

  if (profile.role !== "admin") {
    return { error: "Only administrators can send reminder emails." };
  }

  const result = await sendDueReminderEmails({
    organizationId: profile.organization_id,
  });

  return { result };
}
