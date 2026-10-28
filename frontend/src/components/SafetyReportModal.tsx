import React, { useState } from 'react';
import { safetyApi } from '../api/client';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SafetyReportModalProps {
  donationId: string;
  donationTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  'EXPIRED_OR_PAST_SAFETY_WINDOW',
  'SUSPECTED_SPOILAGE_OR_OFF_ODOR',
  'UNHYGIENIC_PACKAGING_OR_FOREIGN_OBJECT',
  'UNREFRIGERATED_PERISHABLE_FOOD',
  'MISREPRESENTED_QUANTITY_OR_ALLERGENS',
  'UNRESPONSIVE_OR_INCORRECT_ADDRESS',
  'OTHER_SAFETY_HAZARD',
];

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({
  donationId,
  donationTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      toast.error('Please provide specific details for the safety team.');
      return;
    }

    setSubmitting(true);
    try {
      await safetyApi.submitReport(donationId, {
        reason,
        details: details.trim(),
      });
      toast.success('Food safety incident reported. An administrator will investigate immediately.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to file report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Report Food Safety Concern</h3>
              <p className="text-xs text-red-100">Immediate administrative safety escalation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900">
            <p className="font-bold mb-0.5">Reporting Listing: {donationTitle}</p>
            <p className="text-[11px] text-red-700">
              Your report will notify platform safety officers immediately to inspect or suspend this listing.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Primary Incident Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-red-600 outline-none text-xs bg-white font-medium"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Factual Observations & Evidence *
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the condition, temperature, packaging, odors, or deviation from food safety rules..."
              className="w-full p-3 rounded-xl border border-stone-300 focus:border-red-600 outline-none text-xs"
              required
            />
          </div>

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
              className="px-6 py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'File Safety Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
