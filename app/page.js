"use client";

import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runBatch = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/generate-batch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>HM</div>
          <div>
            <h1 style={styles.title}>Hail Mary</h1>
            <p style={styles.subtitle}>ScOp VC Outreach Engine</p>
          </div>
        </header>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>How it works</h2>
          <p style={styles.text}>
            This app runs automatically via Zapier. When a contact's lead status
            hits "Finished Full Sequence", Zapier calls this API, Claude writes a
            personalized email, and it gets pushed into the contact's Hail Mary 1
            property in HubSpot.
          </p>
          <p style={styles.text}>
            Your sequence template pulls from {"{{contact.hail_mary_1}}"} so the
            email auto-populates when you enroll someone.
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Manual batch run</h2>
          <p style={styles.textSmall}>
            Find all "Finished Full Sequence" contacts missing an email,
            generate one, and push to HubSpot.
          </p>
          <button
            onClick={runBatch}
            disabled={loading}
            style={{
              ...styles.btn,
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Generating..." : "Run batch now"}
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {status && (
          <div style={styles.successBox}>
            <p style={styles.statLine}>
              Found <strong>{status.total_found}</strong> contacts
            </p>
            <p style={styles.statLine}>
              Already had email: <strong>{status.already_had_email}</strong>
            </p>
            <p style={styles.statLine}>
              Generated now: <strong>{status.generated}</strong>
            </p>
            {status.errors > 0 && (
              <p style={{ ...styles.statLine, color: "#fca5a5" }}>
                Errors: <strong>{status.errors}</strong>
              </p>
            )}
            {status.details?.results?.map((r) => (
              <p key={r.id} style={styles.resultLine}>
                {r.name} ({r.company}) — done
              </p>
            ))}
          </div>
        )}

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>API endpoints</h2>
          <div style={styles.endpoint}>
            <code style={styles.code}>POST /api/generate-and-push</code>
            <p style={styles.textSmall}>
              Single contact — Zapier sends contact_id, firstname, company.
              Claude generates the email and pushes to HubSpot.
            </p>
          </div>
          <div style={styles.endpoint}>
            <code style={styles.code}>POST /api/generate-batch</code>
            <p style={styles.textSmall}>
              Batch — finds all "Finished Full Sequence" contacts without an
              email and processes them all.
            </p>
          </div>
          <div style={styles.endpoint}>
            <code style={styles.code}>POST /api/push-emails</code>
            <p style={styles.textSmall}>
              Direct push — send pre-written email bodies for specific contacts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0a0a0b",
    color: "#e4e4e7",
    fontFamily: "'DM Sans', -apple-system, sans-serif",
  },
  container: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "48px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px",
  },
  logo: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "18px",
    color: "#000",
  },
  title: {
    margin: "0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#fafafa",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "2px 0 0",
    fontSize: "14px",
    color: "#71717a",
  },
  card: {
    padding: "24px",
    backgroundColor: "#111113",
    borderRadius: "12px",
    border: "1px solid #1e1e22",
  },
  cardTitle: {
    margin: "0 0 12px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#fafafa",
  },
  text: {
    margin: "0 0 10px",
    fontSize: "14px",
    color: "#a1a1aa",
    lineHeight: "1.6",
  },
  textSmall: {
    margin: "0 0 14px",
    fontSize: "13px",
    color: "#71717a",
    lineHeight: "1.5",
  },
  btn: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#000",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  errorBox: {
    padding: "14px 20px",
    borderRadius: "10px",
    backgroundColor: "#1c0a0a",
    border: "1px solid #7f1d1d",
    color: "#fca5a5",
    fontSize: "14px",
  },
  successBox: {
    padding: "20px",
    borderRadius: "10px",
    backgroundColor: "#052e16",
    border: "1px solid #166534",
    color: "#86efac",
    fontSize: "14px",
  },
  statLine: {
    margin: "0 0 6px",
    fontSize: "14px",
  },
  resultLine: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#4ade80",
    fontFamily: "'JetBrains Mono', monospace",
  },
  endpoint: {
    marginBottom: "16px",
  },
  code: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    backgroundColor: "#1e1e22",
    padding: "4px 8px",
    borderRadius: "4px",
    color: "#22c55e",
  },
};
