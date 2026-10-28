import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ShieldAlert, Heart, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0D281E] text-stone-300 pt-16 pb-12 border-t border-[#1B4332] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white">
                <UtensilsCrossed className="w-5 h-5 text-[#52B788]" />
              </div>
              <span className="text-xl font-bold text-white font-heading">SharePlate</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Good food deserves another destination. Eliminating commercial surplus food waste by bridging verified food providers with frontline hunger relief organizations.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-lg px-3 py-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Compliant with FSSAI Surplus Food Regulations (2019)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/discover" className="hover:text-emerald-400 transition-colors">
                  Discover Food Surplus
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-emerald-400 transition-colors">
                  Food Safety Guidelines
                </Link>
              </li>
              <li>
                <Link to="/impact" className="hover:text-emerald-400 transition-colors">
                  Impact & Carbon Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* User Roles */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Get Involved</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register?role=DONOR" className="hover:text-emerald-400 transition-colors">
                  Donate as Restaurant / Caterer
                </Link>
              </li>
              <li>
                <Link to="/register?role=RECEIVER" className="hover:text-emerald-400 transition-colors">
                  Register as Recipient NGO
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Organization Login
                </Link>
              </li>
              <li>
                <a 
                  href="https://www.fssai.gov.in" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  FSSAI Food Authority <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Safety Disclaimer */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Safety & Legal</h4>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              SharePlate enforces strict 4-hour ambient windows for cooked meals, cold-chain disclosures, and verified physical handover OTPs. Donors and receivers are required to maintain FSSAI licenses.
            </p>
            <div className="flex flex-col gap-2 text-xs">
              <Link to="/privacy" className="text-stone-400 hover:text-white transition-colors">
                Privacy Policy (Draft Notice)
              </Link>
              <Link to="/terms" className="text-stone-400 hover:text-white transition-colors">
                Terms of Service & Food Liability
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} SharePlate Surplus Food Rescue. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-stone-400">
            Built with care for zero hunger and zero food waste <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};
