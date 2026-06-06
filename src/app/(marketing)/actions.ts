"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { upsertContact } from "@/lib/ghl";

export type LeadFormState =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

const leadSchema = z.object({
  name: z.string().min(2, { error: "Please enter your name." }).trim(),
  email: z.email({ error: "Enter a valid email." }),
  phone: z.string().trim().optional(),
  restaurantName: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

/**
 * Capture a "Book a Free Audit" lead. Always persists to our DB; then
 * best-effort pushes to GHL (the sales pipeline). GHL failure never blocks the
 * user — the lead is safe in our DB and can be synced later.
 */
export async function submitLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    restaurantName: formData.get("restaurantName") || undefined,
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { name, email, phone, restaurantName, message } = parsed.data;

  let lead;
  try {
    lead = await db.lead.create({
      data: { name, email, phone, restaurantName, message },
    });
  } catch (err) {
    console.error("[lead] failed to persist:", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Best-effort GHL sync (graceful when not configured).
  const [firstName, ...rest] = name.split(" ");
  const result = await upsertContact({
    email,
    firstName,
    lastName: rest.join(" ") || undefined,
    phone,
    tags: ["uprevi-audit-lead"],
  });
  if (result.ok) {
    const data = result.data as { contact?: { id?: string }; id?: string };
    const contactId = data?.contact?.id ?? data?.id;
    await db.lead.update({
      where: { id: lead.id },
      data: { ghlSynced: true, ghlContactId: contactId ?? null },
    });
  }

  return { ok: true };
}
