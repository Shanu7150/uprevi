import "server-only";

/**
 * GoHighLevel wrapper — invisible back-office plumbing.
 *
 * GHL is NEVER surfaced in client UI; all access goes through this module on
 * the server. Every call degrades gracefully: when GHL_API_KEY / GHL_LOCATION_ID
 * are absent the functions log and return `{ skipped: true }` instead of
 * throwing, so the rest of the app keeps working without GHL configured.
 */

const GHL_BASE = process.env.GHL_API_BASE ?? "https://rest.gohighlevel.com/v1";

type GhlResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; error: string };

function config() {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  return { apiKey, locationId };
}

function isConfigured(): boolean {
  const { apiKey, locationId } = config();
  return Boolean(apiKey && locationId);
}

async function ghlFetch<T>(
  path: string,
  init: RequestInit,
): Promise<GhlResult<T>> {
  const { apiKey } = config();
  if (!isConfigured()) {
    console.warn(`[ghl] skipped ${path}: GHL_API_KEY / GHL_LOCATION_ID not set.`);
    return { ok: false, skipped: true, reason: "not_configured" };
  }
  try {
    const res = await fetch(`${GHL_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[ghl] ${path} failed (${res.status}): ${text}`);
      return { ok: false, skipped: false, error: `${res.status}` };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    console.error(`[ghl] ${path} threw:`, err);
    return { ok: false, skipped: false, error: "network_error" };
  }
}

export interface GhlContactInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
}

/** Create or update a contact in the configured GHL location. */
export async function upsertContact(input: GhlContactInput) {
  const { locationId } = config();
  return ghlFetch("/contacts/", {
    method: "POST",
    body: JSON.stringify({ ...input, locationId }),
  });
}

/** Add tags to an existing contact. */
export async function addTag(contactId: string, tags: string[]) {
  return ghlFetch(`/contacts/${contactId}/tags/`, {
    method: "POST",
    body: JSON.stringify({ tags }),
  });
}

/** Trigger a GHL workflow for a contact. */
export async function triggerWorkflow(workflowId: string, contactId: string) {
  return ghlFetch(`/workflows/${workflowId}/contacts/${contactId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export const ghl = { isConfigured, upsertContact, addTag, triggerWorkflow };
