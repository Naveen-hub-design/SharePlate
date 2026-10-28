import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api/client';
import type { Notification } from '../types';
import { 
  UtensilsCrossed, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  PlusCircle, 
  ShieldCheck, 
  MapPin, 
  BarChart3, 
  Menu, 
  X,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isDonor, isReceiver, isAdmin, isVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EAE3D2] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Tagline */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex items-center justify-center text-white shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6 text-[#52B788]" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-[#1B4332] font-heading flex items-center gap-1.5">
                SharePlate
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20">
                  FSSAI Safe
                </span>
              </span>
              <p className="text-[11px] font-medium text-stone-500 hidden sm:block">Good food deserves another destination</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/discover"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/discover')
                  ? 'bg-[#1B4332] text-white shadow-sm'
                  : 'text-stone-700 hover:text-[#1B4332] hover:bg-[#F4EFE6]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Discover Food
            </Link>

            <Link
              to="/live-map"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/live-map')
                  ? 'bg-[#1B4332] text-white shadow-sm'
                  : 'text-stone-700 hover:text-[#1B4332] hover:bg-[#F4EFE6]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live Radar
            </Link>

            <Link
              to="/how-it-works"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/how-it-works')
                  ? 'bg-[#1B4332] text-white shadow-sm'
                  : 'text-stone-700 hover:text-[#1B4332] hover:bg-[#F4EFE6]'
              }`}
            >
              How It Works
            </Link>

            <Link
              to="/safety"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/safety')
                  ? 'bg-[#1B4332] text-white shadow-sm'
                  : 'text-stone-700 hover:text-[#1B4332] hover:bg-[#F4EFE6]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Food Safety
            </Link>

            <Link
              to="/impact"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/impact')
                  ? 'bg-[#1B4332] text-white shadow-sm'
                  : 'text-stone-700 hover:text-[#1B4332] hover:bg-[#F4EFE6]'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-600" />
              Impact
            </Link>
          </nav>

          {/* Auth / Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Donor Quick Action */}
                {isDonor && (
                  <Link
                    to="/donations/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#D97706] to-[#B45309] rounded-xl hover:shadow-md hover:from-[#B45309] hover:to-[#92400E] transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Donate Surplus
                  </Link>
                )}

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2.5 rounded-xl text-stone-700 hover:bg-[#F4EFE6] transition-colors focus:outline-none"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-4 bg-[#FAF7F2] border-b border-stone-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-[#1B4332]" />
                          <h4 className="font-bold text-stone-800 text-sm">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                              {unreadCount} unread
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
                          <div className="p-6 text-center text-sm text-stone-500">
                            No notifications yet
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

                {/* Dashboard button based on role */}
                {isDonor && (
                  <Link
                    to="/donor/dashboard"
                    className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-[#EBF5F0] text-[#1B4332] hover:bg-[#D3EBDD] transition-colors"
                  >
                    Donor Hub
                  </Link>
                )}
                {isReceiver && (
                  <Link
                    to="/receiver/dashboard"
                    className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-[#EBF5F0] text-[#1B4332] hover:bg-[#D3EBDD] transition-colors"
                  >
                    Receiver Hub
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors"
                  >
                    Admin Portal
                  </Link>
                )}

                {/* User Profile Pill */}
                <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-bold text-stone-800 leading-tight">{user.full_name}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className="text-[10px] font-bold text-stone-500 uppercase">{user.role}</span>
                      {user.organization && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            isVerified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-stone-700 hover:text-[#1B4332] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#1B4332] rounded-xl hover:bg-[#2D6A4F] shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02]"
                >
                  Join SharePlate
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-stone-700 hover:bg-[#F4EFE6]"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-600" />
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-[#F4EFE6]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <Link
            to="/discover"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-stone-800 hover:bg-stone-50 rounded-lg"
          >
            Discover Food
          </Link>
          <Link
            to="/live-map"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-stone-800 hover:bg-stone-50 rounded-lg"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Radar Map
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-stone-800 hover:bg-stone-50 rounded-lg"
          >
            How It Works
          </Link>
          <Link
            to="/safety"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-stone-800 hover:bg-stone-50 rounded-lg"
          >
            Food Safety & FSSAI Guidelines
          </Link>
          <Link
            to="/impact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-stone-800 hover:bg-stone-50 rounded-lg"
          >
            Impact Analytics
          </Link>

          {user ? (
            <div className="pt-4 border-t border-stone-100 space-y-2">
              <div className="px-3 py-2 bg-stone-50 rounded-lg">
                <p className="font-bold text-sm text-stone-800">{user.full_name}</p>
                <p className="text-xs text-stone-500">{user.email} ({user.role})</p>
              </div>

              {isDonor && (
                <>
                  <Link
                    to="/donations/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-center text-sm font-bold text-white bg-amber-600 rounded-lg"
                  >
                    + Donate Surplus Food
                  </Link>
                  <Link
                    to="/donor/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-semibold text-[#1B4332] bg-[#EBF5F0] rounded-lg"
                  >
                    Donor Dashboard
                  </Link>
                </>
              )}
              {isReceiver && (
                <Link
                  to="/receiver/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-[#1B4332] bg-[#EBF5F0] rounded-lg"
                >
                  Receiver Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-purple-800 bg-purple-50 rounded-lg"
                >
                  Admin Portal
                </Link>
              )}

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-stone-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-bold text-stone-700 bg-stone-100 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-bold text-white bg-[#1B4332] rounded-xl shadow"
              >
                Join SharePlate
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
