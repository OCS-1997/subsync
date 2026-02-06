import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'

import NavBar from '@/components/layouts/Navigations/NavBar.jsx'
import SideBar from '@/components/layouts/Navigations/SideBar.jsx'

function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex min-h-screen">
      <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <NavBar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-2">
          <div key={location.key}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
