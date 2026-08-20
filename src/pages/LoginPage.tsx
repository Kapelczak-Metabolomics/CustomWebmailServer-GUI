import { useState } from "react";
import { useTheme } from "../theme";
import { useStore } from "../store";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function LoginPage() {
  const { tokens: t, appName, logoUrl } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate("/");
    else setError("Invalid email or password.");
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch {
      setForgotSent(true); // Don't leak whether email exists
    }
    setForgotLoading(false);
  }

  return (
    <div
      className="min-h-screen w-screen flex"
      style={{ backgroundColor: t.appBg }}
    >
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${t.sidebarBg} 0%, ${t.surface1} 50%, ${t.appBg} 100%)`,
        }}
      >
        {/* Animated blobs */}
        <div
          className="absolute top-10 left-10 w-72 h-72 rounded-full opacity-20 animate-blob"
          style={{ background: t.accentGrad, filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10 animate-blob"
          style={{
            background: t.accentGrad,
            filter: "blur(80px)",
            animationDelay: "4s",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in-down">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              className="h-10 w-auto rounded-lg object-contain"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: t.accentGrad, boxShadow: t.accentGlow }}
            >
              {appName[0] || "I"}
            </div>
          )}
          <span
            className="text-xl font-bold font-display"
            style={{ color: t.text }}
          >
            {appName}
          </span>
        </div>

        {/* Tagline */}
        <div className="relative z-10 animate-fade-in-up">
          <h1
            className="text-4xl font-bold font-display mb-4 leading-tight"
            style={{ color: t.text }}
          >
            The modern helpdesk
            <br />
            for teams that care.
          </h1>
          <p
            className="text-base max-w-md leading-relaxed"
            style={{ color: t.textMuted }}
          >
            Shared inboxes, live chat, knowledge base, and video meetings — all
            in one beautifully simple platform.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {[
              "Shared Inbox",
              "Live Chat",
              "Video Calls",
              "Knowledge Base",
              "Reports",
              "CRM",
            ].map((feat, i) => (
              <span
                key={feat}
                className="text-xs px-3 py-1.5 rounded-full animate-fade-in-up"
                style={{
                  backgroundColor: t.accentSoft,
                  color: t.accent,
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom decoration */}
        <div
          className="relative z-10 text-xs"
          style={{ color: t.textFaint }}
        >
          {appName} · Built with care
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={submit}
          className="w-full max-w-sm animate-fade-in-up"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={appName}
                className="h-10 w-auto rounded-lg object-contain"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: t.accentGrad, boxShadow: t.accentGlow }}
              >
                {appName[0] || "I"}
              </div>
            )}
            <span
              className="text-xl font-semibold font-display"
              style={{ color: t.text }}
            >
              {appName}
            </span>
          </div>

          <h2
            className="text-2xl font-bold font-display mb-1"
            style={{ color: t.text }}
          >
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: t.textMuted }}>
            Sign in to your account to continue.
          </p>

          {error && (
            <div
              className="text-sm p-3 rounded-lg mb-4 animate-fade-in"
              style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
            >
              {error}
            </div>
          )}

          <label
            className="block text-xs font-medium mb-1.5"
            style={{ color: t.textMuted }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3.5 py-3 rounded-xl text-sm mb-4 outline-none transition-all focus-ring"
            style={{
              backgroundColor: t.inputBg,
              border: `1px solid ${t.inputBorder}`,
              color: t.text,
            }}
            required
          />

          <label
            className="block text-xs font-medium mb-1.5"
            style={{ color: t.textMuted }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-3 rounded-xl text-sm mb-4 outline-none transition-all focus-ring"
            style={{
              backgroundColor: t.inputBg,
              border: `1px solid ${t.inputBorder}`,
              color: t.text,
            }}
            required
          />

          <div className="flex items-center justify-between mb-6">
            <label
              className="flex items-center gap-2 text-xs cursor-pointer"
              style={{ color: t.textMuted }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => {
                setShowForgot(true);
                setForgotEmail(email);
                setForgotSent(false);
              }}
              className="text-xs font-medium"
              style={{ color: t.accent }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: t.accentGrad,
              boxShadow: t.accentGlow,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {/* Demo credentials hint */}
          <div
            className="mt-6 p-3 rounded-lg text-xs text-center"
            style={{
              backgroundColor: t.surface1,
              border: `1px solid ${t.divider}`,
              color: t.textMuted,
            }}
          >
            Demo: <strong style={{ color: t.textSub }}>admin@example.com</strong>{" "}
            / <strong style={{ color: t.textSub }}>admin123</strong>
          </div>
        </form>
      </div>

      {/* Forgot password modal */}
      {showForgot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowForgot(false)}
        >
          <div
            className="rounded-xl p-6 max-w-sm w-full mx-4"
            style={{ backgroundColor: t.card, border: `1px solid ${t.divider}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {forgotSent ? (
              <>
                <h3 className="font-semibold text-base mb-2" style={{ color: t.text }}>
                  Check your email
                </h3>
                <p className="text-sm mb-4" style={{ color: t.textSub }}>
                  If an account exists for {forgotEmail}, a password reset link has been sent.
                </p>
                <button
                  onClick={() => setShowForgot(false)}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: t.accentGrad }}
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleForgot}>
                <h3 className="font-semibold text-base mb-2" style={{ color: t.text }}>
                  Reset password
                </h3>
                <p className="text-sm mb-4" style={{ color: t.textSub }}>
                  Enter your email and we'll send you a reset link.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-3 rounded-xl text-sm mb-4 outline-none"
                  style={{
                    backgroundColor: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: t.text,
                  }}
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: t.inputBg, color: t.text }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: t.accentGrad }}
                  >
                    {forgotLoading ? "Sending..." : "Send link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
