import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types';
import {
  UtensilsCrossed,
  LayoutDashboard,
  MapPin,
  Clock,
  KeyRound,
  BarChart3,
  Building2,
  LogOut,
  X,
  Menu,
  Bell,
  Search,
  ExternalLink,
  ShieldCheck,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';

export const ReceiverLayout: React.FC = () => {
  const { user, logout, isVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationService.getAll();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
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
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
      isActive
        ? 'bg-[#1B4332] text-white shadow-sm'
        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
    }`;

  const getPageTitle = () => {
    if (location.pathname.includes('/receiver/discover')) return 'Find & Claim Surplus Food';
    if (location.pathname.includes('/receiver/requests')) return 'Active Food Claims & History';
    if (location.pathname.includes('/receiver/pickups')) return 'Handover OTPs & Collections';
    if (location.pathname.includes('/receiver/analytics')) return 'Community Impact & Nutrition';
    if (location.pathname.includes('/receiver/profile')) return 'Recipient NGO Profile & Storage';
    return 'Recipient NGO Operational Hub';
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Dedicated Receiver Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-stone-200/90 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Portal Branding */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-stone-100">
            <Link to="/receiver/overview" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex items-center justify-center text-white shadow-md">
                <UtensilsCrossed className="w-5 h-5 text-[#52B788]" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-[#1B4332] font-heading flex items-center gap-1.5">
                  SharePlate
                </span>
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Recipient Hub</p>
              </div>
            </Link>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 lg:hidden rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Recipient NGO Status Card */}
          <div className="p-4 mx-4 mt-4 bg-[#FAF7F2] rounded-2xl border border-stone-200/80">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-stone-900 truncate">
                  {user?.organization?.name || user?.full_name || 'Recipient NGO'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
                    RECEIVER
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                      isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isVerified ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Receiver Navigation Links */}
          <nav className="p-4 space-y-1">
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-2">
              Rescue Operations
            </div>
            <NavLink to="/receiver/overview" onClick={() => setMobileSidebarOpen(false)} className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/receiver/discover" onClick={() => setMobileSidebarOpen(false)} className={navItemClass}>
              <Search className="w-4 h-4 text-emerald-700" />
              <span>Find Surplus Food</span>
            </NavLink>
            <NavLink to="/receiver/requests" onClick={() => setMobileSidebarOpen(false)} className={navItemClass}>
              <Clock className="w-4 h-4" />
              <span>My Claims</span>
            </NavLink>
            <NavLink to="/receiver/pickups" onClick={() => setMobileSidebarOpen(false)} className={navItemClass}>
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Pickup OTPs</span>
            </NavLink>
            <NavLink to="/receiver/analytics" onClick={() => setMobileSidebarOpen(false)} className={navItemClass}>
              <BarChart3 className="w-4 h-4" />
              <span>Community Impact</span>
            </NavLink>
            <NavLink to="/receiver/profile" onClick={() => setMobileSidebarOpen(false)} className={navItemClass}>
              <UserCheck className="w-4 h-4" />
              <span>NGO Profile & Storage</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer User Area */}
        <div className="p-4 border-t border-stone-100 space-y-3">
          <div className="text-xs px-2">
            <p className="font-bold text-stone-800 truncate">{user?.full_name}</p>
            <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Receiver Header */}
        <header className="sticky top-0 z-30 h-20 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-stone-200/90 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-stone-900 font-heading">
                {getPageTitle()}
              </h1>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                {user?.organization?.name || 'Verified Recipient Partner'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/receiver/discover"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              Find Surplus
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50">
                  <div className="p-4 bg-[#FAF7F2] border-b border-stone-200 flex items-center justify-between">
                    <h4 className="font-bold text-stone-800 text-xs">Recipient Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs font-semibold text-[#1B4332] hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-500">No active notifications</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div key={n.id} className={`p-3.5 hover:bg-stone-50 ${!n.is_read ? 'bg-amber-50/50' : ''}`}>
                          <p className="text-xs font-bold text-stone-800">{n.title}</p>
                          <p className="text-xs text-stone-600 mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/"
              className="text-xs font-semibold text-stone-600 hover:text-[#1B4332] px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors flex items-center gap-1.5"
            >
              <span className="hidden md:inline">Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="py-4 px-6 sm:px-8 border-t border-stone-200/80 text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SharePlate Recipient Operations • Community Food Rescue Portal</span>
          <span>Role: RECEIVER • Session Active</span>
        </footer>
      </div>
    </div>
  );
};
