import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "./theme"
import { useStore } from "./store"
import type { Role } from "./types"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import InboxPage from "./pages/InboxPage"
import ContactsPage from "./pages/ContactsPage"
import ReportsPage from "./pages/ReportsPage"
import KnowledgeBasePage from "./pages/KnowledgeBasePage"
import PortalPage from "./pages/PortalPage"
import SettingsPage from "./pages/SettingsPage"
import AdminPage from "./pages/AdminPage"
import ComposeModal from "./components/ComposeModal"

function ProtectedRoute({
  children,
  allowed,
}: {
  children: React.ReactNode
  allowed?: Role[]
}) {
  const currentUser = useStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/login" replace />
  if (allowed && !allowed.includes(currentUser.role)) {
    if (currentUser.role === "customer")
      return <Navigate to="/portal" replace />
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute allowed={["admin", "agent"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute allowed={["admin", "agent"]}>
                <InboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute allowed={["admin", "agent"]}>
                <ContactsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowed={["admin", "agent"]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-base"
            element={
              <ProtectedRoute allowed={["admin", "agent"]}>
                <KnowledgeBasePage />
              </ProtectedRoute>
            }
          />
          <Route path="/portal" element={<PortalPage />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowed={["admin", "agent"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowed={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        <ComposeModal />
      </BrowserRouter>
    </ThemeProvider>
  )
}
