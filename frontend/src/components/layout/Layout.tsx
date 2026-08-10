import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-sidebar min-h-screen flex flex-col">
        <TopBar />
        <div className="flex-1 px-md md:px-xxl pt-24 pb-xxl overflow-y-auto w-full max-w-content mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

