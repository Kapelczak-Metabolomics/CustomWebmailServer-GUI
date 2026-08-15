import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Inbox,
  Users,
  BarChart3,
  BookOpen,
  Globe,
  Settings,
  Shield,
  Menu,
  Bell,
  Search,
  Plus,
  LogOut,
  X,
  ChevronDown,
} from "lucide-react"
import { useTheme } from "../theme"
import { useStore } from "../store"
import Avatar from "./Avatar"
import { Icon } from "./Icon"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inbox", icon: Inbox, label: "Inbox" },
  { to: "/contacts", icon: Users, label: "Contacts" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/knowledge-base", icon: BookOpen, label: "Knowledge Base" },
  { to: "/portal", icon: Globe, label: "End-User Portal" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/admin", icon: Shield, label: "Admin" },
]

const FOLDERS = [
  { key: "inbox", label: "Inbox", Icon: Icon.Inbox },
  { key: "starred", label: "Starred", Icon: Icon.Star },
  { key: "sent", label: "Sent", Icon: Icon.Send },
  { key: "drafts", label: "Drafts", Icon: Icon.Draft },
  { key: "archive", label: "Archive", Icon: Icon.Archive },
  { key: "spam", label: "Spam", Icon: Icon.Spam },
  { key: "trash", label: "Trash", Icon: Icon.Trash },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, tokens: t, toggle } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [query, setQuery] = useState("")
  const currentUser = useStore((s) => s.currentUser)
  const logout = useStore((s) => s.logout)
  const setComposeOpen = useStore((s) => s.setComposeOpen)
  const setSearch = useStore((s) => s.setSearch)
  const folder = useStore((s) => s.ui.folder)
  const setFolder = useStore((s) => s.setFolder)
  const conversations = useStore((s) => s.conversations)
  const tags = useStore((s) => s.tags)
  const notifications = useStore((s) => s.notifications)
  const markNotificationRead = useStore((s) => s.markNotificationRead)

  const isAgent = currentUser?.role === "admin" || currentUser?.role === "agent"
  const isCustomer = currentUser?.role === "customer"

  const unreadCount = conversations.filter(
    (c) => c.folder === "inbox" && !c.readBy.includes(currentUser?.id || ""),
  ).length
  const unreadNotifs = notifications.filter((n) => !n.read).length

  function handleLogout() {
    logout()
    navigate("/login")
  }

  function notifClick(n: typeof notifications[0]) {
    markNotificationRead(n.id)
    setNotifOpen(false)
  }

  const sidebar = (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 240,
        backgroundColor: t.sidebarBg,
        borderRight: `1px solid ${t.sidebarBorder}`,
      }}
    >
      <div className="px-5 py-5 flex items-center gap-3 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ background: t.accentGrad }}
        >
          I
        </div>
        <span className="font-semibold" style={{ color: t.text }}>
          Isotopiq Mail
        </span>
      </div>

      {isAgent && (
        <div className="px-4 mb-4 flex-shrink-0">
          <button
            onClick={() => setComposeOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: t.accentGrad, boxShadow: t.accentGlow }}
          >
            <Icon.Compose />
            New Conversation
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {navItems
          .filter((item) => {
            if (!currentUser) return item.to === "/portal"
            if (currentUser.role === "customer") return item.to === "/portal"
            if (currentUser.role === "agent") return item.to !== "/admin"
            return true
          })
          .map((item) => {
            const IconComp = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? "" : ""
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? t.navActive : "transparent",
                  color: isActive ? t.accent : t.textSub,
                })}
              >
                {({ isActive }) => (
                  <>
                    <IconComp
                      className="w-4 h-4"
                      style={{ color: isActive ? t.accent : t.textFaint }}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.to === "/inbox" && unreadCount > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isActive ? t.accent : t.badgeBg,
                          color: isActive ? "#fff" : t.badgeText,
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}

        {isAgent && (
          <>
            <div
              className="mt-6 mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: t.textGhost }}
            >
              Mail folders
            </div>
            {FOLDERS.map(({ key, label, Icon: FIcon }) => {
              const active = folder === key
              const count =
                key === "inbox"
                  ? conversations.filter(
                      (c) =>
                        c.folder === "inbox" &&
                        !c.readBy.includes(currentUser?.id || ""),
                    ).length
                  : key === "drafts"
                    ? conversations.filter((c) => c.folder === "drafts").length
                    : key === "spam"
                      ? conversations.filter((c) => c.folder === "spam").length
                      : undefined
              return (
                <button
                  key={key}
                  onClick={() => {
                    setFolder(key as typeof folder)
                    navigate("/inbox")
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left"
                  style={{
                    backgroundColor: active ? t.navActive : "transparent",
                    color: active ? t.accent : t.textSub,
                  }}
                >
                  <span style={{ color: active ? t.accent : t.textFaint }}>
                    <FIcon />
                  </span>
                  <span className="flex-1">{label}</span>
                  {count ? (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: active ? t.accent : t.badgeBg,
                        color: active ? "#fff" : t.badgeText,
                      }}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              )
            })}

            <div
              className="mt-6 mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: t.textGhost }}
            >
              Tags
            </div>
            {tags.map((tag) => (
              <button
                key={tag.id}
                className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors text-left"
                style={{ color: t.textSub }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            ))}
          </>
        )}
      </nav>

      <div
        className="p-4 flex-shrink-0 space-y-3"
        style={{ borderTop: `1px solid ${t.divider}` }}
      >
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left"
          style={{ color: t.textSub }}
        >
          {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        <div className="flex items-center gap-3">
          {currentUser && <Avatar name={currentUser.name} size="md" />}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: t.text }}
            >
              {currentUser?.name || "Guest"}
            </p>
            <p className="text-xs truncate" style={{ color: t.textMuted }}>
              {currentUser?.email || ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ backgroundColor: t.appBg }}
    >
      <div className="hidden md:flex h-full">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-[260px] h-full">{sidebar}</div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            backgroundColor: t.readTopBg,
            borderBottom: `1px solid ${t.divider}`,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg"
              style={{ color: t.textSub }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <form
              className="relative hidden sm:block"
              onSubmit={(e) => {
                e.preventDefault()
                setSearch(query.trim())
                if (query.trim()) navigate("/inbox")
              }}
            >
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: t.textFaint }}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 pr-3 py-2 text-sm rounded-lg outline-none w-64 transition-all"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
                onFocus={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = t.accent
                }}
                onBlur={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor =
                    t.inputBorder
                }}
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            {isAgent && (
              <button
                onClick={() => setComposeOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: t.accentGrad }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-lg transition-colors"
                style={{ color: t.textSub }}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50"
                  style={{
                    backgroundColor: t.card,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.shadow,
                  }}
                >
                  <div
                    className="px-4 py-3 font-semibold text-sm"
                    style={{ color: t.text }}
                  >
                    Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div
                      className="px-4 py-6 text-sm text-center"
                      style={{ color: t.textMuted }}
                    >
                      No notifications yet
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 20).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => notifClick(n)}
                          className="w-full text-left px-4 py-3 text-sm border-t"
                          style={{
                            color: t.textSub,
                            borderColor: t.divider,
                            backgroundColor: n.read
                              ? "transparent"
                              : t.rowSelected,
                          }}
                        >
                          <div
                            className="font-medium"
                            style={{ color: t.text }}
                          >
                            {n.title}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: t.textMuted }}
                          >
                            {n.body}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg transition-colors"
                style={{ color: t.textSub }}
              >
                {currentUser && <Avatar name={currentUser.name} size="sm" />}
                <ChevronDown
                  className="w-3.5 h-3.5"
                  style={{ color: t.textFaint }}
                />
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50"
                  style={{
                    backgroundColor: t.card,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.shadow,
                  }}
                >
                  <NavLink
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2.5 text-sm"
                    style={{ color: t.textSub }}
                  >
                    Profile & Settings
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm border-t flex items-center gap-2"
                    style={{ color: "#EF4444", borderColor: t.divider }}
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
