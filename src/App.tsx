import { useState, createContext, useContext } from 'react'
import React from 'react'
import logoImg from '@/imports/isotopiq-logo-light.png'

// ─── Theme ────────────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} })
const useTheme = () => useContext(ThemeContext)

const DARK = {
  appBg:        '#070B14',
  sidebarBg:    '#070B14',
  sidebarBorder:'#1C2540',
  listBg:       '#0A0F1A',
  listBorder:   '#1C2540',
  readBg:       '#070B14',
  readTopBg:    '#0A0F1A',
  card:         '#0E1420',
  cardBorder:   '#1C2540',
  inputBg:      '#111827',
  inputBorder:  '#1C2540',
  composeBg:    '#0E1420',
  composeHead:  '#1C2540',
  text:         '#E8EDF5',
  textSub:      '#8B96B0',
  textMuted:    '#6B7A96',
  textFaint:    '#4A5A7A',
  textGhost:    '#3A4A6A',
  textGhost2:   '#2D3A5C',
  divider:      '#1C2540',
  rowHover:     '#ffffff04',
  rowSelected:  '#2896E810',
  navActive:    '#2896E820',
  navHover:     '#ffffff08',
  pill:         '#111827',
  pillBorder:   '#1C2540',
  pillText:     '#6B7A96',
  badgeBg:      '#1C2540',
  badgeText:    '#8B96B0',
  unreadDot:    '#2896E8',
  accent:       '#2896E8',
  accentGrad:   'linear-gradient(135deg, #2896E8 0%, #1565C0 100%)',
  accentGlow:   '0 4px 16px rgba(40,150,232,0.35)',
  replyBorder:  '#2896E840',
  btnSecBg:     '#0E1420',
  btnSecBorder: '#1C2540',
  btnSecText:   '#8B96B0',
  btnSecHover:  '#151C2C',
  starActive:   '#F59E0B',
  starInactive: '#4A5A7A',
  attachColor:  '#4A5A7A',
  composeComposeBorder: '#2D3A5C',
  scrollThumb:  '#1C2540',
  shadow:       '0 20px 60px rgba(0,0,0,0.6)',
}

const LIGHT = {
  appBg:        '#F0F4FA',
  sidebarBg:    '#FFFFFF',
  sidebarBorder:'#E2E8F4',
  listBg:       '#F7F9FD',
  listBorder:   '#E2E8F4',
  readBg:       '#F0F4FA',
  readTopBg:    '#FFFFFF',
  card:         '#FFFFFF',
  cardBorder:   '#E2E8F4',
  inputBg:      '#EEF2FA',
  inputBorder:  '#D8E0F0',
  composeBg:    '#FFFFFF',
  composeHead:  '#F0F4FA',
  composeComposeBorder: '#D0D8EC',
  text:         '#0F1729',
  textSub:      '#374163',
  textMuted:    '#5A6480',
  textFaint:    '#8894B0',
  textGhost:    '#A0AACC',
  textGhost2:   '#BCC5DF',
  divider:      '#E2E8F4',
  rowHover:     '#EEF2FA',
  rowSelected:  '#EBF5FF',
  navActive:    '#E8F2FD',
  navHover:     '#F5F8FF',
  pill:         '#EEF2FA',
  pillBorder:   '#D8E0F0',
  pillText:     '#5A6480',
  badgeBg:      '#EEF2FA',
  badgeText:    '#5A6480',
  unreadDot:    '#2896E8',
  accent:       '#2896E8',
  accentGrad:   'linear-gradient(135deg, #2896E8 0%, #1565C0 100%)',
  accentGlow:   '0 4px 16px rgba(40,150,232,0.28)',
  replyBorder:  '#2896E840',
  btnSecBg:     '#FFFFFF',
  btnSecBorder: '#D8E0F0',
  btnSecText:   '#374163',
  btnSecHover:  '#F0F4FA',
  starActive:   '#F59E0B',
  starInactive: '#A0AACC',
  attachColor:  '#8894B0',
  scrollThumb:  '#CBD5E8',
  shadow:       '0 20px 60px rgba(0,0,0,0.12)',
}

type Tokens = typeof DARK

// ─── Types ───────────────────────────────────────────────────────────────────

interface Email {
  id: string
  from: string
  fromEmail: string
  fromAvatar: string
  to: string[]
  subject: string
  preview: string
  body: string
  timestamp: string
  date: string
  read: boolean
  starred: boolean
  folder: Folder
  hasAttachment: boolean
  labels: string[]
  cc?: string[]
}

type Folder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_EMAILS: Email[] = [
  {
    id: '1',
    from: 'Sarah Chen',
    fromEmail: 'sarah.chen@isotopiq.io',
    fromAvatar: 'SC',
    to: ['me@isotopiq.io'],
    subject: 'Q3 Platform Analytics Report — Action Required',
    preview: "Hi, I've finished compiling the Q3 analytics report. The numbers are looking strong overall but there are a few areas we should discuss before the board presentation next week.",
    body: `<p>Hi,</p><p>I've finished compiling the Q3 analytics report. The numbers are looking strong overall but there are a few areas we should discuss before the board presentation next week.</p><p><strong>Key highlights:</strong></p><ul><li>Monthly active users up 34% QoQ</li><li>API call volume hit 2.1B (new record)</li><li>Churn rate dropped to 2.3% — lowest in company history</li><li>Revenue grew 28% to $4.7M ARR</li></ul><p>The one concern is infrastructure costs, which grew 41% against the 28% revenue growth. I've flagged this for the engineering team and Ravi has a plan to address it in Q4.</p><p>Can we schedule a 30-minute sync this week to walk through the details before I send it to the board? I'm free Thursday afternoon or Friday morning.</p><p>Best,<br/>Sarah</p>`,
    timestamp: '9:42 AM',
    date: 'Today',
    read: false,
    starred: true,
    folder: 'inbox',
    hasAttachment: true,
    labels: ['Important', 'Finance'],
  },
  {
    id: '2',
    from: 'Marcus Rivera',
    fromEmail: 'mrivera@neuralstack.dev',
    fromAvatar: 'MR',
    to: ['me@isotopiq.io'],
    subject: 'Partnership Proposal — Neural Stack × Isotopiq Integration',
    preview: "Following up on our conversation at WebSummit. We believe there's a strong synergy between our ML inference layer and your data pipeline infrastructure.",
    body: `<p>Hi,</p><p>Following up on our conversation at WebSummit last month. Our team has been putting together a formal integration proposal and I think the timing is right.</p><p>Neural Stack's ML inference layer processes over 50B tokens monthly across our enterprise clients. Your data pipeline infrastructure would let us reduce latency by an estimated 40% while cutting our cloud spend significantly.</p><p>We're proposing a white-label integration with a revenue share model — 70/30 in your favor for the first two years given you'd be the primary infrastructure provider.</p><p>I've attached a full technical spec and business case. Would love to get on a call with your BD and engineering leads in the next two weeks.</p><p>Regards,<br/>Marcus Rivera<br/>Co-founder & CTO, Neural Stack</p>`,
    timestamp: 'Yesterday',
    date: 'Aug 14',
    read: false,
    starred: false,
    folder: 'inbox',
    hasAttachment: true,
    labels: ['Partnership'],
  },
  {
    id: '3',
    from: 'Figma',
    fromEmail: 'noreply@figma.com',
    fromAvatar: 'FG',
    to: ['me@isotopiq.io'],
    subject: 'Lena Kim shared "Isotopiq Design System v2.0" with you',
    preview: 'Lena Kim (lkim@isotopiq.io) has shared a Figma file with you: "Isotopiq Design System v2.0 — All Components".',
    body: `<p>Lena Kim (<a href="mailto:lkim@isotopiq.io">lkim@isotopiq.io</a>) has shared a Figma file with you.</p><p><strong>Isotopiq Design System v2.0 — All Components</strong></p><p>Click the button below to open this file in Figma.</p><p><em>You are receiving this email because you have a Figma account associated with this email address.</em></p>`,
    timestamp: 'Aug 13',
    date: 'Aug 13',
    read: true,
    starred: false,
    folder: 'inbox',
    hasAttachment: false,
    labels: ['Design'],
  },
  {
    id: '4',
    from: 'Priya Nair',
    fromEmail: 'priya@isotopiq.io',
    fromAvatar: 'PN',
    to: ['me@isotopiq.io'],
    subject: 'Re: Kubernetes cluster autoscaling issue',
    preview: "The incident is resolved. Root cause was a misconfigured HPA that caused a cascading failure across the eu-west-2 nodes. Full post-mortem attached.",
    body: `<p>The incident is fully resolved as of 03:14 UTC.</p><p><strong>Root cause:</strong> A misconfigured Horizontal Pod Autoscaler in the eu-west-2 region set the minimum replicas to 0 during the scheduled maintenance window. When traffic spiked at 02:47 UTC, the cluster couldn't scale fast enough, causing a cascading failure.</p><p><strong>Timeline:</strong></p><ul><li>02:47 UTC — Anomalous traffic spike detected</li><li>02:51 UTC — First alert fires (P1)</li><li>02:58 UTC — On-call engineer paged</li><li>03:09 UTC — Root cause identified</li><li>03:14 UTC — HPA corrected, cluster healthy</li></ul><p>Total customer impact: ~23 minutes of degraded service for eu-west-2 customers. We're drafting a customer communication now.</p><p>Full post-mortem is attached. Action items assigned in Linear.</p><p>— Priya</p>`,
    timestamp: 'Aug 12',
    date: 'Aug 12',
    read: true,
    starred: true,
    folder: 'inbox',
    hasAttachment: true,
    labels: ['Engineering'],
  },
  {
    id: '5',
    from: 'GitHub',
    fromEmail: 'noreply@github.com',
    fromAvatar: 'GH',
    to: ['me@isotopiq.io'],
    subject: '[isotopiq/core] PR #847 merged: feat: streaming response support',
    preview: "James Okafor merged pull request #847 into main: feat: add streaming response support for real-time data pipeline queries.",
    body: `<p><strong>james-okafor</strong> merged pull request <strong>#847</strong> into <code>main</code>.</p><p><strong>feat: add streaming response support for real-time data pipeline queries</strong></p><p>This PR implements Server-Sent Events (SSE) for the query API, enabling clients to receive partial results as they stream in rather than waiting for the full query to complete.</p><p>Changes include:</p><ul><li>New <code>/api/v2/query/stream</code> endpoint</li><li>SSE handler in the Go backend</li><li>Client SDK updated to handle streaming responses</li><li>Docs updated</li></ul><p>Resolves #812, #834</p>`,
    timestamp: 'Aug 11',
    date: 'Aug 11',
    read: true,
    starred: false,
    folder: 'inbox',
    hasAttachment: false,
    labels: ['Engineering'],
  },
  {
    id: '6',
    from: 'Stripe',
    fromEmail: 'receipt@stripe.com',
    fromAvatar: 'ST',
    to: ['me@isotopiq.io'],
    subject: 'Your Stripe invoice — $14,200.00 for August',
    preview: 'Invoice #1234567 from Stripe Billing. Amount due: $14,200.00. Due date: September 1, 2026.',
    body: `<p>Your monthly invoice is ready.</p><p><strong>Invoice #INV-2026-08-001</strong><br/>Period: August 1 – August 31, 2026<br/>Due: September 1, 2026</p><p><strong>Line items:</strong></p><ul><li>Platform fee (Enterprise) — $8,000.00</li><li>Overage: API calls (2.1B / 2B included) — $4,200.00</li><li>Data egress — $2,000.00</li></ul><p><strong>Total: $14,200.00</strong></p>`,
    timestamp: 'Aug 10',
    date: 'Aug 10',
    read: true,
    starred: false,
    folder: 'inbox',
    hasAttachment: true,
    labels: ['Finance'],
  },
  {
    id: '7',
    from: 'Me',
    fromEmail: 'me@isotopiq.io',
    fromAvatar: 'ME',
    to: ['board@isotopiq.io', 'exec@isotopiq.io'],
    subject: 'August Engineering All-Hands — Agenda & Logistics',
    preview: "Team, the August All-Hands is confirmed for Thursday, August 20 at 10:00 AM PT. Zoom link and agenda attached. Please review the product roadmap section before attending.",
    body: `<p>Team,</p><p>The August Engineering All-Hands is confirmed for <strong>Thursday, August 20 at 10:00 AM PT</strong>.</p><p>Zoom: https://zoom.us/j/987654321 | Password: isotopiq2026</p><p><strong>Agenda:</strong></p><ol><li>Q3 recap — Sarah Chen (10 min)</li><li>Product roadmap — CTO (20 min)</li><li>Platform reliability update — Priya Nair (15 min)</li><li>Team announcements (10 min)</li><li>Open Q&A (15 min)</li></ol><p>Please come prepared. Full agenda doc linked below.</p>`,
    timestamp: 'Aug 9',
    date: 'Aug 9',
    read: true,
    starred: false,
    folder: 'sent',
    hasAttachment: false,
    labels: [],
  },
  {
    id: '8',
    from: 'Me',
    fromEmail: 'me@isotopiq.io',
    fromAvatar: 'ME',
    to: ['talent@isotopiq.io'],
    subject: 'Draft: Offer letter — Senior Backend Engineer',
    preview: 'Draft in progress. Reviewing compensation band before sending to candidate.',
    body: `<p>[DRAFT — do not send]</p><p>Hi Jordan,</p><p>We're thrilled to offer you the position of Senior Backend Engineer at Isotopiq...</p>`,
    timestamp: 'Aug 8',
    date: 'Aug 8',
    read: true,
    starred: false,
    folder: 'drafts',
    hasAttachment: false,
    labels: [],
  },
  {
    id: '9',
    from: 'LinkedIn',
    fromEmail: 'jobs@linkedin.com',
    fromAvatar: 'LI',
    to: ['me@isotopiq.io'],
    subject: '3 new applicants for your Senior Backend Engineer posting',
    preview: 'You have 3 new applicants for "Senior Backend Engineer at Isotopiq". Click to review their profiles.',
    body: `<p>You have <strong>3 new applicants</strong> for your job posting: <strong>Senior Backend Engineer at Isotopiq</strong>.</p><p>Review their profiles on LinkedIn Jobs to move them forward.</p>`,
    timestamp: 'Aug 7',
    date: 'Aug 7',
    read: true,
    starred: false,
    folder: 'archive',
    hasAttachment: false,
    labels: [],
  },
  {
    id: '10',
    from: 'Unknown Sender',
    fromEmail: 'promo99@deals-now.biz',
    fromAvatar: 'SP',
    to: ['me@isotopiq.io'],
    subject: 'YOU HAVE WON!! Claim your $5000 prize NOW',
    preview: 'Congratulations! Your email has been selected as the winner of our monthly draw. Click here to claim your $5000 cash prize immediately!',
    body: `<p>CONGRATULATIONS! Your email has been selected as this month's winner...</p>`,
    timestamp: 'Aug 6',
    date: 'Aug 6',
    read: true,
    starred: false,
    folder: 'spam',
    hasAttachment: false,
    labels: [],
  },
]

const FOLDER_LABELS: Record<Folder, string> = {
  inbox: 'Inbox',
  starred: 'Starred',
  sent: 'Sent',
  drafts: 'Drafts',
  archive: 'Archive',
  spam: 'Spam',
  trash: 'Trash',
}

// ─── Icon Components ──────────────────────────────────────────────────────────

const Icon = {
  Compose: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M4 14l1.5-4.5L14 1l4 4-8.5 8.5L5 15z" strokeLinejoin="round" />
      <path d="M11.5 3.5l4 4" />
      <path d="M4 16h12" strokeLinecap="round" />
    </svg>
  ),
  Inbox: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M3 8h14l-2 7H5L3 8z" strokeLinejoin="round" />
      <path d="M7 8V5a3 3 0 016 0v3" />
      <path d="M7 12h6" strokeLinecap="round" />
    </svg>
  ),
  Star: ({ filled }: { filled?: boolean }) => (
    <svg viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L10 14.4l-4.8 2.5.9-5.4L2.2 7.7l5.4-.8L10 2z" strokeLinejoin="round" />
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M17 3L3 9l6 2 2 6 6-14z" strokeLinejoin="round" />
      <path d="M9 11l3-3" />
    </svg>
  ),
  Draft: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6l-4-4z" strokeLinejoin="round" />
      <path d="M14 2v4h4M7 9h6M7 12h4" strokeLinecap="round" />
    </svg>
  ),
  Archive: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M3 5h14v2H3z" strokeLinejoin="round" />
      <path d="M5 7v9h10V7" />
      <path d="M8 11h4" strokeLinecap="round" />
    </svg>
  ),
  Spam: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6v5M10 13.5v.5" strokeLinecap="round" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M5 6h10l-1 11H6L5 6z" strokeLinejoin="round" />
      <path d="M3 6h14M8 3h4" strokeLinecap="round" />
    </svg>
  ),
  Reply: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M3 8l5-5v3c5 0 9 3 9 9-2-3-5-5-9-5v3L3 8z" strokeLinejoin="round" />
    </svg>
  ),
  ReplyAll: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M1 8l4-4v3c5 0 9 3 9 9-2-3-5-5-9-5v3L1 8z" strokeLinejoin="round" />
      <path d="M6 6l4-4" strokeLinecap="round" />
    </svg>
  ),
  Forward: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M17 8l-5-5v3c-5 0-9 3-9 9 2-3 5-5 9-5v3l5-5z" strokeLinejoin="round" />
    </svg>
  ),
  Delete: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M5 6h10l-1 11H6L5 6z" strokeLinejoin="round" />
      <path d="M3 6h14M8 3h4" strokeLinecap="round" />
    </svg>
  ),
  MarkUnread: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M3 6h14v10H3z" strokeLinejoin="round" />
      <path d="M3 6l7 6 7-6" />
      <circle cx="15" cy="5" r="3" fill="#2896E8" stroke="none" />
    </svg>
  ),
  Print: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M5 7V3h10v4M5 13H3V8h14v5h-2" strokeLinejoin="round" />
      <path d="M5 12h10v6H5z" />
      <path d="M7 15h6M7 17h4" strokeLinecap="round" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M3 5h14M6 10h8M9 15h2" strokeLinecap="round" />
    </svg>
  ),
  Attachment: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path d="M16.5 9.5l-7 7a4.5 4.5 0 01-6.36-6.36l7-7a3 3 0 014.24 4.24l-7.07 7.07a1.5 1.5 0 01-2.12-2.12l6.36-6.36" strokeLinecap="round" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
  ),
  Maximize: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5" strokeLinecap="round" strokeLinejoin="round" />
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
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path d="M3 3h8l6 7-6 7H3V3z" strokeLinejoin="round" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  ),
  Minimize: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path d="M5 10h10" strokeLinecap="round" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M17 11.5A7.5 7.5 0 118.5 3a5.5 5.5 0 008.5 8.5z" strokeLinejoin="round" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  ),
}

// ─── Label Badge ──────────────────────────────────────────────────────────────

const LABEL_COLORS: Record<string, string> = {
  Important: '#EF4444',
  Finance: '#F59E0B',
  Design: '#8B5CF6',
  Engineering: '#10B981',
  Partnership: '#2896E8',
}

function LabelBadge({ label }: { label: string }) {
  const color = LABEL_COLORS[label] ?? '#6B7A96'
  return (
    <span
      style={{ backgroundColor: color + '22', color, border: `1px solid ${color}40` }}
      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
    >
      {label}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS: Record<string, string> = {
  SC: '#7C3AED', MR: '#0EA5E9', FG: '#F59E0B', PN: '#10B981',
  GH: '#374151', ST: '#6366F1', ME: '#2896E8', LI: '#0077B5',
  SP: '#EF4444',
}

function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = AVATAR_COLORS[initials] ?? '#2896E8'
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[11px]' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
  return (
    <div
      style={{ backgroundColor: color + '30', color, border: `1px solid ${color}50` }}
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  )
}

// ─── Compose Modal ────────────────────────────────────────────────────────────

function ComposeModal({ onClose, t }: { onClose: () => void; t: Tokens }) {
  const [minimized, setMinimized] = useState(false)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  if (minimized) {
    return (
      <div
        className="fixed bottom-0 right-6 w-72 rounded-t-xl overflow-hidden z-50 shadow-2xl cursor-pointer"
        style={{ backgroundColor: t.composeHead, border: `1px solid ${t.composeComposeBorder}` }}
        onClick={() => setMinimized(false)}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium truncate" style={{ color: t.text }}>{subject || 'New Message'}</span>
          <div className="flex gap-1.5">
            <button style={{ color: t.textMuted }} className="p-1 rounded transition-colors hover:opacity-80" onClick={e => { e.stopPropagation(); setMinimized(false) }}><Icon.Minimize /></button>
            <button style={{ color: t.textMuted }} className="p-1 rounded transition-colors hover:text-red-400" onClick={e => { e.stopPropagation(); onClose() }}><Icon.Close /></button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed bottom-0 right-6 w-[540px] rounded-t-xl overflow-hidden z-50 flex flex-col"
      style={{ backgroundColor: t.composeBg, border: `1px solid ${t.composeComposeBorder}`, maxHeight: '580px', boxShadow: t.shadow }}
    >
      {/* Header */}
      <div style={{ backgroundColor: t.composeHead, borderBottom: `1px solid ${t.divider}` }} className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-sm font-semibold" style={{ color: t.text }}>New Message</span>
        <div className="flex gap-1">
          <button onClick={() => setMinimized(true)} style={{ color: t.textMuted }} className="p-1.5 rounded transition-colors hover:opacity-80"><Icon.Minimize /></button>
          <button onClick={onClose} style={{ color: t.textMuted }} className="p-1.5 rounded transition-colors hover:text-red-400"><Icon.Close /></button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ borderBottom: `1px solid ${t.divider}` }} className="px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-3" style={{ borderBottom: `1px solid ${t.divider}` }}>
          <span className="text-[11px] font-medium w-8 flex-shrink-0" style={{ color: t.textMuted }}>To</span>
          <input type="text" value={to} onChange={e => setTo(e.target.value)} placeholder="Recipients"
            className="flex-1 bg-transparent text-sm py-2.5 outline-none"
            style={{ color: t.text }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium w-8 flex-shrink-0" style={{ color: t.textMuted }}>Sub</span>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
            className="flex-1 bg-transparent text-sm py-2.5 outline-none"
            style={{ color: t.text }}
          />
        </div>
      </div>

      {/* Body */}
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..."
        className="flex-1 bg-transparent text-sm px-4 py-3 outline-none resize-none min-h-[200px]"
        style={{ color: t.text }}
      />

      {/* Toolbar */}
      <div style={{ borderTop: `1px solid ${t.divider}` }} className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-1">
          {[
            { label: 'Bold', icon: <span className="text-xs font-bold">B</span> },
            { label: 'Italic', icon: <span className="text-xs italic">I</span> },
            { label: 'Link', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M6.5 9.5l3-3M4 10l-1.5 1.5a2.12 2.12 0 003 3L7 13M12 6l1.5-1.5a2.12 2.12 0 00-3-3L9 3" strokeLinecap="round"/></svg> },
            { label: 'Attach', icon: <Icon.Attachment /> },
          ].map(btn => (
            <button key={btn.label} title={btn.label}
              className="p-2 rounded transition-colors hover:opacity-80"
              style={{ color: t.textMuted }}>
              {btn.icon}
            </button>
          ))}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: t.accentGrad }}
        >
          <Icon.Send />
          Send
        </button>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const FOLDERS: { key: Folder; label: string; icon: React.ReactNode }[] = [
  { key: 'inbox', label: 'Inbox', icon: <Icon.Inbox /> },
  { key: 'starred', label: 'Starred', icon: <Icon.Star /> },
  { key: 'sent', label: 'Sent', icon: <Icon.Send /> },
  { key: 'drafts', label: 'Drafts', icon: <Icon.Draft /> },
  { key: 'archive', label: 'Archive', icon: <Icon.Archive /> },
  { key: 'spam', label: 'Spam', icon: <Icon.Spam /> },
  { key: 'trash', label: 'Trash', icon: <Icon.Trash /> },
]

function Sidebar({ folder, setFolder, emails, onCompose, t, onToggleTheme, theme }: {
  folder: Folder
  setFolder: (f: Folder) => void
  emails: Email[]
  onCompose: () => void
  t: Tokens
  onToggleTheme: () => void
  theme: Theme
}) {
  const counts: Partial<Record<Folder, number>> = {
    inbox: emails.filter(e => e.folder === 'inbox' && !e.read).length,
    drafts: emails.filter(e => e.folder === 'drafts').length,
    spam: emails.filter(e => e.folder === 'spam').length,
  }

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full"
      style={{ width: 220, backgroundColor: t.sidebarBg, borderRight: `1px solid ${t.sidebarBorder}` }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex-shrink-0">
        <img src={logoImg} alt="Isotopiq" className="h-7 object-contain object-left" />
      </div>

      {/* Compose */}
      <div className="px-4 mb-4 flex-shrink-0">
        <button
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: t.accentGrad, boxShadow: t.accentGlow }}
        >
          <Icon.Compose />
          Compose
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: t.textGhost }}>Mail</p>
        {FOLDERS.map(({ key, label, icon }) => {
          const isActive = folder === key
          const count = counts[key]
          return (
            <button
              key={key}
              onClick={() => setFolder(key)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? t.navActive : 'transparent',
                color: isActive ? t.accent : t.textSub,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = t.navHover }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >
              <span style={{ color: isActive ? t.accent : t.textFaint }}>{icon}</span>
              <span className="flex-1 text-left">{label}</span>
              {count ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: isActive ? t.accent : t.badgeBg, color: isActive ? '#fff' : t.badgeText }}>
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}

        <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mt-5 mb-2" style={{ color: t.textGhost }}>Labels</p>
        {Object.entries(LABEL_COLORS).map(([label, color]) => (
          <button key={label}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ color: t.textSub }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = t.navHover; (e.currentTarget as HTMLElement).style.color = t.text }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = t.textSub }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {label}
          </button>
        ))}
      </nav>

      {/* Theme toggle + Profile */}
      <div style={{ borderTop: `1px solid ${t.divider}` }} className="p-4 flex-shrink-0 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ color: t.textSub, backgroundColor: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = t.navHover }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
        >
          {theme === 'dark' ? <Icon.Sun /> : <Icon.Moon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <Avatar initials="ME" size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: t.text }}>Alex Morgan</p>
            <p className="text-xs truncate" style={{ color: t.textMuted }}>me@isotopiq.io</p>
          </div>
          <button className="transition-colors p-1" style={{ color: t.textFaint }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.textSub }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.textFaint }}>
            <Icon.Settings />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─── Email List ───────────────────────────────────────────────────────────────

function EmailList({ emails, selected, onSelect, folder, t }: {
  emails: Email[]
  selected: string | null
  onSelect: (id: string) => void
  folder: Folder
  t: Tokens
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all')
  const visible = emails
    .filter(e => e.folder === folder)
    .filter(e => filter === 'unread' ? !e.read : filter === 'starred' ? e.starred : true)
    .filter(e => !search || e.subject.toLowerCase().includes(search.toLowerCase()) || e.from.toLowerCase().includes(search.toLowerCase()))

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{ width: 320, backgroundColor: t.listBg, borderRight: `1px solid ${t.listBorder}` }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: t.text }}>{FOLDER_LABELS[folder]}</h2>
          <button className="p-1.5 rounded-lg transition-colors" style={{ color: t.textFaint }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.textSub }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.textFaint }}
            title="Filter"><Icon.Filter /></button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }}><Icon.Search /></span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-all"
            style={{ backgroundColor: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
            onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = t.accent }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = t.inputBorder }}
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5">
          {(['all', 'unread', 'starred'] as const).map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className="text-[11px] font-medium px-3 py-1 rounded-full capitalize transition-all"
              style={{
                backgroundColor: filter === f ? t.accent : t.pill,
                color: filter === f ? '#fff' : t.pillText,
                border: `1px solid ${filter === f ? t.accent : t.pillBorder}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-16" style={{ color: t.textGhost }}>
            <Icon.Inbox />
            <p className="text-sm">No messages</p>
          </div>
        ) : visible.map(email => {
          const isSelected = email.id === selected
          return (
            <button
              key={email.id}
              onClick={() => onSelect(email.id)}
              className="w-full text-left px-4 py-3.5 transition-all"
              style={{
                backgroundColor: isSelected ? t.rowSelected : 'transparent',
                borderLeft: `2px solid ${isSelected ? t.accent : 'transparent'}`,
                borderBottom: `1px solid ${t.divider}`,
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = t.rowHover }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1.5 flex-shrink-0">
                  {!email.read
                    ? <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.unreadDot }} />
                    : <div className="w-2 h-2" />}
                </div>
                <Avatar initials={email.fromAvatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm truncate mr-2 font-medium" style={{ fontWeight: !email.read ? 600 : 500, color: !email.read ? t.text : t.textSub }}>
                      {email.from}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {email.starred && <span style={{ color: t.starActive }}><Icon.Star filled /></span>}
                      <span className="text-[11px]" style={{ color: !email.read ? t.accent : t.textFaint }}>{email.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-xs truncate mb-1.5" style={{ fontWeight: !email.read ? 500 : 400, color: !email.read ? t.textSub : t.textMuted }}>
                    {email.subject}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {email.hasAttachment && <span style={{ color: t.attachColor }}><Icon.Attachment /></span>}
                    {email.labels.slice(0, 2).map(l => <LabelBadge key={l} label={l} />)}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Reading Pane ─────────────────────────────────────────────────────────────

function ReadingPane({ email, onClose, onAction, t }: {
  email: Email | null
  onClose: () => void
  onAction: (action: string, id: string) => void
  t: Tokens
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')

  if (!email) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: t.readBg }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: t.card, border: `1px solid ${t.cardBorder}` }}>
          <svg viewBox="0 0 32 32" fill="none" stroke={t.accent} strokeWidth="1.5" className="w-8 h-8">
            <rect x="3" y="7" width="26" height="20" rx="2" />
            <path d="M3 12l13 8 13-8" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold" style={{ color: t.textFaint }}>Select a message</p>
          <p className="text-sm mt-1" style={{ color: t.textGhost2 }}>Choose an email from the list to read it here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ backgroundColor: t.readBg }}>
      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${t.divider}`, backgroundColor: t.readTopBg }} className="flex items-center justify-between px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-1">
          {[
            { label: 'Archive', icon: <Icon.Archive />, action: 'archive', danger: false },
            { label: 'Delete', icon: <Icon.Delete />, action: 'delete', danger: true },
            { label: 'Mark Unread', icon: <Icon.MarkUnread />, action: 'unread', danger: false },
            { label: 'Spam', icon: <Icon.Spam />, action: 'spam', danger: false },
            { label: 'Print', icon: <Icon.Print />, action: 'print', danger: false },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={() => onAction(btn.action, email.id)}
              title={btn.label}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ color: btn.danger ? '#EF4444' : t.textSub, backgroundColor: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = btn.danger ? '#EF444415' : t.navHover }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >
              {btn.icon}
              <span className="hidden lg:inline">{btn.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAction('star', email.id)}
            title={email.starred ? 'Unstar' : 'Star'}
            className="p-2 rounded-lg transition-all"
            style={{ color: email.starred ? t.starActive : t.starInactive }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = t.navHover }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            <Icon.Star filled={email.starred} />
          </button>
          <button
            onClick={() => onAction('more', email.id)}
            title="More options"
            className="p-2 rounded-lg transition-all"
            style={{ color: t.textFaint }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = t.navHover; (e.currentTarget as HTMLElement).style.color = t.textSub }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = t.textFaint }}
          >
            <Icon.More />
          </button>
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <h1 className="text-xl font-semibold mb-5 leading-tight" style={{ color: t.text }}>{email.subject}</h1>

        {email.labels.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {email.labels.map(l => <LabelBadge key={l} label={l} />)}
          </div>
        )}

        {/* Sender card */}
        <div
          className="flex items-start justify-between p-4 rounded-xl mb-6"
          style={{ backgroundColor: t.card, border: `1px solid ${t.cardBorder}` }}
        >
          <div className="flex items-start gap-3">
            <Avatar initials={email.fromAvatar} size="lg" />
            <div>
              <p className="text-sm font-semibold" style={{ color: t.text }}>{email.from}</p>
              <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{'<'}{email.fromEmail}{'>'}</p>
              <p className="text-xs mt-1" style={{ color: t.textFaint }}>
                To: {email.to.join(', ')}
                {email.cc && email.cc.length > 0 && <> · CC: {email.cc.join(', ')}</>}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs" style={{ color: t.textMuted }}>{email.date}, {email.timestamp}</p>
            {email.hasAttachment && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: t.textMuted }}>
                <Icon.Attachment />
                Attachment
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="text-sm mb-8" style={{ lineHeight: '1.75', color: t.textSub }}
          dangerouslySetInnerHTML={{ __html: email.body }}
        />

        {/* Quick reply */}
        {!replyOpen ? (
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Reply', icon: <Icon.Reply />, primary: true },
              { label: 'Reply All', icon: <Icon.ReplyAll />, primary: false },
              { label: 'Forward', icon: <Icon.Forward />, primary: false },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={() => { if (btn.label === 'Reply') setReplyOpen(true) }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98]"
                style={btn.primary ? {
                  background: t.accentGrad,
                  color: '#fff',
                  boxShadow: t.accentGlow,
                } : {
                  backgroundColor: t.btnSecBg,
                  color: t.btnSecText,
                  border: `1px solid ${t.btnSecBorder}`,
                }}
                onMouseEnter={e => { if (!btn.primary) (e.currentTarget as HTMLElement).style.backgroundColor = t.btnSecHover }}
                onMouseLeave={e => { if (!btn.primary) (e.currentTarget as HTMLElement).style.backgroundColor = t.btnSecBg }}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${t.replyBorder}`, backgroundColor: t.card }}>
            <div style={{ borderBottom: `1px solid ${t.divider}` }} className="px-4 py-2 flex items-center gap-2">
              <span className="text-xs" style={{ color: t.textMuted }}>Replying to</span>
              <span className="text-xs font-medium" style={{ color: t.textSub }}>{email.from}</span>
            </div>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              className="w-full bg-transparent text-sm px-4 py-3 outline-none resize-none"
              style={{ color: t.text }}
              rows={5}
              autoFocus
            />
            <div style={{ borderTop: `1px solid ${t.divider}` }} className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setReplyOpen(false)}
                className="text-sm transition-colors px-3 py-1.5 rounded-lg"
                style={{ color: t.textMuted }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = t.navHover }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: t.accentGrad, boxShadow: t.accentGlow }}
              >
                <Icon.Send />
                Send Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

const THEMES: Record<Theme, Tokens> = { dark: DARK, light: LIGHT }

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin, theme, onToggleTheme }: {
  onLogin: () => void
  theme: Theme
  onToggleTheme: () => void
}) {
  const t = THEMES[theme] ?? DARK
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) { setError('Please enter your email address.'); return }
    if (!password) { setError('Please enter your password.'); return }
    if (tab === 'signin' && password !== 'password') {
      setError('Incorrect password. Try "password" for the demo.')
      return
    }
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 900)
  }

  const inputStyle = {
    backgroundColor: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    color: t.text,
  }

  return (
    <div
      className="min-h-screen w-screen flex flex-col"
      style={{ backgroundColor: t.appBg, transition: 'background-color 0.2s' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 flex-shrink-0">
        <img src={logoImg} alt="Isotopiq" className="h-7 object-contain" />
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{ color: t.textSub, backgroundColor: t.card, border: `1px solid ${t.cardBorder}` }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = t.accent }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = t.cardBorder }}
        >
          {theme === 'dark' ? <Icon.Sun /> : <Icon.Moon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[420px]">

          {/* Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: t.card, border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow }}
          >
            {/* Card header */}
            <div className="px-8 pt-8 pb-6">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, #2896E8 0%, #1565C0 100%)', boxShadow: '0 8px 24px rgba(40,150,232,0.35)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-6 h-6">
                  <rect x="2" y="5" width="20" height="16" rx="2" />
                  <path d="M2 9l10 7 10-7" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold mb-1" style={{ color: t.text }}>
                {tab === 'signin' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-sm" style={{ color: t.textMuted }}>
                {tab === 'signin'
                  ? 'Sign in to your Isotopiq Mail account'
                  : 'Get started with Isotopiq Mail today'}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="px-8 mb-6">
              <div
                className="flex rounded-lg p-1"
                style={{ backgroundColor: t.inputBg, border: `1px solid ${t.inputBorder}` }}
              >
                {(['signin', 'signup'] as const).map(tp => (
                  <button
                    key={tp}
                    onClick={() => { setTab(tp); setError('') }}
                    className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
                    style={tab === tp ? {
                      backgroundColor: t.accent,
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(40,150,232,0.3)',
                    } : {
                      backgroundColor: 'transparent',
                      color: t.textMuted,
                    }}
                  >
                    {tp === 'signin' ? 'Sign in' : 'Sign up'}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
              {/* Name field — signup only */}
              {tab === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: t.textMuted }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Alex Morgan"
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = t.accent; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${t.accent}20` }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = t.inputBorder; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: t.textMuted }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@isotopiq.io"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = t.accent; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${t.accent}20` }}
                  onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = t.inputBorder; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>
                    Password
                  </label>
                  {tab === 'signin' && (
                    <button type="button" className="text-xs font-medium transition-colors" style={{ color: t.accent }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={tab === 'signin' ? 'Enter your password' : 'Create a password'}
                    autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full px-4 py-2.5 pr-11 rounded-lg text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = t.accent; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${t.accent}20` }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = t.inputBorder; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                    style={{ color: t.textFaint }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.textSub }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.textFaint }}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                        <path d="M3 3l14 14M8.46 8.52A3 3 0 0013.5 13.5" strokeLinecap="round"/>
                        <path d="M6.1 6.14C4.17 7.24 2.67 8.89 2 10c1.33 2.67 4 5 8 5a8.6 8.6 0 003.9-.9M10.5 5.07A8 8 0 0118 10c-.48.95-1.2 1.92-2.1 2.74" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                        <path d="M2 10c1.33-2.67 4-5 8-5s6.67 2.33 8 5c-1.33 2.67-4 5-8 5s-6.67-2.33-8-5z"/>
                        <circle cx="10" cy="10" r="2.5"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password — signup only */}
              {tab === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: t.textMuted }}>
                    Confirm password
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = t.accent; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${t.accent}20` }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = t.inputBorder; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}
                >
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 mt-0.5 flex-shrink-0">
                    <circle cx="10" cy="10" r="8"/><path d="M10 6v5M10 13.5v.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Demo hint */}
              {tab === 'signin' && !error && (
                <p className="text-xs" style={{ color: t.textFaint }}>
                  Demo: any email + password <span style={{ color: t.accent }} className="font-mono">"password"</span>
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: 'linear-gradient(135deg, #2896E8 0%, #1565C0 100%)', boxShadow: '0 4px 16px rgba(40,150,232,0.35)' }}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    {tab === 'signin' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  <>
                    {tab === 'signin' ? <Icon.Send /> : <Icon.Compose />}
                    {tab === 'signin' ? 'Sign in to Mail' : 'Create account'}
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px" style={{ backgroundColor: t.divider }} />
                <span className="text-xs" style={{ color: t.textGhost }}>or continue with</span>
                <div className="flex-1 h-px" style={{ backgroundColor: t.divider }} />
              </div>

              {/* SSO buttons */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Google',
                    icon: (
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                        <path d="M18.2 10.2c0-.63-.06-1.24-.16-1.82H10v3.44h4.6a3.93 3.93 0 01-1.7 2.58v2.14h2.74c1.6-1.48 2.56-3.65 2.56-6.34z" fill="#4285F4"/>
                        <path d="M10 18.4c2.3 0 4.23-.76 5.64-2.06l-2.74-2.14c-.76.51-1.73.81-2.9.81-2.23 0-4.12-1.5-4.79-3.52H2.37v2.21A8.4 8.4 0 0010 18.4z" fill="#34A853"/>
                        <path d="M5.21 11.49A5.04 5.04 0 015 10c0-.52.09-1.02.21-1.49V6.3H2.37A8.4 8.4 0 001.6 10c0 1.35.32 2.63.77 3.7l2.84-2.21z" fill="#FBBC05"/>
                        <path d="M10 4.99c1.26 0 2.38.43 3.27 1.27l2.44-2.44C14.22 2.43 12.29 1.6 10 1.6A8.4 8.4 0 002.37 6.3l2.84 2.21C5.88 6.49 7.77 4.99 10 4.99z" fill="#EA4335"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Microsoft',
                    icon: (
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                        <rect x="2" y="2" width="7.5" height="7.5" fill="#F25022"/>
                        <rect x="10.5" y="2" width="7.5" height="7.5" fill="#7FBA00"/>
                        <rect x="2" y="10.5" width="7.5" height="7.5" fill="#00A4EF"/>
                        <rect x="10.5" y="10.5" width="7.5" height="7.5" fill="#FFB900"/>
                      </svg>
                    ),
                  },
                ].map(btn => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={onLogin}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{ backgroundColor: t.btnSecBg, color: t.btnSecText, border: `1px solid ${t.btnSecBorder}` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = t.btnSecHover; (e.currentTarget as HTMLElement).style.borderColor = t.accent }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = t.btnSecBg; (e.currentTarget as HTMLElement).style.borderColor = t.btnSecBorder }}
                  >
                    {btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: t.textGhost }}>
            By signing in you agree to Isotopiq's{' '}
            <span style={{ color: t.accent }} className="cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: t.accent }} className="cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const t: Tokens = THEMES[theme] ?? DARK
  const [loggedIn, setLoggedIn] = useState(false)
  const [folder, setFolder] = useState<Folder>('inbox')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS)
  const [composeOpen, setComposeOpen] = useState(false)

  const selectedEmail = emails.find(e => e.id === selectedId) ?? null

  function handleSelect(id: string) {
    setSelectedId(id)
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e))
  }

  function handleAction(action: string, id: string) {
    if (action === 'star') {
      setEmails(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e))
    } else if (action === 'archive') {
      setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: 'archive' } : e))
      setSelectedId(null)
    } else if (action === 'delete') {
      setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: 'trash' } : e))
      setSelectedId(null)
    } else if (action === 'spam') {
      setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: 'spam' } : e))
      setSelectedId(null)
    } else if (action === 'unread') {
      setEmails(prev => prev.map(e => e.id === id ? { ...e, read: !e.read } : e))
    } else if (action === 'print') {
      window.print()
    }
  }

  function handleFolderChange(f: Folder) {
    setFolder(f)
    setSelectedId(null)
  }

  if (!loggedIn) {
    return (
      <LoginPage
        theme={theme}
        onToggleTheme={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}
        onLogin={() => setLoggedIn(true)}
      />
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(th => th === 'dark' ? 'light' : 'dark') }}>
      <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: t.appBg, transition: 'background-color 0.2s' }}>
        <Sidebar folder={folder} setFolder={handleFolderChange} emails={emails} onCompose={() => setComposeOpen(true)}
          t={t} theme={theme} onToggleTheme={() => setTheme(th => th === 'dark' ? 'light' : 'dark')} />
        <EmailList emails={emails} selected={selectedId} onSelect={handleSelect} folder={folder} t={t} />
        <ReadingPane email={selectedEmail} onClose={() => setSelectedId(null)} onAction={handleAction} t={t} />
        {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} t={t} />}
      </div>
    </ThemeContext.Provider>
  )
}
