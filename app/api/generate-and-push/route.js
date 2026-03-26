import { updateContactProperties } from "@/lib/hubspot";
import { generateEmail } from "@/lib/generate-email";
import { NextResponse } from "next/server";

/**
 * POST /api/generate-and-push
 *
 * Called by Zapier when a contact's lead status changes to "Finished Full Sequence".
 * Generates a personalized email via Claude and writes it to the contact's
 * hail_mary_1 property in HubSpot.
 *
 * Body (from Zapier):
 * {
 *   "contact_id": "123",
 *   "firstname": "Jane",
 *   "lastname": "Doe",
 *   "company": "Acme Corp",
 *   "description": "Optional — what the company does"
 * }
 */
export async function POST(request) {
  try {
    // Verify API key for basic security
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.WEBHOOK_SECRET;
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contact_id, firstname, lastname, company, description } = body;

    if (!contact_id) {
      return NextResponse.json(
        { error: "Missing contact_id" },
        { status: 400 }
      );
    }

    if (!firstname || !company) {
      return NextResponse.json(
        { error: "Missing firstname or company — needed to generate email" },
        { status: 400 }
      );
    }

    // Step 1: Generate email via Claude
    const emailBody = await generateEmail({
      firstname,
      lastname: lastname || "",
      company,
      description: description || "",
    });

    // Step 2: Write to HubSpot
    await updateContactProperties(contact_id, {
      hail_mary_1: emailBody,
    });

    return NextResponse.json({
      success: true,
      contact_id,
      message: `Generated and pushed email for ${firstname} at ${company}`,
      preview: emailBody.substring(0, 200) + "...",
    });
  } catch (err) {
    console.error("generate-and-push error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
