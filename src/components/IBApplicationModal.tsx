import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { SearchableCountrySelect } from './SearchableCountrySelect';
import { 
  Building2, 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Phone, 
  Mail, 
  User as UserIcon, 
  Briefcase, 
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Wallet
} from 'lucide-react';

interface IBApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSubmitted?: () => void;
}

export const IBApplicationModal: React.FC<IBApplicationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmitted
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    walletAddress: currentUser?.walletAddress || '',
    country: '',
    experience: '',
    telegramWhatsapp: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          walletAddress: formData.walletAddress,
          country: formData.country || 'Global',
          experience: formData.experience || 'IB Partner Program Application',
          telegramWhatsapp: formData.telegramWhatsapp || formData.phone
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message || 'IB Application submitted successfully!');
        if (onSubmitted) onSubmitted();
      } else {
        setError(data.error || 'Failed to submit IB application.');
      }
    } catch (err: any) {
      setError(err.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md p-2 sm:p-4 w-full max-w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-[#0B0F17] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/20 p-6 md:p-8 text-white overflow-hidden"
        >
          {/* Subtle Glow Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="flex justify-between items-start mb-6 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold tracking-wide text-white font-mono uppercase">
                    Join IB Program - Unlock $7,000
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/30">
                    20% DIRECT
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  10-Level Pattern Matrix & Total $7,000 Earning Cap
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form / Content */}
          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Application Received!</h4>
              <p className="text-sm text-cyan-300 max-w-md mx-auto leading-relaxed font-mono font-semibold">
                pls hold until dollar craft approval your request
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#07090E] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#07090E] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#07090E] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Wallet Address */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">
                    USDT Wallet Address *
                  </label>
                  <div className="relative">
                    <Wallet className="w-4 h-4 text-cyan-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="0x... or T..."
                      value={formData.walletAddress}
                      onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                      className="w-full bg-[#07090E] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Country */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Country of Residence *
                  </label>
                  <SearchableCountrySelect
                    value={formData.country}
                    onChange={(val) => setFormData({ ...formData, country: val })}
                    placeholder="Search country (A-Z)..."
                    required
                  />
                </div>

                {/* Telegram / WhatsApp */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">
                    Telegram / WhatsApp Contact *
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="@telegram_handle or +123456789"
                      value={formData.telegramWhatsapp}
                      onChange={(e) => setFormData({ ...formData, telegramWhatsapp: e.target.value })}
                      className="w-full bg-[#07090E] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">
                  Referral Base & Network Experience *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <textarea
                    required
                    rows={2}
                    placeholder="Describe your client network, trading community, or marketing channels..."
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full bg-[#07090E] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono resize-none"
                  />
                </div>
              </div>

              {/* Benefits highlight */}
              <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                <p className="text-[11px] text-cyan-300 font-mono leading-relaxed">
                  20% instant credit on client deposits up to $7,000 maximum reward cap per IB. Withdraw directly to your USDT wallet anytime.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting Application...' : 'Join IB Program Now - Unlock $7000'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
