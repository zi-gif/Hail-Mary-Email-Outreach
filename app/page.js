"use client";

import { useState, useCallback } from "react";

export default function Home() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Fetch contacts from HubSpot
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts?status=Finished+Full+Sequence");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContacts(data.contacts);
      setSelectedIds(new Set(data.contacts.map((c) => c.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Parse bulk paste: expects lines like "ContactID | email body" or JSON
  const parseBulkText = useCallback(() => {
    setError(null);
    try {
      // Try JSON first
      const trimmed = bulkText.trim();
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        let parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) parsed = [parsed];
        const mapped = parsed.map((c) => ({
          id: String(c.id || c.contactId || c.contact_id),
          firstname: c.firstname || c.first_name || c.name?.split(" ")[0] || "",
          lastname: c.lastname || c.last_name || c.name?.split(" ").slice(1).join(" ") || "",
          email: c.email || "",
          company: c.company || "",
          lead_status: c.lead_status || "",
          hail_mary_1: c.email_body || c.hail_mary_1 || c.body || c.message || "",
        }));
        setContacts(mapped);
        setSelectedIds(new Set(mapped.map((c) => c.id)));
        setPasteMode(false);
        return;
      }

      // Otherwise, try line-by-line: "ID | First Last | Company | email body"
      const lines = trimmed.split("\n").filter((l) => l.trim());
      const mapped = lines.map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        if (parts.length < 2) throw new Error(`Invalid line format: "${line}"`);
        return {
          id: parts[0],
          firstname: parts.length > 2 ? parts[1].split(" ")[0] : "",
          lastname: parts.length > 2 ? parts[1].split(" ").slice(1).join(" ") : "",
          company: parts.length > 3 ? parts[2] : "",
          email: "",
          lead_status: "",
          hail_mary_1: parts[parts.length - 1],
        };
      });
      setContacts(mapped);
      setSelectedIds(new Set(mapped.map((c) => c.id)));
      setPasteMode(false);
    } catch (err) {
      setError(`Parse error: ${err.message}`);
    }
  }, [bulkText]);

  // Update a single contact's email body locally
  const updateEmailBody = useCallback((id, value) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, hail_mary_1: value } : c))
    );
  }, []);

  // Toggle select
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Push to HubSpot
  const pushToHubspot = useCallback(async () => {
    setPushing(true);
    setError(null);
    setResult(null);
    try {
      const selected = contacts.filter(
        (c) => selectedIds.has(c.id) && c.hail_mary_1.trim()
      );
      if (selected.length === 0) throw new Error("No contacts with email bodies selected");

      const body = {
        contacts: selected.map((c) => ({
          id: c.id,
          email_body: c.hail_mary_1,
        })),
      };

      const res = await fetch("/api/push-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setPushing(false);
    }
  }, [contacts, selectedIds]);

  const selectedCount = contacts.filter(
    (c) => selectedIds.has(c.id) && c.hail_mary_1.trim()
  ).length;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>HM</div>
            <div>
              <h1 style={styles.title}>Hail Mary</h1>
              <p style={styles.subtitle}>ScOp VC Outreach Engine</p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.badge}>
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            </div>
          </div>
        </header>

        {/* Action Bar */}
        <div style={styles.actionBar}>
          <button onClick={fetchContacts} disabled={loading} style={styles.btnSecondary}>
            {loading ? "Loading..." : "Pull from HubSpot"}
          </button>
          <button
            onClick={() => setPasteMode(!pasteMode)}
            style={styles.btnSecondary}
          >
            {pasteMode ? "Cancel" : "Paste Data"}
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={pushToHubspot}
            disabled={pushing || selectedCount === 0}
            style={{
              ...styles.btnPrimary,
              opacity: pushing || selectedCount === 0 ? 0.5 : 1,
            }}
          >
            {pushing
              ? "Pushing..."
              : `Push ${selectedCount} to HubSpot`}
          </button>
        </div>

        {/* Paste Area */}
        {pasteMode && (
          <div style={styles.pasteArea}>
            <p style={styles.pasteHint}>
              Paste JSON array or pipe-delimited lines:{" "}
              <code style={styles.code}>ID | Name | Company | Email Body</code>
            </p>
            <textarea
              style={styles.textarea}
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`[
  { "id": "12345", "firstname": "Jane", "company": "Acme", "email_body": "Hey Jane, loved what..." },
  ...
]`}
            />
            <button onClick={parseBulkText} style={styles.btnSecondary}>
              Parse & Load
            </button>
          </div>
        )}

        {/* Status messages */}
        {error && <div style={styles.errorBox}>{error}</div>}
        {result && <div style={styles.successBox}>{result.message}</div>}

        {/* Contact Cards */}
        <div style={styles.contactList}>
          {contacts.length === 0 && (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>No contacts loaded</p>
              <p style={styles.emptyHint}>
                Pull contacts from HubSpot or paste data to get started.
              </p>
            </div>
          )}
          {contacts.map((c) => (
            <div
              key={c.id}
              style={{
                ...styles.card,
                borderLeft: selectedIds.has(c.id)
                  ? "3px solid #22c55e"
                  : "3px solid transparent",
              }}
            >
              <div style={styles.cardHeader}>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    style={styles.checkbox}
                  />
                  <span style={styles.contactName}>
                    {c.firstname} {c.lastname}
                  </span>
                </label>
                <div style={styles.cardMeta}>
                  {c.company && <span style={styles.company}>{c.company}</span>}
                  <span style={styles.contactId}>#{c.id}</span>
                </div>
              </div>
              <textarea
                style={styles.emailTextarea}
                rows={5}
                value={c.hail_mary_1}
                onChange={(e) => updateEmailBody(c.id, e.target.value)}
                placeholder="Paste personalized email body here..."
              />
            </div>
          ))}
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
    padding: "0",
    margin: "0",
  },
  container: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "40px 24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
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
    letterSpacing: "-0.5px",
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
    fontWeight: "400",
  },
  headerRight: {},
  badge: {
    padding: "6px 14px",
    borderRadius: "20px",
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    fontSize: "13px",
    color: "#a1a1aa",
    fontFamily: "'JetBrains Mono', monospace",
  },
  actionBar: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "24px",
    padding: "16px 20px",
    backgroundColor: "#111113",
    borderRadius: "12px",
    border: "1px solid #1e1e22",
  },
  btnPrimary: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#000",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "opacity 0.15s",
  },
  btnSecondary: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #27272a",
    backgroundColor: "#18181b",
    color: "#d4d4d8",
    fontWeight: "500",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  pasteArea: {
    marginBottom: "24px",
    padding: "20px",
    backgroundColor: "#111113",
    borderRadius: "12px",
    border: "1px solid #1e1e22",
  },
  pasteHint: {
    margin: "0 0 12px",
    fontSize: "13px",
    color: "#71717a",
  },
  code: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    backgroundColor: "#1e1e22",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "#a1a1aa",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #27272a",
    backgroundColor: "#0a0a0b",
    color: "#e4e4e7",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', monospace",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "12px",
    lineHeight: "1.6",
  },
  errorBox: {
    padding: "14px 20px",
    borderRadius: "10px",
    backgroundColor: "#1c0a0a",
    border: "1px solid #7f1d1d",
    color: "#fca5a5",
    fontSize: "14px",
    marginBottom: "20px",
  },
  successBox: {
    padding: "14px 20px",
    borderRadius: "10px",
    backgroundColor: "#052e16",
    border: "1px solid #166534",
    color: "#86efac",
    fontSize: "14px",
    marginBottom: "20px",
  },
  contactList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    color: "#52525b",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 8px",
    color: "#71717a",
  },
  emptyHint: {
    fontSize: "14px",
    margin: "0",
  },
  card: {
    padding: "20px",
    backgroundColor: "#111113",
    borderRadius: "12px",
    border: "1px solid #1e1e22",
    transition: "border-color 0.15s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#22c55e",
    cursor: "pointer",
  },
  contactName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fafafa",
  },
  cardMeta: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  company: {
    fontSize: "13px",
    color: "#a1a1aa",
    fontWeight: "500",
  },
  contactId: {
    fontSize: "12px",
    color: "#52525b",
    fontFamily: "'JetBrains Mono', monospace",
  },
  emailTextarea: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #27272a",
    backgroundColor: "#0a0a0b",
    color: "#d4d4d8",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', monospace",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: "1.6",
  },
};
