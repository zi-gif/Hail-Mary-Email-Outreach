const HUBSPOT_BASE = "https://api.hubapi.com";

function getToken() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN environment variable is not set");
  return token;
}

async function hubspotFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${HUBSPOT_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message || `HubSpot API error ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

/**
 * Update a contact's properties by contact ID.
 */
export async function updateContactProperties(contactId, properties) {
  return hubspotFetch(`/crm/v3/objects/contacts/${contactId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });
}

/**
 * Search contacts by a filter (e.g., lead status).
 */
export async function searchContacts(filters, properties = [], limit = 100) {
  return hubspotFetch("/crm/v3/objects/contacts/search", {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [{ filters }],
      properties,
      limit,
    }),
  });
}

/**
 * Get a single contact by ID.
 */
export async function getContact(contactId, properties = []) {
  const query = properties.length
    ? `?properties=${properties.join(",")}`
    : "";
  return hubspotFetch(`/crm/v3/objects/contacts/${contactId}${query}`);
}

/**
 * Batch update multiple contacts' properties.
 * Takes an array of { id, properties } objects.
 */
export async function batchUpdateContacts(inputs) {
  return hubspotFetch("/crm/v3/objects/contacts/batch/update", {
    method: "POST",
    body: JSON.stringify({ inputs }),
  });
}
