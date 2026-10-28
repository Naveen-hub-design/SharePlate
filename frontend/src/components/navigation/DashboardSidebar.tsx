import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  UtensilsCrossed, 
  LayoutDashboard, 
  PlusCircle, 
  MapPin, 
  BarChart3, 
  ShieldCheck, 
  LogOut, 
  X,
  Building2,
  HeartHandshake,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

interface DashboardSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ mobileOpen, onClose }) => {
  const { user, logout, isDonor, isReceiver, isAdmin, isVerified } = useAuth();
  const navigate = useNavigate();

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

  const renderNavLinks = () => {
    if (isDonor) {
      return (
        <>
          <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-2">
            Donor Workspace
          </div>
          <NavLink to="/donor/dashboard" onClick={onClose} className={navItemClass}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Donor Overview</span>
          </NavLink>
          <NavLink to="/donations/new" onClick={onClose} className={navItemClass}>
            <PlusCircle className="w-4 h-4 text-amber-600" />
            <span>+ Donate Surplus</span>
          </NavLink>
          <NavLink to="/discover" onClick={onClose} className={navItemClass}>
            <MapPin className="w-4 h-4" />
            <span>Browse All Listings</span>
          </NavLink>
          <NavLink to="/impact" onClick={onClose} className={navItemClass}>
            <BarChart3 className="w-4 h-4 text-emerald-700" />
            <span>Carbon & Impact</span>
          </NavLink>
          <NavLink to="/safety" onClick={onClose} className={navItemClass}>
            <ShieldCheck className="w-4 h-4" />
            <span>FSSAI Safety Rules</span>
          </NavLink>
        </>
      );
    }

    if (isReceiver) {
      return (
        <>
          <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-2">
            Recipient Workspace
          </div>
          <NavLink to="/receiver/dashboard" onClick={onClose} className={navItemClass}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Receiver Hub & OTPs</span>
          </NavLink>
          <NavLink to="/discover" onClick={onClose} className={navItemClass}>
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>Find Surplus Food</span>
          </NavLink>
          <NavLink to="/impact" onClick={onClose} className={navItemClass}>
            <BarChart3 className="w-4 h-4" />
            <span>Community Impact</span>
          </NavLink>
          <NavLink to="/safety" onClick={onClose} className={navItemClass}>
            <ShieldCheck className="w-4 h-4" />
            <span>FSSAI Guidelines</span>
          </NavLink>
        </>
      );
    }

    if (isAdmin) {
      return (
        <>
          <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-purple-700 mb-2">
            Admin Governance
          </div>
          <NavLink to="/admin/dashboard" onClick={onClose} className={navItemClass}>
            <LayoutDashboard className="w-4 h-4 text-purple-700" />
            <span>Admin Oversight</span>
          </NavLink>
          <NavLink to="/discover" onClick={onClose} className={navItemClass}>
            <MapPin className="w-4 h-4" />
            <span>Browse Surplus</span>
          </NavLink>
          <NavLink to="/impact" onClick={onClose} className={navItemClass}>
            <BarChart3 className="w-4 h-4 text-emerald-700" />
            <span>Platform Impact</span>
          </NavLink>
          <NavLink to="/safety" onClick={onClose} className={navItemClass}>
            <ShieldCheck className="w-4 h-4" />
            <span>Safety Guidelines</span>
          </NavLink>
        </>
      );
    }

    return null;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-stone-200/90 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Section */}
        <div>
          {/* Logo Bar */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-stone-100">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex items-center justify-center text-white shadow-md">
                <UtensilsCrossed className="w-5 h-5 text-[#52B788]" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-[#1B4332] font-heading flex items-center gap-1.5">
                  SharePlate
                </span>
                <p className="text-[10px] font-semibold text-stone-400">Workspace Portal</p>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 lg:hidden rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organization Snippet Card */}
          <div className="p-4 mx-4 mt-4 bg-[#FAF7F2] rounded-2xl border border-stone-200/80">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1B4332]/10 flex items-center justify-center text-[#1B4332] shrink-0 mt-0.5">
                {isDonor ? (
                  <Building2 className="w-4 h-4" />
                ) : isReceiver ? (
                  <HeartHandshake className="w-4 h-4" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-purple-700" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-stone-900 truncate">
                  {user?.organization?.name || user?.full_name || 'My Account'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700">
                    {user?.role}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isVerified ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">{renderNavLinks()}</nav>
        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-stone-100 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 px-2">
            <div className="min-w-0">
              <p className="font-bold text-stone-800 truncate">{user?.full_name}</p>
              <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
