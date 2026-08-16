import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui'
import { AuthProvider } from './context/AuthContext'
import { RouteGuard } from './components/RouteGuard'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { DashboardPage } from './pages/Dashboard'
import { GroupsPage } from './pages/Groups'
import { GroupDetailPage } from './pages/GroupDetail'
import { FriendsPage } from './pages/Friends'
import { SettlementsPage } from './pages/Settlements'
import { AddExpensePage } from './pages/AddExpense'
import { ExpenseDetailsPage } from './pages/ExpenseDetails'
import { AnalyticsPage } from './pages/Analytics'
import { SettingsPage } from './pages/Settings'
import { ProfilePage } from './pages/Profile'
import { NotificationsPage } from './pages/Notifications'
import { ActivityPage } from './pages/Activity'

function StaticPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-content">
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-md">{title}</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">{body}</p>
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<StaticPage title="Forgot Password" body="Password recovery is not available in this demo." />} />
            <Route path="/terms" element={<StaticPage title="Terms of Service" body="Terms of service content goes here." />} />
            <Route path="/privacy" element={<StaticPage title="Privacy Policy" body="Privacy policy content goes here." />} />
            <Route element={<RouteGuard />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/:id" element={<GroupDetailPage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/settlements" element={<SettlementsPage />} />
                <Route path="/settlements/confirm" element={<StaticPage title="Confirm Settlement" body="Select a settlement to confirm." />} />
                <Route path="/expenses/add" element={<AddExpensePage />} />
                <Route path="/expenses/:id" element={<ExpenseDetailsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
