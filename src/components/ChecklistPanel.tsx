import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../theme";
import { api } from "../lib/api";
import type { Checklist, ChecklistItem } from "../types";
import { Plus, Trash2, CheckSquare, Square } from "lucide-react";

export default function ChecklistPanel({
  conversationId,
}: {
  conversationId: string;
}) {
  const { tokens: t } = useTheme();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({});
  const [addingItem, setAddingItem] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = (await api.listChecklists(conversationId)) as Checklist[];
      setChecklists(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checklists");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateChecklist() {
    const title = newChecklistTitle.trim();
    if (!title) return;
    try {
      setAddingChecklist(true);
      await api.createChecklist(conversationId, title);
      setNewChecklistTitle("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create checklist");
    } finally {
      setAddingChecklist(false);
    }
  }

  async function handleDeleteChecklist(id: string) {
    try {
      await api.deleteChecklist(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete checklist");
    }
  }

  async function handleToggleItem(
    checklistId: string,
    item: ChecklistItem,
  ) {
    try {
      await api.updateChecklistItem(checklistId, item.id, {
        done: !item.done,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    }
  }

  async function handleDeleteItem(checklistId: string, itemId: string) {
    try {
      await api.deleteChecklistItem(checklistId, itemId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  async function handleAddItem(checklistId: string) {
    const text = (itemInputs[checklistId] || "").trim();
    if (!text) return;
    try {
      setAddingItem((prev) => ({ ...prev, [checklistId]: true }));
      await api.addChecklistItem(checklistId, text);
      setItemInputs((prev) => ({ ...prev, [checklistId]: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setAddingItem((prev) => ({ ...prev, [checklistId]: false }));
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <input
          type="text"
          placeholder="New checklist title..."
          value={newChecklistTitle}
          onChange={(e) => setNewChecklistTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateChecklist();
          }}
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
        <button
          onClick={handleCreateChecklist}
          disabled={addingChecklist || !newChecklistTitle.trim()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: t.accentGrad,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            opacity: addingChecklist || !newChecklistTitle.trim() ? 0.5 : 1,
          }}
        >
          <Plus size={14} />
          Add checklist
        </button>
      </div>

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

      {loading && checklists.length === 0 ? (
        <div style={{ fontSize: 13, color: t.textMuted }}>Loading checklists...</div>
      ) : checklists.length === 0 ? (
        <div style={{ fontSize: 13, color: t.textMuted }}>
          No checklists yet. Add one above to get started.
        </div>
      ) : (
        checklists.map((checklist) => {
          const total = checklist.items.length;
          const done = checklist.items.filter((i) => i.done).length;
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);
          return (
            <div
              key={checklist.id}
              style={{
                backgroundColor: t.card,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: 10,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: t.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {checklist.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        backgroundColor: t.inputBg,
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: t.accentGrad,
                          transition: "width 0.2s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: t.textMuted,
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {done}/{total} ({pct}%)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteChecklist(checklist.id)}
                  title="Delete checklist"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "transparent",
                    border: "none",
                    color: t.textMuted,
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 6,
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {checklist.items.length === 0 ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: t.textFaint,
                      padding: "4px 0",
                    }}
                  >
                    No items yet.
                  </div>
                ) : (
                  checklist.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 6px",
                        borderRadius: 6,
                      }}
                    >
                      <button
                        onClick={() => handleToggleItem(checklist.id, item)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "transparent",
                          border: "none",
                          color: item.done ? t.accent : t.textMuted,
                          cursor: "pointer",
                          padding: 0,
                          flexShrink: 0,
                        }}
                      >
                        {item.done ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: item.done ? t.textMuted : t.text,
                          textDecoration: item.done ? "line-through" : "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                        title="Delete item"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "transparent",
                          border: "none",
                          color: t.textFaint,
                          cursor: "pointer",
                          padding: 2,
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 2,
                }}
              >
                <input
                  type="text"
                  placeholder="Add an item..."
                  value={itemInputs[checklist.id] || ""}
                  onChange={(e) =>
                    setItemInputs((prev) => ({
                      ...prev,
                      [checklist.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItem(checklist.id);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    borderRadius: 8,
                    padding: "6px 10px",
                    color: t.text,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => handleAddItem(checklist.id)}
                  disabled={
                    addingItem[checklist.id] ||
                    !(itemInputs[checklist.id] || "").trim()
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: t.btnSecBg,
                    border: `1px solid ${t.btnSecBorder}`,
                    color: t.btnSecText,
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity:
                      addingItem[checklist.id] ||
                      !(itemInputs[checklist.id] || "").trim()
                        ? 0.5
                        : 1,
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
