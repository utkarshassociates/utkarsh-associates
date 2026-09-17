import { z } from "zod";
import { optionalTextSchema } from "./shared";

// Contact form — a hidden honeypot field is the
// spam guard, no third-party CAPTCHA. `website` is the honeypot: real users
// never see or fill this field (it's visually hidden, not just tiny/off-
// screen, and has no label a screen reader would announce as something to
// fill in), so anything non-empty here is almost certainly a bot filling
// every field it finds. We still 200 the response either way (see
// src/actions/contact.ts) so a bot doesn't learn its submission was caught.
//
// Built directly against shared.ts's `optionalTextSchema` per PHASE-3-NOTES's
// "Lessons learned" #3 — this form is used both as the client-side
// `zodResolver` (whose *parsed output* becomes the submit handler's
// `values`) and re-parsed server-side inside the Server Action, so it
// inherits the `.nullish()` fix already made for every other optional field
// instead of re-introducing the "Expected string, received null" bug in a
// brand-new form.
export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(200),
  email: z.string().trim().email("Enter a valid email address").max(320),
  phone: optionalTextSchema,
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(4000),
  practiceAreaInterest: optionalTextSchema,
  // Honeypot. Optional because a real browser with JS/CSS working never
  // submits anything here; `.nullish()` for the same double-parse reason as
  // every other optional field above.
  website: z.string().trim().nullish(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
