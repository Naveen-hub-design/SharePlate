import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from '../components/navigation/DashboardSidebar';
import { DashboardHeader } from '../components/navigation/DashboardHeader';

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans">
      {/* Sidebar (Desktop fixed left, Mobile drawer) */}
      <DashboardSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Dashboard Top Bar */}
        <DashboardHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        {/* Dynamic Workspace View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Compact Workspace Footer */}
        <footer className="py-4 px-6 sm:px-8 border-t border-stone-200/80 text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SharePlate Operational Workspace • FSSAI Food Rescue Standards (2019)</span>
          <span>Logged in securely with active JWT session</span>
        </footer>
      </div>
    </div>
  );
};
