# Hail Mary — ScOp VC Outreach Engine

Push Claude-generated personalized outreach emails directly into HubSpot contact properties, bypassing the browser entirely.

## How it works

1. Claude generates personalized emails for your contacts
2. You paste them into this app (JSON or pipe-delimited format)
3. Click "Push to HubSpot" — the app updates each contact's `hail_mary_1` property and sets Lead Status to "Hail Maried"
4. Your HubSpot sequence template pulls from `{{contact.hail_mary_1}}` and sends

## Setup

### 1. HubSpot Prerequisites

Before deploying, you need to set up these things in HubSpot:

**Create the "Hail Mary 1" contact property:**
- Go to Settings > Properties > Contact Properties > Create Property
- Label: `Hail Mary 1`
- Internal name: `hail_mary_1` (should auto-generate)
- Field type: Multi-line text
- Group: Contact information

**Add "Hail Maried" lead status:**
- Go to Settings > Properties > Contact Properties > Lead Status
- Add a new option: `Hail Maried`

**Update your sequence template:**
- In your "Zi Tailored Outreach" sequence, edit the email step
- In the body, use the personalization token: `{{contact.hail_mary_1}}`
- Set subject line to: "Interested in what you're building, would love to learn more"

**Create a HubSpot Private App:**
- Go to Settings > Integrations > Private Apps > Create a private app
- Name: "Hail Mary Outreach"
- Scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`
- Copy the access token

### 2. Deploy to Vercel

```bash
# Install Vercel CLI (if you don't have it)
npm i -g vercel

# From the hail-mary-app directory
vercel

# Set the environment variable
vercel env add HUBSPOT_ACCESS_TOKEN
# Paste your HubSpot private app token

# Deploy to production
vercel --prod
```

Or deploy via the Vercel dashboard:
1. Push this folder to a GitHub repo
2. Import the repo in vercel.com/new
3. Add `HUBSPOT_ACCESS_TOKEN` in Settings > Environment Variables
4. Deploy

### 3. Zapier Setup (for auto-enrollment)

Create a Zap:
- **Trigger**: HubSpot — Contact Property Change
  - Property: Lead Status
  - Value: "Hail Maried"
- **Action**: HubSpot — Enroll Contact in Sequence
  - Sequence: "Zi Tailored Outreach"
  - Sender: zi@scopvc.com

This way, as soon as you push emails through the app, Zapier auto-enrolls the contacts.

## Input Formats

### JSON (recommended)
```json
[
  {
    "id": "123456",
    "firstname": "Jane",
    "company": "Acme Corp",
    "email_body": "Hey Jane — been following what Acme's doing with..."
  }
]
```

### Pipe-delimited
```
123456 | Jane Doe | Acme Corp | Hey Jane — been following what Acme's doing with...
789012 | John Smith | Widget Co | John, saw Widget Co just shipped...
```

## Local Development

```bash
cp .env.example .env.local
# Edit .env.local with your HubSpot token
npm install
npm run dev
```

Open http://localhost:3000
