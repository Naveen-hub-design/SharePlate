import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/client';
import type { Notification } from '../../types';
import { 
  Menu, 
  Bell, 
  PlusCircle, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface DashboardHeaderProps {
  onOpenMobileSidebar: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onOpenMobileSidebar }) => {
  const { user, isDonor, isReceiver } = useAuth();
  const location = useLocation();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Compute breadcrumb title
  const getPageTitle = () => {
    if (location.pathname.includes('/donor/dashboard')) return 'Donor Command Center';
    if (location.pathname.includes('/donations/new')) return 'Create Surplus Food Listing';
    if (location.pathname.includes('/receiver/dashboard')) return 'Recipient NGO Portal';
    if (location.pathname.includes('/admin/dashboard')) return 'Admin Oversight Portal';
    return 'Workspace Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-stone-200/90 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-stone-900 font-heading">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-stone-500 hidden sm:block">
            {user?.organization?.name || 'Verified Partner'}
          </p>
        </div>
      </div>

      {/* Right: Actions, Notifications & Public Site Link */}
      <div className="flex items-center gap-3">
        {/* Quick Role CTA */}
        {isDonor && (
          <Link
            to="/donations/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] rounded-xl shadow transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + New Listing
          </Link>
        )}

        {isReceiver && (
          <Link
            to="/discover"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            Find Surplus
          </Link>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2.5 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-4 bg-[#FAF7F2] border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#1B4332]" />
                  <h4 className="font-bold text-stone-800 text-xs">Workspace Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-[#1B4332] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-500">
                    No active notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-stone-50 transition-colors ${
                        !n.is_read ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-stone-800">{n.title}</p>
                        <span className="text-[10px] text-stone-400 whitespace-nowrap">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* View Public Website Link */}
        <Link
          to="/"
          className="text-xs font-semibold text-stone-600 hover:text-[#1B4332] px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors flex items-center gap-1.5"
          title="Go to public website"
        >
          <span className="hidden md:inline">Public Site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
};
