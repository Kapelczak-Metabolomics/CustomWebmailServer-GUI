import { useState } from "react";
import { useTheme } from "../theme";
import { useStore } from "../store";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { tokens: t, appName } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center p-6"
      style={{ backgroundColor: t.appBg }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          backgroundColor: t.card,
          border: `1px solid ${t.cardBorder}`,
          boxShadow: t.shadow,
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: t.accentGrad }}
          >
            I
          </div>
          <span className="text-xl font-semibold" style={{ color: t.text }}>
            {appName}
          </span>
        </div>

        <h2 className="text-lg font-semibold mb-1" style={{ color: t.text }}>
          Sign in
        </h2>
        <p className="text-sm mb-6" style={{ color: t.textMuted }}>
          Enter your work email and password to continue.
        </p>

        {error && (
          <div
            className="text-sm p-3 rounded-lg mb-4"
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
          className="w-full px-3 py-2.5 rounded-lg text-sm mb-4 outline-none"
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
          className="w-full px-3 py-2.5 rounded-lg text-sm mb-6 outline-none"
          style={{
            backgroundColor: t.inputBg,
            border: `1px solid ${t.inputBorder}`,
            color: t.text,
          }}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: t.accentGrad, boxShadow: t.accentGlow }}
        >
          {loading ? "Signing in..." : "Continue"}
        </button>

        <div
          className="mt-6 text-center text-xs"
          style={{ color: t.textMuted }}
        >
          Demo accounts:
          <br />
          <span className="font-mono" style={{ color: t.textSub }}>
            admin@example.com
          </span>
          ,{" "}
          <span className="font-mono" style={{ color: t.textSub }}>
            agent@example.com
          </span>
          <br />
          Password: <span className="font-mono">password</span>
        </div>
      </form>
    </div>
  );
}
