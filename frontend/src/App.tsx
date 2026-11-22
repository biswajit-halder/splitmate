import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AccentProvider } from './context/AccentContext'
import { RouteGuard } from './components/RouteGuard'
import { Layout } from './components/layout/Layout'

const LoginPage = lazy(() => import('./pages/Login').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/Register').then(m => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.DashboardPage })))
const GroupsPage = lazy(() => import('./pages/Groups').then(m => ({ default: m.GroupsPage })))
const GroupDetailPage = lazy(() => import('./pages/GroupDetail').then(m => ({ default: m.GroupDetailPage })))
const FriendsPage = lazy(() => import('./pages/Friends').then(m => ({ default: m.FriendsPage })))
const SettlementsPage = lazy(() => import('./pages/Settlements').then(m => ({ default: m.SettlementsPage })))
const AddExpensePage = lazy(() => import('./pages/AddExpense').then(m => ({ default: m.AddExpensePage })))
const ExpenseDetailsPage = lazy(() => import('./pages/ExpenseDetails').then(m => ({ default: m.ExpenseDetailsPage })))
const AnalyticsPage = lazy(() => import('./pages/Analytics').then(m => ({ default: m.AnalyticsPage })))
const ProfilePage = lazy(() => import('./pages/Profile').then(m => ({ default: m.ProfilePage })))
const NotificationsPage = lazy(() => import('./pages/Notifications').then(m => ({ default: m.NotificationsPage })))
const ActivityPage = lazy(() => import('./pages/Activity').then(m => ({ default: m.ActivityPage })))

function StaticPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-content">
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-md">{title}</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">{body}</p>
    </div>
  )
}

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-md text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        <span className="font-body-md">Loading…</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AccentProvider>
        <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageFallback />}>
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
                    <Route path="/expenses/add" element={<AddExpensePage />} />
                    <Route path="/expenses/:id" element={<ExpenseDetailsPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
        </ToastProvider>
      </AccentProvider>
    </ThemeProvider>
  )
}

export default App
