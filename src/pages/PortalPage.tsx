import { useState, useMemo } from "react";
import { useTheme } from "../theme";
import { useStore } from "../store";
import Layout from "../components/Layout";
import { Search, ArrowLeft, HelpCircle } from "lucide-react";

export default function PortalPage() {
  const { tokens: t } = useTheme();
  const articles = useStore((s) => s.articles);
  const published = useMemo(
    () => articles.filter((a) => a.published),
    [articles],
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = published.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.body.toLowerCase().includes(search.toLowerCase()),
  );
  const cats = Array.from(new Set(published.map((a) => a.category)));

  const active = articles.find((a) => a.id === selected);

  return (
    <Layout>
      <div
        className="h-full overflow-y-auto"
        style={{ backgroundColor: t.readMain }}
      >
        <div className="w-full p-6">
          {active ? (
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: t.card,
                border: `1px solid ${t.cardBorder}`,
              }}
            >
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1 text-xs mb-4"
                style={{ color: t.accent }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to help center
              </button>
              <span
                className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full"
                style={{ backgroundColor: t.badgeBg, color: t.textSub }}
              >
                {active.category}
              </span>
              <h1
                className="text-2xl font-semibold mt-3 mb-4"
                style={{ color: t.text }}
              >
                {active.title}
              </h1>
              <div
                className="text-sm"
                style={{ color: t.textSub }}
                dangerouslySetInnerHTML={{ __html: active.body }}
              />
            </div>
          ) : (
            <>
              <div className="text-center py-10">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                  style={{ backgroundColor: `${t.accent}22` }}
                >
                  <HelpCircle className="w-6 h-6" style={{ color: t.accent }} />
                </div>
                <h1
                  className="text-2xl font-semibold mb-2"
                  style={{ color: t.text }}
                >
                  Help Center
                </h1>
                <p className="text-sm mb-6" style={{ color: t.textMuted }}>
                  Search our knowledge base for answers.
                </p>
                <div className="relative max-w-md mx-auto">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: t.textFaint }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="What can we help you with?"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cats.map((cat) => (
                  <div
                    key={cat}
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: t.card,
                      border: `1px solid ${t.cardBorder}`,
                    }}
                  >
                    <h3
                      className="text-sm font-semibold mb-3"
                      style={{ color: t.text }}
                    >
                      {cat}
                    </h3>
                    <div className="space-y-2">
                      {filtered
                        .filter((a) => a.category === cat)
                        .map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setSelected(a.id)}
                            className="w-full text-left text-sm"
                            style={{ color: t.accent }}
                          >
                            {a.title}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <p
                  className="text-center text-sm mt-8"
                  style={{ color: t.textMuted }}
                >
                  No articles found.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
