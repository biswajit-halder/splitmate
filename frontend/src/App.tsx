import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/Login'
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

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/activity" element={<div className="p-8"><h1 className="font-headline-lg text-headline-lg text-on-surface">Activity</h1></div>} />
            <Route path="/settlements" element={<SettlementsPage />} />
            <Route path="/settlements/confirm" element={<div className="p-8"><h1 className="font-headline-lg text-headline-lg text-on-surface">Confirm Settlement</h1></div>} />
            <Route path="/expenses/add" element={<AddExpensePage />} />
            <Route path="/expenses/:id" element={<ExpenseDetailsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
