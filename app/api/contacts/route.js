import { searchContacts } from "@/lib/hubspot";
import { NextResponse } from "next/server";

/**
 * GET /api/contacts?status=Finished+Full+Sequence
 *
 * Fetches contacts from HubSpot filtered by lead status.
 * Returns id, name, email, company, and current lead status.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "Finished Full Sequence";

    const filters = [
      {
        propertyName: "hs_lead_status",
        operator: "EQ",
        value: status,
      },
      {
        propertyName: "hubspot_owner_id",
        operator: "EQ",
        value: "83759017", // Zi's owner ID
      },
    ];

    const properties = [
      "firstname",
      "lastname",
      "email",
      "company",
      "hs_lead_status",
      "hail_mary_1",
    ];

    const data = await searchContacts(filters, properties);

    const contacts = (data.results || []).map((c) => ({
      id: c.id,
      firstname: c.properties.firstname || "",
      lastname: c.properties.lastname || "",
      email: c.properties.email || "",
      company: c.properties.company || "",
      lead_status: c.properties.hs_lead_status || "",
      hail_mary_1: c.properties.hail_mary_1 || "",
    }));

    return NextResponse.json({ contacts, total: data.total || contacts.length });
  } catch (err) {
    console.error("contacts error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
