import { useState } from "react";
import { useTheme } from "../theme";
import { useStore } from "../store";
import Layout from "../components/Layout";
import { formatDate } from "../lib/utils";
import { Search, Plus, BookOpen, Eye, Edit3, X } from "lucide-react";

export default function KnowledgeBasePage() {
  const { tokens: t } = useTheme();
  const articles = useStore((s) => s.articles);
  const addArticle = useStore((s) => s.addArticle);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "General",
    body: "",
  });

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()),
  );
  const cats = Array.from(new Set(articles.map((a) => a.category)));

  function handleAdd() {
    if (!form.title.trim() || !form.body.trim()) return;
    addArticle({ title: form.title, category: form.category, body: form.body });
    setForm({ title: "", category: "General", body: "" });
    setShowAdd(false);
  }

  const active = articles.find((a) => a.id === selected);

  return (
    <Layout>
      <div className="h-full flex flex-col md:flex-row overflow-hidden">
        <div
          className="w-full md:w-[320px] flex-shrink-0 h-full border-r flex flex-col"
          style={{ borderColor: t.divider, backgroundColor: t.readLeftBg }}
        >
          <div className="p-4 border-b" style={{ borderColor: t.divider }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ color: t.text }}>
                Knowledge Base
              </h2>
              <button
                onClick={() => setShowAdd(true)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: t.accent, color: "#fff" }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: t.textFaint }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setSearch(c)}
                  className="text-[10px] px-2 py-1 rounded-full"
                  style={{ backgroundColor: t.badgeBg, color: t.textSub }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className="w-full text-left px-4 py-3 border-b flex items-start gap-3"
                style={{
                  backgroundColor:
                    selected === a.id ? t.rowSelected : "transparent",
                  borderColor: t.divider,
                }}
              >
                <BookOpen
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: t.accent }}
                />
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: t.text }}
                  >
                    {a.title}
                  </div>
                  <div className="text-xs" style={{ color: t.textMuted }}>
                    {a.category} • {formatDate(a.updatedAt)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          className="flex-1 min-w-0 h-full overflow-y-auto p-6"
          style={{ backgroundColor: t.readMain }}
        >
          {active ? (
            <div
              className="max-w-3xl mx-auto rounded-xl p-6"
              style={{
                backgroundColor: t.card,
                border: `1px solid ${t.cardBorder}`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full"
                  style={{ backgroundColor: t.badgeBg, color: t.textSub }}
                >
                  {active.category}
                </span>
                <div
                  className="flex items-center gap-2"
                  style={{ color: t.textMuted }}
                >
                  <Eye className="w-4 h-4" />{" "}
                  <span className="text-xs">Public</span>
                </div>
              </div>
              <h1
                className="text-2xl font-semibold mb-4"
                style={{ color: t.text }}
              >
                {active.title}
              </h1>
              <div
                className="prose prose-invert max-w-none text-sm"
                style={{ color: t.textSub }}
                dangerouslySetInnerHTML={{ __html: active.body }}
              />
            </div>
          ) : (
            <div
              className="h-full flex flex-col items-center justify-center"
              style={{ color: t.textMuted }}
            >
              <BookOpen className="w-12 h-12 mb-4" />
              <p className="text-sm">
                Select an article to read or create a new one.
              </p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
            style={{ backgroundColor: t.readLeftBg, boxShadow: t.shadow }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: t.text }}>
                New article
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1"
                style={{ color: t.textSub }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Category"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Article body (HTML supported)"
                className="w-full min-h-[200px] px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ color: t.textSub }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: t.accentGrad }}
              >
                <Edit3 className="w-4 h-4 inline mr-1" /> Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
