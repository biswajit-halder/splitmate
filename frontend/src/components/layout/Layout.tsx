import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'

export function Layout() {
  return (
    <div className="mesh-bg min-h-screen">
      <Sidebar />
      <main className="flex min-h-screen flex-col lg:ml-[248px]">
        <TopBar />
        <div className="animate-enter mx-auto w-full max-w-content flex-1 px-md pb-32 pt-24 md:px-xxl lg:pb-xl">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
