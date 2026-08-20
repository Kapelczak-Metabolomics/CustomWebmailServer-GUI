import { useState } from "react";
import { useTheme } from "../theme";
import { api } from "../lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPasswordPage() {
  const { tokens: t } = useTheme();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Reset failed. The link may be invalid or expired.");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center"
      style={{ backgroundColor: t.appBg }}
    >
      <div
        className="rounded-xl p-8 max-w-sm w-full mx-4"
        style={{ backgroundColor: t.card, border: `1px solid ${t.divider}` }}
      >
        {success ? (
          <>
            <h2 className="text-lg font-semibold mb-2" style={{ color: t.text }}>
              Password reset
            </h2>
            <p className="text-sm mb-4" style={{ color: t.textSub }}>
              Your password has been updated. You can now sign in.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: t.accentGrad }}
            >
              Go to login
            </button>
          </>
        ) : !token ? (
          <>
            <h2 className="text-lg font-semibold mb-2" style={{ color: t.text }}>
              Invalid link
            </h2>
            <p className="text-sm mb-4" style={{ color: t.textSub }}>
              This reset link is missing a token. Please use the link from your email.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: t.accentGrad }}
            >
              Back to login
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: t.text }}>
              Reset password
            </h2>
            <p className="text-sm mb-4" style={{ color: t.textSub }}>
              Enter your new password below.
            </p>
            {error && (
              <div
                className="mb-3 px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
              >
                {error}
              </div>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-3.5 py-3 rounded-xl text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
              required
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-3.5 py-3 rounded-xl text-sm mb-4 outline-none"
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
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: t.accentGrad }}
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
