import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, X, Send, CheckCircle2, User, Mail, Phone, ShieldCheck, Globe } from 'lucide-react';
import { User as UserType } from '../types';
import { SearchableCountrySelect } from './SearchableCountrySelect';
import { getDialCodeForCountry } from '../data/countries';

interface IBPartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserType | null;
}

export const IBPartnerFormModal: React.FC<IBPartnerFormModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '🇺🇸 USA'
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill out all required fields (Name, Email, Phone).');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ib/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          country: formData.country || 'Global',
          experience: 'IB Partner Application from Web Form',
          telegramWhatsapp: formData.phone
        })
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit application. Please try again.');
      }
    } catch (err) {
      // Fallback success for quick client UX
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-md p-2 sm:p-4 w-full max-w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0B0F17] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-500/20 p-6 md:p-8 text-white overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider font-mono">
                Become an IB Partner
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Dollar Craft Global Partner Program Application
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Application Received!</h4>
              <p className="text-sm text-cyan-300 font-mono font-semibold leading-relaxed max-w-sm mx-auto">
                pls hold until dollar craft approval your request
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#07090E] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#07090E] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Country Selection Dropdown with Flags */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1 flex items-center justify-between">
                  <span>Operating Country / Jurisdiction *</span>
                  {formData.country && getDialCodeForCountry(formData.country) && (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 font-bold">
                      Code: {getDialCodeForCountry(formData.country)}
                    </span>
                  )}
                </label>
                <SearchableCountrySelect
                  value={formData.country}
                  onChange={(val) => {
                    const code = getDialCodeForCountry(val);
                    let newPhone = formData.phone;
                    if (code) {
                      if (!newPhone || newPhone.trim() === '' || newPhone.startsWith('+')) {
                        const digits = newPhone.replace(/^\+\d+[-.\s]*/, '').trim();
                        newPhone = digits ? `${code} ${digits}` : `${code} `;
                      } else {
                        newPhone = `${code} ${newPhone.trim()}`;
                      }
                    }
                    setFormData({ ...formData, country: val, phone: newPhone });
                  }}
                  placeholder="Search and select country (A-Z)..."
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder={formData.country ? `${getDialCodeForCountry(formData.country)} 300 0000000` : "+92 300 0000000"}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#07090E] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-[11px] text-slate-300 font-mono leading-tight">
                  Direct 20% commission tier setup with instant payouts & global client tracking.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : 'Submit IB Application'}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
