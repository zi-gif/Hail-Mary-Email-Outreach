import { batchUpdateContacts } from "@/lib/hubspot";
import { NextResponse } from "next/server";

/**
 * POST /api/push-emails
 *
 * Accepts an array of contacts with personalized email content.
 * Updates each contact's "hail_mary_1" property and sets lead status to "Hail Maried".
 *
 * Body:
 * {
 *   "contacts": [
 *     { "id": "123", "email_body": "Hey founder, loved seeing..." },
 *     ...
 *   ]
 * }
 */
export async function POST(request) {
  try {
    const { contacts } = await request.json();

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'contacts' array" },
        { status: 400 }
      );
    }

    // Validate each contact has required fields
    for (const c of contacts) {
      if (!c.id) {
        return NextResponse.json(
          { error: `Contact missing 'id' field: ${JSON.stringify(c)}` },
          { status: 400 }
        );
      }
      if (!c.email_body) {
        return NextResponse.json(
          { error: `Contact ${c.id} missing 'email_body' field` },
          { status: 400 }
        );
      }
    }

    // HubSpot batch update: max 100 per batch
    const batches = [];
    for (let i = 0; i < contacts.length; i += 100) {
      batches.push(contacts.slice(i, i + 100));
    }

    const results = [];

    for (const batch of batches) {
      const inputs = batch.map((c) => ({
        id: c.id,
        properties: {
          hail_mary_1: c.email_body,
          hs_lead_status: "Hail Maried",
        },
      }));

      const result = await batchUpdateContacts(inputs);
      results.push(result);
    }

    const totalUpdated = results.reduce(
      (sum, r) => sum + (r.results?.length || 0),
      0
    );

    return NextResponse.json({
      success: true,
      updated: totalUpdated,
      message: `Updated ${totalUpdated} contact(s) — set hail_mary_1 and lead status to "Hail Maried"`,
    });
  } catch (err) {
    console.error("push-emails error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
