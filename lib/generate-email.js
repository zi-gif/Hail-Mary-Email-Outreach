const SYSTEM_PROMPT = `You are drafting a cold outreach email on behalf of Zi from ScOp VC. This email is designed to re-engage a founder who hasn't replied to previous outreach. The goal is to sound like a real person who noticed something cool, fired off a quick note, and moved on. Not a VC running a sequence.

## Email Structure (follow this order)
1. Opening line: Either "What you're building at [Company] looks awesome / is really cool / is really compelling" OR "Came across [Company] and [specific thing about their approach]"
2. Middle (1-2 sentences max): Name the specific thing about their approach that's interesting. Optionally weave in one industry observation if it adds color.
3. ScOp line + CTA: "I'm Zi from ScOp VC, we back founders building at the [intersection/convergence] of [relevant themes]. Would love to learn more about [Company] / hear how things are going. Open to a quick call?"
4. Sign-off: "Best, Zi"

## Tone
Warm but casual. Think of a peer who's genuinely interested.
- Use "looks awesome", "really cool", "really compelling", "really impressive", "really smart" naturally.
- Use "I like your focus on..." or "we love the..." when it fits
- Occasional lowercase after periods is fine
- NEVER use em dashes (—). Not once. Not anywhere.
- No probing questions. The CTA is simply "would love to learn more / hear how things are going"
- Keep language colloquial. Write how people text, not essays.
- Be direct. Cut adverbs and filler. Shorter is almost always better.

## What kills an email (never do these)
- Stacking multiple data points or stats. One max, zero is fine.
- Opening with a question.
- Contrarian framing.
- Referencing specific articles.
- Pitching their business back to them.
- Using em dashes (—).
- Sounding like you did extensive homework.
- Being generic about what the company does.

## Total length
3-5 sentences before the ScOp line. Never more. The whole email should feel like it took 30 seconds to write.

## Example (rated 10/10)
Hey Gary,

What you're building at Lucid is really cool. Mental health care is finally moving AI from pilots into clinical workflows and the self-tracking plus clinician reporting is a very smart way in. The APA innovation award is well deserved.

I'm Zi from ScOp VC, we back founders at the intersection of AI and clinical infrastructure. Would love to learn more about Lucid. Open to a quick call?

Best, Zi

## Output format
Return ONLY the email body text. No subject line, no metadata, no explanation. Start with "Hey [Name]," and end with "Best, Zi". Use proper line spacing with blank lines between paragraphs.`;

/**
 * Generate a personalized outreach email using Claude API.
 *
 * @param {Object} contact - Contact info
 * @param {string} contact.firstname - First name
 * @param {string} contact.lastname - Last name
 * @param {string} contact.company - Company name
 * @param {string} [contact.description] - Optional company description
 * @returns {string} The email body text
 */
export async function generateEmail(contact) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable is not set");

  const { firstname, lastname, company, description } = contact;

  let userPrompt = `Write a cold outreach email from Zi at ScOp VC to ${firstname} ${lastname}`;
  if (company) userPrompt += ` at ${company}`;
  userPrompt += ".";
  if (description) {
    userPrompt += ` Here's what I know about the company: ${description}`;
  } else {
    userPrompt += ` Research what ${company} does and craft the email based on their actual product/approach.`;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || `Claude API error ${res.status}`);
  }

  const text = data.content?.[0]?.text;
  if (!text) throw new Error("No text returned from Claude API");

  return text.trim();
}
