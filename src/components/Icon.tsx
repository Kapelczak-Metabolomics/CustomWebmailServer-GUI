export const Icon = {
  Compose: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="w-4 h-4"
    >
      <path d="M4 14l1.5-4.5L14 1l4 4-8.5 8.5L5 15z" strokeLinejoin="round" />
      <path d="M11.5 3.5l4 4" />
      <path d="M4 16h12" strokeLinecap="round" />
    </svg>
  ),
  Inbox: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path d="M3 8h14l-2 7H5L3 8z" strokeLinejoin="round" />
      <path d="M7 8V5a3 3 0 016 0v3" />
      <path d="M7 12h6" strokeLinecap="round" />
    </svg>
  ),
  Star: ({ filled }: { filled?: boolean }) => (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path
        d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L10 14.4l-4.8 2.5.9-5.4L2.2 7.7l5.4-.8L10 2z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Send: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path d="M17 3L3 9l6 2 2 6 6-14z" strokeLinejoin="round" />
      <path d="M9 11l3-3" />
    </svg>
  ),
  Draft: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path
        d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6l-4-4z"
        strokeLinejoin="round"
      />
      <path d="M14 2v4h4M7 9h6M7 12h4" strokeLinecap="round" />
    </svg>
  ),
  Archive: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path d="M3 5h14v2H3z" strokeLinejoin="round" />
      <path d="M5 7v9h10V7" />
      <path d="M8 11h4" strokeLinecap="round" />
    </svg>
  ),
  Spam: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6v5M10 13.5v.5" strokeLinecap="round" />
    </svg>
  ),
  Trash: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path d="M5 6h10l-1 11H6L5 6z" strokeLinejoin="round" />
      <path d="M3 6h14M8 3h4" strokeLinecap="round" />
    </svg>
  ),
  Reply: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="w-4 h-4"
    >
      <path
        d="M3 8l5-5v3c5 0 9 3 9 9-2-3-5-5-9-5v3L3 8z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ReplyAll: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="w-4 h-4"
    >
      <path
        d="M1 8l4-4v3c5 0 9 3 9 9-2-3-5-5-9-5v3L1 8z"
        strokeLinejoin="round"
      />
      <path d="M6 6l4-4" strokeLinecap="round" />
    </svg>
  ),
  Forward: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="w-4 h-4"
    >
      <path
        d="M17 8l-5-5v3c-5 0-9 3-9 9 2-3 5-5 9-5v3l5-5z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Delete: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path d="M5 6h10l-1 11H6L5 6z" strokeLinejoin="round" />
      <path d="M3 6h14M8 3h4" strokeLinecap="round" />
    </svg>
  ),
  MarkUnread: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path d="M3 6h14v10H3z" strokeLinejoin="round" />
      <path d="M3 6l7 6 7-6" />
      <circle cx="15" cy="5" r="3" fill="#2896E8" stroke="none" />
    </svg>
  ),
  Print: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path d="M5 7V3h10v4M5 13H3V8h14v5h-2" strokeLinejoin="round" />
      <path d="M5 12h10v6H5z" />
      <path d="M7 15h6M7 17h4" strokeLinecap="round" />
    </svg>
  ),
  Search: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="w-4 h-4"
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
    </svg>
  ),
  Filter: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path d="M3 5h14M6 10h8M9 15h2" strokeLinecap="round" />
    </svg>
  ),
  Attachment: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-3.5 h-3.5"
    >
      <path
        d="M16.5 9.5l-7 7a4.5 4.5 0 01-6.36-6.36l7-7a3 3 0 014.24 4.24l-7.07 7.07a1.5 1.5 0 01-2.12-2.12l6.36-6.36"
        strokeLinecap="round"
      />
    </svg>
  ),
  ChevronDown: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-3.5 h-3.5"
    >
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Close: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-4 h-4"
    >
      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
  ),
  Maximize: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path
        d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  More: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  ),
  Label: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <path d="M3 3h8l6 7-6 7H3V3z" strokeLinejoin="round" />
    </svg>
  ),
  Settings: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-4 h-4"
    >
      <circle cx="10" cy="10" r="3" />
      <path
        d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
        strokeLinecap="round"
      />
    </svg>
  ),
  Minimize: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-3.5 h-3.5"
    >
      <path d="M5 10h10" strokeLinecap="round" />
    </svg>
  ),
  Moon: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="w-4 h-4"
    >
      <path
        d="M17 11.5A7.5 7.5 0 118.5 3a5.5 5.5 0 008.5 8.5z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Sun: () => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="w-4 h-4"
    >
      <circle cx="10" cy="10" r="3.5" />
      <path
        d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  ),
};
