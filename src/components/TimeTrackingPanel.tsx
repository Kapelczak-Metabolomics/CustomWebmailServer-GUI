import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../theme";
import { api } from "../lib/api";
import type { TimeEntry } from "../types";
import { formatDuration, formatDate } from "../lib/utils";
import { Clock, Plus, Trash2 } from "lucide-react";

export default function TimeTrackingPanel({
  conversationId,
}: {
  conversationId: string;
}) {
  const { tokens: t } = useTheme();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = (await api.listTimeEntries(conversationId)) as TimeEntry[];
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load time entries");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(minutes, 10);
    if (!mins || mins < 1) return;
    try {
      setSubmitting(true);
      await api.createTimeEntry(
        conversationId,
        mins,
        description.trim() || undefined,
      );
      setMinutes("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log time");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteTimeEntry(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          backgroundColor: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 10,
        }}
      >
        <Clock size={18} style={{ color: t.accent }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 11,
              color: t.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Total tracked
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: t.text,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatDuration(totalMinutes)}
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 12,
          backgroundColor: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: t.text,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={14} style={{ color: t.accent }} />
          Log time
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            min={1}
            placeholder="Minutes"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            style={{
              width: 100,
              backgroundColor: t.inputBg,
              border: `1px solid ${t.inputBorder}`,
              borderRadius: 8,
              padding: "8px 10px",
              color: t.text,
              fontSize: 13,
              outline: "none",
            }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: t.inputBg,
              border: `1px solid ${t.inputBorder}`,
              borderRadius: 8,
              padding: "8px 10px",
              color: t.text,
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !minutes || parseInt(minutes, 10) < 1}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: t.accentGrad,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            opacity:
              submitting || !minutes || parseInt(minutes, 10) < 1 ? 0.5 : 1,
          }}
        >
          <Clock size={14} />
          Log time
        </button>
      </form>

      {error && (
        <div
          style={{
            fontSize: 12,
            color: "#EF4444",
            padding: "6px 8px",
          }}
        >
          {error}
        </div>
      )}

      {loading && entries.length === 0 ? (
        <div style={{ fontSize: 13, color: t.textMuted }}>
          Loading time entries...
        </div>
      ) : entries.length === 0 ? (
        <div style={{ fontSize: 13, color: t.textMuted }}>
          No time logged yet.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                backgroundColor: t.card,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minWidth: 0,
                  gap: 2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.text,
                    }}
                  >
                    {entry.user?.name || "Unknown"}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: t.accent,
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 600,
                    }}
                  >
                    {formatDuration(entry.minutes)}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: t.textMuted,
                  }}
                >
                  {formatDate(entry.createdAt)}
                </span>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                title="Delete entry"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  border: "none",
                  color: t.textFaint,
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
