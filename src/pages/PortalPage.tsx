import { useState, useEffect } from "react";
import { useTheme } from "../theme";
import { api } from "../lib/api";
import type { KnowledgeBaseArticle } from "../types";
import { Search, FileText, Send, Ticket, ArrowLeft, BookOpen } from "lucide-react";

interface PortalTicket {
  number: number;
  subject: string;
  status: string;
  priority: string;
  messages: {
    id: string;
    type: string;
    body: string;
    authorName: string;
    createdAt: string;
  }[];
}

export default function PortalPage() {
  const { tokens: t, appName, logoUrl } = useTheme();
  const [view, setView] = useState<"home" | "kb" | "submit" | "ticket">("home");
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);

  // Submit form
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState("");

  // View ticket
  const [ticketNum, setTicketNum] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticket, setTicket] = useState<PortalTicket | null>(null);
  const [ticketError, setTicketError] = useState("");

  useEffect(() => {
    api.listPublicArticles().then(setArticles).catch(() => {});
  }, []);

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await api.submitPortalTicket(form);
      setSubmitResult(result.number);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleViewTicket(e: React.FormEvent) {
    e.preventDefault();
    setTicketError("");
    try {
      const data = (await api.getPortalTicket(
        parseInt(ticketNum),
        ticketEmail,
      )) as PortalTicket;
      setTicket(data);
    } catch (err: any) {
      setTicketError(err.message || "Ticket not found");
      setTicket(null);
    }
  }

  return (
    <div className="min-h-screen w-screen" style={{ backgroundColor: t.appBg }}>
      {/* Header */}
      <header
        className="border-b sticky top-0 z-10"
        style={{
          backgroundColor: t.sidebarBg,
          borderColor: t.divider,
          backgroundImage: `linear-gradient(180deg, ${t.sidebarBg}, ${t.readLeftBg})`,
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={appName}
                className="h-8 w-auto rounded-lg object-contain"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: t.accentGrad }}
              >
                {appName[0] || "I"}
              </div>
            )}
            <span className="text-lg font-semibold" style={{ color: t.text }}>
              {appName} Help Center
            </span>
          </div>
          <button
            onClick={() => setView("home")}
            className="text-sm flex items-center gap-1"
            style={{ color: t.textMuted }}
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {view === "home" && (
          <div>
            {/* Hero */}
            <div className="text-center mb-12">
              <h1
                className="text-3xl font-bold mb-3"
                style={{ color: t.text }}
              >
                How can we help?
              </h1>
              <div className="relative max-w-xl mx-auto">
                <Search
                  className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: t.textFaint }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: t.text,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredArticles.length > 0) {
                      setSelectedArticle(filteredArticles[0]);
                      setView("kb");
                    }
                  }}
                />
              </div>
            </div>

            {/* Action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              <button
                onClick={() => setView("kb")}
                className="rounded-xl p-6 text-left transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: t.card,
                  border: `1px solid ${t.cardBorder}`,
                }}
              >
                <BookOpen className="w-8 h-8 mb-3" style={{ color: t.accent }} />
                <h3 className="font-semibold mb-1" style={{ color: t.text }}>
                  Knowledge Base
                </h3>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Browse articles and guides
                </p>
              </button>
              <button
                onClick={() => setView("submit")}
                className="rounded-xl p-6 text-left transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: t.card,
                  border: `1px solid ${t.cardBorder}`,
                }}
              >
                <Ticket className="w-8 h-8 mb-3" style={{ color: t.accent }} />
                <h3 className="font-semibold mb-1" style={{ color: t.text }}>
                  Submit a Ticket
                </h3>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Get help from our team
                </p>
              </button>
              <button
                onClick={() => setView("ticket")}
                className="rounded-xl p-6 text-left transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: t.card,
                  border: `1px solid ${t.cardBorder}`,
                }}
              >
                <FileText className="w-8 h-8 mb-3" style={{ color: t.accent }} />
                <h3 className="font-semibold mb-1" style={{ color: t.text }}>
                  View My Ticket
                </h3>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Check your ticket status
                </p>
              </button>
            </div>

            {/* Featured articles */}
            {filteredArticles.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: t.text }}>
                  Popular Articles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredArticles.slice(0, 6).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedArticle(a);
                        setView("kb");
                      }}
                      className="rounded-lg p-4 text-left flex items-start gap-3 transition-colors"
                      style={{
                        backgroundColor: t.card,
                        border: `1px solid ${t.cardBorder}`,
                      }}
                    >
                      <FileText className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: t.accent }} />
                      <div>
                        <div className="font-medium text-sm" style={{ color: t.text }}>
                          {a.title}
                        </div>
                        <div className="text-xs mt-1" style={{ color: t.textMuted }}>
                          {a.category}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === "kb" && (
          <div>
            <button
              onClick={() => setView("home")}
              className="text-sm flex items-center gap-1 mb-6"
              style={{ color: t.textMuted }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {selectedArticle ? (
              <div
                className="rounded-xl p-8 max-w-3xl"
                style={{
                  backgroundColor: t.card,
                  border: `1px solid ${t.cardBorder}`,
                }}
              >
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full inline-block mb-4"
                  style={{ backgroundColor: t.badgeBg, color: t.textSub }}
                >
                  {selectedArticle.category}
                </span>
                <h1 className="text-2xl font-bold mb-6" style={{ color: t.text }}>
                  {selectedArticle.title}
                </h1>
                <div
                  className="prose max-w-none text-sm leading-relaxed"
                  style={{ color: t.textSub }}
                  dangerouslySetInnerHTML={{ __html: selectedArticle.body }}
                />
              </div>
            ) : (
              <div>
                <div className="relative mb-6">
                  <Search
                    className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: t.textFaint }}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                </div>
                <div className="space-y-3">
                  {filteredArticles.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedArticle(a)}
                      className="w-full text-left rounded-lg p-4 flex items-start gap-3 transition-colors"
                      style={{
                        backgroundColor: t.card,
                        border: `1px solid ${t.cardBorder}`,
                      }}
                    >
                      <FileText className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: t.accent }} />
                      <div>
                        <div className="font-medium text-sm" style={{ color: t.text }}>
                          {a.title}
                        </div>
                        <div className="text-xs mt-1" style={{ color: t.textMuted }}>
                          {a.category}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredArticles.length === 0 && (
                    <p className="text-sm text-center py-8" style={{ color: t.textMuted }}>
                      No articles found.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {view === "submit" && (
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setView("home")}
              className="text-sm flex items-center gap-1 mb-6"
              style={{ color: t.textMuted }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-2xl font-bold mb-6" style={{ color: t.text }}>
              Submit a Ticket
            </h1>
            {submitResult ? (
              <div
                className="rounded-xl p-6 text-center"
                style={{
                  backgroundColor: t.card,
                  border: `1px solid ${t.cardBorder}`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${t.accent}22` }}
                >
                  <Ticket className="w-6 h-6" style={{ color: t.accent }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: t.text }}>
                  Ticket #{submitResult} submitted!
                </h3>
                <p className="text-sm mb-4" style={{ color: t.textMuted }}>
                  We will get back to you shortly. Save your ticket number to check the status later.
                </p>
                <button
                  onClick={() => {
                    setSubmitResult(null);
                    setForm({ name: "", email: "", subject: "", body: "" });
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: t.accentGrad }}
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-xl p-6 space-y-4"
                style={{
                  backgroundColor: t.card,
                  border: `1px solid ${t.cardBorder}`,
                }}
              >
                {submitError && (
                  <div
                    className="text-sm p-3 rounded-lg"
                    style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
                  >
                    {submitError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: t.textMuted }}>
                    Your name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: t.textMuted }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: t.textMuted }}>
                    Subject
                  </label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: t.textMuted }}>
                    Message
                  </label>
                  <textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    required
                    className="w-full min-h-[140px] px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: t.accentGrad }}
                >
                  {submitting ? "Submitting..." : (
                    <>
                      <Send className="w-4 h-4" /> Submit Ticket
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {view === "ticket" && (
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setView("home")}
              className="text-sm flex items-center gap-1 mb-6"
              style={{ color: t.textMuted }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-2xl font-bold mb-6" style={{ color: t.text }}>
              View My Ticket
            </h1>
            {!ticket && (
              <form
                onSubmit={handleViewTicket}
                className="rounded-xl p-6 space-y-4"
                style={{
                  backgroundColor: t.card,
                  border: `1px solid ${t.cardBorder}`,
                }}
              >
                {ticketError && (
                  <div
                    className="text-sm p-3 rounded-lg"
                    style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
                  >
                    {ticketError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: t.textMuted }}>
                    Ticket number
                  </label>
                  <input
                    type="number"
                    value={ticketNum}
                    onChange={(e) => setTicketNum(e.target.value)}
                    required
                    placeholder="e.g. 1001"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: t.textMuted }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={ticketEmail}
                    onChange={(e) => setTicketEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: t.accentGrad }}
                >
                  Find Ticket
                </button>
              </form>
            )}
            {ticket && (
              <div>
                <div
                  className="rounded-xl p-5 mb-4"
                  style={{
                    backgroundColor: t.card,
                    border: `1px solid ${t.cardBorder}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold" style={{ color: t.text }}>
                      #{ticket.number} - {ticket.subject}
                    </h3>
                    <span
                      className="text-[10px] px-2 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          ticket.status === "open" ? `${t.accent}22` : t.badgeBg,
                        color: ticket.status === "open" ? t.accent : t.textMuted,
                      }}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {ticket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: t.card,
                        border: `1px solid ${t.cardBorder}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold" style={{ color: t.text }}>
                          {msg.authorName}
                        </span>
                        <span className="text-[10px]" style={{ color: t.textMuted }}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: t.textSub }}
                        dangerouslySetInnerHTML={{ __html: msg.body }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setTicket(null);
                    setTicketNum("");
                    setTicketEmail("");
                  }}
                  className="mt-4 text-sm"
                  style={{ color: t.accent }}
                >
                  Check another ticket
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
