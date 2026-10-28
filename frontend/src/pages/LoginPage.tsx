import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if redirect query param is present
  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.full_name}!`);

      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'DONOR') {
        navigate('/donor/dashboard');
      } else {
        navigate('/receiver/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-stone-200/80 rounded-3xl">
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-heading">
          Sign In
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Enter your organization credentials to manage food rescue operations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
            Official Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.org"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs sm:text-sm"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow transition-all disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Fill Demo Section */}
      <div className="mt-6 pt-5 border-t border-stone-100">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 text-center mb-2.5">
          One-Click Review Demo Credentials
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('donor.taj@shareplate.org', 'DonorPassword123!')}
            className="p-2 text-center rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[11px] font-bold text-orange-900 transition-colors"
          >
            Food Donor
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('receiver.hope@shareplate.org', 'ReceiverPassword123!')}
            className="p-2 text-center rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold text-emerald-900 transition-colors"
          >
            Recipient NGO
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@shareplate.org', 'AdminSecure2026!')}
            className="p-2 text-center rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[11px] font-bold text-purple-900 transition-colors"
          >
            Platform Admin
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-stone-600">
          Don't have an organization account?{' '}
          <Link to="/register" className="font-bold text-[#1B4332] hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
