import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useTheme } from "../theme";
import { api } from "../lib/api";
import { formatDate } from "../lib/utils";
import type { SatisfactionRating } from "../types";

interface SatisfactionRatingProps {
  conversationId: string;
  readonly?: boolean;
}

function Stars({
  value,
  max = 5,
  activeColor,
  inactiveColor,
  size = 18,
  onClick,
  hoverValue,
  onHover,
}: {
  value: number;
  max?: number;
  activeColor: string;
  inactiveColor: string;
  size?: number;
  onClick?: (i: number) => void;
  hoverValue?: number | null;
  onHover?: (i: number | null) => void;
}) {
  const display = hoverValue ?? value;
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((i) => {
        const filled = i <= display;
        return (
          <button
            key={i}
            type="button"
            disabled={!onClick}
            onClick={() => onClick?.(i)}
            onMouseEnter={() => onHover?.(i)}
            onMouseLeave={() => onHover?.(null)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: onClick ? "pointer" : "default",
              lineHeight: 0,
            }}
            aria-label={`${i} star${i === 1 ? "" : "s"}`}
          >
            <Star
              size={size}
              fill={filled ? activeColor : "none"}
              color={filled ? activeColor : inactiveColor}
              strokeWidth={filled ? 0 : 1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function SatisfactionRating({
  conversationId,
  readonly = false,
}: SatisfactionRatingProps) {
  const { tokens: t } = useTheme();
  const [existing, setExisting] = useState<SatisfactionRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getSatisfactionRating(conversationId)
      .then((data: SatisfactionRating | null) => {
        if (cancelled) return;
        setExisting(data);
        if (data) {
          setRating(data.rating);
          setComment(data.comment || "");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setExisting(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Please select a star rating");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data: SatisfactionRating =
        await api.submitSatisfactionRating(conversationId, rating, comment);
      setExisting(data);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: "16px",
          borderRadius: 10,
          backgroundColor: t.card,
          border: `1px solid ${t.cardBorder}`,
          color: t.textMuted,
          fontSize: 13,
        }}
      >
        Loading rating…
      </div>
    );
  }

  // Display mode: readonly or an existing rating has already been submitted
  if (readonly || existing) {
    if (!existing) {
      return (
        <div
          style={{
            padding: "16px",
            borderRadius: 10,
            backgroundColor: t.card,
            border: `1px solid ${t.cardBorder}`,
            color: t.textMuted,
            fontSize: 13,
          }}
        >
          No rating submitted yet
        </div>
      );
    }
    return (
      <div
        style={{
          padding: "16px",
          borderRadius: 10,
          backgroundColor: t.card,
          border: `1px solid ${t.cardBorder}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <Stars
            value={existing.rating}
            activeColor={t.starActive}
            inactiveColor={t.starInactive}
          />
          <span style={{ color: t.textSub, fontSize: 12 }}>
            {formatDate(existing.createdAt)}
          </span>
        </div>
        {existing.comment && (
          <p
            style={{
              margin: 0,
              color: t.text,
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {existing.comment}
          </p>
        )}
      </div>
    );
  }

  // Submit mode
  if (submitted) {
    return (
      <div
        style={{
          padding: "16px",
          borderRadius: 10,
          backgroundColor: t.card,
          border: `1px solid ${t.cardBorder}`,
          color: t.text,
          fontSize: 14,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Star size={18} fill={t.starActive} color={t.starActive} strokeWidth={0} />
        Thank you!
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "16px",
        borderRadius: 10,
        backgroundColor: t.card,
        border: `1px solid ${t.cardBorder}`,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            color: t.text,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Rate your experience
        </div>
        <Stars
          value={rating}
          activeColor={t.starActive}
          inactiveColor={t.starInactive}
          size={26}
          onClick={(i) => setRating(i)}
          hoverValue={hover}
          onHover={setHover}
        />
      </div>

      <div>
        <label
          htmlFor={`satisfaction-comment-${conversationId}`}
          style={{
            display: "block",
            color: t.textSub,
            fontSize: 12,
            marginBottom: 6,
          }}
        >
          Comment (optional)
        </label>
        <textarea
          id={`satisfaction-comment-${conversationId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Tell us how we did…"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 10px",
            borderRadius: 8,
            backgroundColor: t.inputBg,
            border: `1px solid ${t.inputBorder}`,
            color: t.text,
            fontSize: 13,
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = t.inputFocusBorder;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = t.inputBorder;
          }}
        />
      </div>

      {error && (
        <div style={{ color: "#EF4444", fontSize: 12 }}>{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting || rating < 1}
        style={{
          alignSelf: "flex-start",
          padding: "8px 18px",
          borderRadius: 8,
          border: "none",
          background: t.accentGrad,
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: submitting || rating < 1 ? "not-allowed" : "pointer",
          opacity: submitting || rating < 1 ? 0.6 : 1,
        }}
      >
        {submitting ? "Submitting…" : "Submit Rating"}
      </button>
    </form>
  );
}
