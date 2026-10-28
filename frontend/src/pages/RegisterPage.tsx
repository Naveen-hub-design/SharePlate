import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole, OrganizationType } from '../types';
import { UtensilsCrossed, Building2, ShieldCheck, HeartHandshake, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const initialRole: UserRole = queryParams.get('role') === 'RECEIVER' ? 'RECEIVER' : 'DONOR';

  const [role, setRole] = useState<UserRole>(initialRole);
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Organization fields
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>(role === 'DONOR' ? 'RESTAURANT' : 'COMMUNITY_KITCHEN');
  const [fssaiLicense, setFssaiLicense] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560001');
  const [latitude, setLatitude] = useState('12.9716');
  const [longitude, setLongitude] = useState('77.5946');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !orgName || !addressLine) {
      toast.error('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        role,
        organization: {
          name: orgName.trim(),
          org_type: orgType,
          fssai_license_number: fssaiLicense.trim() || undefined,
          registration_number: role === 'RECEIVER' ? fssaiLicense.trim() : undefined,
          address_line: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          postal_code: postalCode.trim(),
          latitude: parseFloat(latitude) || 12.9716,
          longitude: parseFloat(longitude) || 77.5946,
          contact_person: fullName.trim(),
          contact_phone: phone.trim() || '+91 98765 00000',
          contact_email: email.trim(),
        },
      };

      const user = await register(payload);
      toast.success(`Account registered successfully! Welcome, ${user.full_name}.`);

      if (user.role === 'DONOR') {
        navigate('/donor/dashboard');
      } else {
        navigate('/receiver/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xl space-y-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-heading">
          Register Organization
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Join the verified food surplus rescue network
        </p>
      </div>

      {/* Role Toggle Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Select Organization Type *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setRole('DONOR');
                setOrgType('RESTAURANT');
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                role === 'DONOR'
                  ? 'border-[#1B4332] bg-[#EBF5F0]/60 ring-2 ring-emerald-200'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <Building2 className={`w-6 h-6 shrink-0 mt-0.5 ${role === 'DONOR' ? 'text-[#1B4332]' : 'text-stone-400'}`} />
              <div>
                <p className="font-bold text-sm text-stone-900">Food Donor</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Restaurants, hotels, bakeries, corporate cafeterias, caterers.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('RECEIVER');
                setOrgType('COMMUNITY_KITCHEN');
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                role === 'RECEIVER'
                  ? 'border-[#1B4332] bg-[#EBF5F0]/60 ring-2 ring-emerald-200'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <HeartHandshake className={`w-6 h-6 shrink-0 mt-0.5 ${role === 'RECEIVER' ? 'text-[#1B4332]' : 'text-stone-400'}`} />
              <div>
                <p className="font-bold text-sm text-stone-900">Recipient Organization</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Verified NGOs, shelters, charitable kitchens, food banks.
                </p>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Account Representative */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2">
              Representative Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@organization.org"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contact Mobile Number *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Organization Details */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2">
              Organization & Regulatory Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Organization / Entity Name *
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Grand Banquet Hall or Annapoorna Trust"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Category Classification *
                </label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs sm:text-sm bg-white"
                >
                  {role === 'DONOR' ? (
                    <>
                      <option value="RESTAURANT">Restaurant / Fine Dining</option>
                      <option value="HOTEL">Hotel & Hospitality</option>
                      <option value="BAKERY">Bakery & Pastry Shop</option>
                      <option value="CATERER">Caterer & Banquet Kitchen</option>
                      <option value="SUPERMARKET">Supermarket / Retailer</option>
                      <option value="CORPORATE_CAFETERIA">Corporate Cafeteria</option>
                      <option value="EVENT_ORGANIZER">Event Organizer</option>
                    </>
                  ) : (
                    <>
                      <option value="COMMUNITY_KITCHEN">Community Kitchen</option>
                      <option value="SHELTER">Homeless / Orphanage Shelter</option>
                      <option value="FOOD_BANK">Food Bank / Pantry</option>
                      <option value="CHARITABLE_TRUST">Charitable Trust (12A/80G)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span>
                    {role === 'DONOR'
                      ? 'FSSAI License / Registration No. (14 digits) *'
                      : 'NGO Darpan / 12A / 80G / Trust Reg. Number *'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">Mandatory for verification</span>
                </label>
                <input
                  type="text"
                  value={fssaiLicense}
                  onChange={(e) => setFssaiLicense(e.target.value)}
                  placeholder={role === 'DONOR' ? 'e.g. 11223344556677' : 'e.g. KA/2020/0123456'}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs sm:text-sm font-mono"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Street Address Line *
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. 42 MG Road, Ashok Nagar"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Compliance Pledge */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p leading-relaxed>
              By registering, you commit to upholding the FSSAI surplus food handling guidelines, strict temperature and packaging safety, and accurate disclosure of allergens.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow-md transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Creating Organization Account...' : 'Complete Registration'}
          </button>
        </form>

        <p className="text-center text-xs text-stone-500 pt-2">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#1B4332] hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
  );
};
