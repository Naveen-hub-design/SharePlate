import React, { useState } from 'react';
import { pickupApi } from '../api/client';
import type { DonationRequest } from '../types';
import { 
  ShieldCheck, 
  X, 
  KeyRound, 
  Thermometer, 
  CheckSquare, 
  Square, 
  AlertTriangle,
  Clock,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PickupVerificationModalProps {
  request: DonationRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PickupVerificationModal: React.FC<PickupVerificationModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pickupCode, setPickupCode] = useState('');
  const [collectorName, setCollectorName] = useState(request.receiver_user?.full_name || '');
  const [collectorPhone, setCollectorPhone] = useState(request.receiver_user?.phone || '');
  const [temperature, setTemperature] = useState<string>('');
  const [checklistConfirmed, setChecklistConfirmed] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCode.trim() || pickupCode.trim().length !== 6) {
      toast.error('Please enter the valid 6-digit handover OTP code.');
      return;
    }
    if (!collectorName.trim() || !collectorPhone.trim()) {
      toast.error('Collector name and contact phone are required for the audit record.');
      return;
    }
    if (!checklistConfirmed) {
      toast.error('You must certify the food safety handover checklist before confirming.');
      return;
    }

    setSubmitting(true);
    try {
      await pickupApi.verifyHandover({
        request_id: request.id,
        pickup_code: pickupCode.trim(),
        collector_name: collectorName.trim(),
        collector_phone: collectorPhone.trim(),
        pickup_temperature_celsius: temperature ? parseFloat(temperature) : undefined,
        safety_checklist_confirmed: true,
        notes: notes.trim() || undefined,
      });

      toast.success('Food handover verified successfully! Donation marked as collected.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Verification failed. Please check the code.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#52B788]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Verify Physical Handover</h3>
              <p className="text-xs text-stone-200">6-Digit OTP & Safety Check-off</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Donation Summary Box */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
            <p className="font-bold text-stone-800">{request.donation?.title}</p>
            <div className="flex items-center justify-between text-xs text-stone-600 mt-1">
              <span>Quantity: <b>{request.requested_quantity} {request.donation?.unit}</b></span>
              <span>Recipient: <b>{request.receiver_organization?.name}</b></span>
            </div>
          </div>

          {/* OTP Code Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Recipient 6-Digit Handover Code *
            </label>
            <input
              type="text"
              maxLength={6}
              value={pickupCode}
              onChange={(e) => setPickupCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold p-3 rounded-xl border-2 border-amber-300 focus:border-[#1B4332] focus:ring-2 focus:ring-emerald-200 outline-none bg-amber-50/30"
              required
            />
            <p className="text-[11px] text-stone-500 mt-1 text-center">
              Ask the recipient collector to display the 6-digit code from their SharePlate dashboard.
            </p>
          </div>

          {/* Collector Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Collector Full Name *
              </label>
              <input
                type="text"
                value={collectorName}
                onChange={(e) => setCollectorName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
                placeholder="Ramesh Kumar"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Collector Phone *
              </label>
              <input
                type="text"
                value={collectorPhone}
                onChange={(e) => setCollectorPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>

          {/* Temperature Logging */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-stone-500" />
              Recorded Handover Temp (°C) — Optional
            </label>
            <input
              type="number"
              step="0.5"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
              placeholder="e.g. 65 for hot, 4 for chilled"
            />
            <p className="text-[10px] text-stone-400 mt-1">Recommended for hot food (&gt;60°C) or chilled food (&lt;5°C).</p>
          </div>

          {/* Safety Checklist Certification */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
            <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              FSSAI Mandatory Safety Protocol
            </h4>
            <div
              onClick={() => setChecklistConfirmed(!checklistConfirmed)}
              className="flex items-start gap-3 cursor-pointer select-none"
            >
              <div className="mt-0.5 text-emerald-700">
                {checklistConfirmed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-700" />
                ) : (
                  <Square className="w-5 h-5 text-stone-400" />
                )}
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                I hereby certify that the surplus food is clean, hygienic, properly packaged in food-grade containers, free of spoilage signs, and handed over prior to the collection deadline.
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Handover Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
              placeholder="e.g. Packaged in 3 thermal insulated stainless steel boxes"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Verifying...' : 'Confirm Handover & Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
