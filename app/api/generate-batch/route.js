import { searchContacts, updateContactProperties } from "@/lib/hubspot";
import { generateEmail } from "@/lib/generate-email";
import { NextResponse } from "next/server";

/**
 * POST /api/generate-batch
 *
 * Finds all contacts with lead status "Finished Full Sequence" owned by Zi,
 * generates personalized emails for any that don't already have one,
 * and writes them to HubSpot.
 *
 * Can be called by Zapier on a schedule or triggered manually.
 */
export async function POST(request) {
  try {
    // Verify API key for basic security
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.WEBHOOK_SECRET;
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find contacts ready for Hail Mary
    const filters = [
      {
        propertyName: "hs_lead_status",
        operator: "EQ",
        value: "Finished Full Sequence",
      },
      {
        propertyName: "hubspot_owner_id",
        operator: "EQ",
        value: "83759017", // Zi
      },
    ];

    const properties = [
      "firstname",
      "lastname",
      "email",
      "company",
      "hail_mary_1",
    ];

    const data = await searchContacts(filters, properties);
    const contacts = data.results || [];

    // Filter to only those without an email already generated
    const needsEmail = contacts.filter(
      (c) => !c.properties.hail_mary_1 || c.properties.hail_mary_1.trim() === ""
    );

    const results = [];
    const errors = [];

    for (const c of needsEmail) {
      try {
        const emailBody = await generateEmail({
          firstname: c.properties.firstname || "",
          lastname: c.properties.lastname || "",
          company: c.properties.company || "Unknown",
        });

        await updateContactProperties(c.id, {
          hail_mary_1: emailBody,
        });

        results.push({
          id: c.id,
          name: `${c.properties.firstname} ${c.properties.lastname}`,
          company: c.properties.company,
          status: "done",
        });
      } catch (err) {
        errors.push({
          id: c.id,
          name: `${c.properties.firstname} ${c.properties.lastname}`,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total_found: contacts.length,
      already_had_email: contacts.length - needsEmail.length,
      generated: results.length,
      errors: errors.length,
      details: { results, errors },
    });
  } catch (err) {
    console.error("generate-batch error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
