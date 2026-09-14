"use server";

import { createBrowserClient } from "@/lib/supabase/client";
import { contactFormSchema, type ContactFormValues } from "@/lib/validations/contact";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Submits the public contact form (project-plan.md §4/§10 — no email
 * notification, `/admin/inquiries` is the source of truth per §5.2).
 *
 * Deliberately uses the ANON client here, not the service-role client every
 * other action in src/actions/ uses — contact_submissions has a narrow
 * insert-only RLS policy carved out specifically for this (see
 * supabase/migrations/0001_init.sql and the updated comment in
 * src/lib/supabase/client.ts). Going through the anon key means that even a
 * bug in this action's own logic can't accidentally read, update, or delete
 * a row here — the database itself won't allow it, regardless of what this
 * function does. That's a stronger guarantee than "this code happens not to
 * do that today."
 */
export async function submitContactAction(input: ContactFormValues): Promise<ActionResult> {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { name, email, phone, message, practiceAreaInterest, website } = parsed.data;

  // Honeypot tripped: pretend success. Never tell a bot its submission was
  // caught — that just teaches it to leave the field alone next time.
  if (website && website.trim().length > 0) {
    return { success: true };
  }

  const supabase = createBrowserClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name,
    email,
    phone,
    message,
    practice_area_interest: practiceAreaInterest,
  });

  if (error) {
    console.error("contact_submissions insert failed:", error);
    return { success: false, error: "Something went wrong sending your message. Please try again." };
  }

  return { success: true };
}
