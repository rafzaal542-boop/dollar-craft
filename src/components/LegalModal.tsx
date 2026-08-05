import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, Lock, Scale, CheckCircle2 } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md p-2 sm:p-4 w-full max-w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#0B0F17] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/20 p-6 sm:p-8 text-white overflow-hidden my-8 max-h-[90vh] flex flex-col"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-5 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              {activeTab === 'privacy' && <Lock className="w-6 h-6" />}
              {activeTab === 'terms' && <FileText className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono">
                  Dollar Craft Legal & Compliance
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Official Regulatory, Privacy & Institutional Agreement Policies
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pt-4 pb-4 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'terms'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Terms of Service</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="overflow-y-auto pr-2 py-4 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed font-sans custom-scrollbar grow">
            
            {/* PRIVACY POLICY */}
            {activeTab === 'privacy' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-mono font-bold text-white text-sm">Data Protection & Privacy Guarantee</h3>
                    <p className="text-xs text-slate-400">
                      Dollar Craft operates under strict data encryption standards and zero-knowledge privacy protocols for all user accounts and transactions.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                    1. Information We Collect
                  </h4>
                  <p>
                    When you register an account or interact with the Dollar Craft Micro-Yield Protocol, we collect minimal required information including:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Account credentials (Email, encrypted password, and account security PINs).</li>
                    <li>Digital wallet addresses used for USDT/USDC deposits and withdrawals.</li>
                    <li>Technical telemetry data (IP address, session logs, and device security markers).</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                    2. How We Use Your Data
                  </h4>
                  <p>
                    Your personal and financial data is strictly used to maintain the functionality of your Dollar Craft account:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Processing yield computations, internal transfers, and wallet payouts.</li>
                    <li>Preventing unauthorized account access and double-spend exploits.</li>
                    <li>Delivering critical account notifications and security alerts.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                    3. Security & Encryption Standards
                  </h4>
                  <p>
                    Dollar Craft employs end-to-end 256-Bit SSL encryption, cold-storage asset vaults, and automated row-level database protection locks. We NEVER sell, lease, or monetize user data to third-party advertisers.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                    4. Cookies and Local Storage
                  </h4>
                  <p>
                    We use session storage and essential cookies strictly to maintain user authentication and preferences across platform sessions.
                  </p>
                </div>
              </motion.div>
            )}

            {/* TERMS OF SERVICE */}
            {activeTab === 'terms' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3">
                  <Scale className="w-6 h-6 text-cyan-400 shrink-0" />
                  <div>
                    <h3 className="font-mono font-bold text-white text-sm">Platform Terms Agreement</h3>
                    <p className="text-xs text-slate-400">
                      By accessing or using Dollar Craft, you agree to comply with all operational terms and regulatory guidelines outlined below.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                    1. Account Eligibility & Registration
                  </h4>
                  <p>
                    You must be at least 18 years of age or the legal age of majority in your legal jurisdiction to open a Dollar Craft account. You are responsible for safeguarding your login credentials and security tokens.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                    2. Yield Generation & Micro-Yield Protocol
                  </h4>
                  <p>
                    Dollar Craft provides automated yield farming and algorithmic liquidity strategies. Yield rates, compounding cycles, and plan rates are governed by transparent smart contracts and platform parameters.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Yield payouts are calculated in real-time or according to cycle parameters.</li>
                    <li>Principal deposits remain locked for the duration of chosen active investment cycles.</li>
                    <li>Withdrawal requests are processed via verified multi-sig channels.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                    3. IB Partner Commission Rules
                  </h4>
                  <p>
                    Introducing Broker (IB) partners are eligible to earn multi-tier referral bonuses based on active network volume. Attempting to create duplicate self-referral accounts will result in immediate partner suspension.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                    4. Limitation of Liability
                  </h4>
                  <p>
                    Dollar Craft executes mathematical risk management and reserves protocols. However, users acknowledge that digital asset markets carry market volatility risks.
                  </p>
                </div>
              </motion.div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4 shrink-0 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dollar Craft Institutional Compliance</span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all cursor-pointer border border-slate-800"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
