import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ShieldCheck, Building2, TrendingUp, RefreshCw, ArrowRightLeft, Lock } from 'lucide-react';

interface ServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

export const ServicesModal: React.FC<ServicesModalProps> = ({
  isOpen,
  onClose,
  onOpenDeposit
}) => {
  if (!isOpen) return null;

  const services = [
    {
      icon: <Zap className="w-6 h-6 text-cyan-400" />,
      title: "Micro-Yield Accrual Engine",
      desc: "Sub-second real-time interest compounding with 12-decimal precision floating point calculations. Watch yield accrue every micro-tick."
    },
    {
      icon: <Building2 className="w-6 h-6 text-amber-400" />,
      title: "IB Partner Institutional Network",
      desc: "Instant 10% direct referral commission rewards on client memberships with transparent ledger tracking and instant wallet withdrawals."
    },
    {
      icon: <ArrowRightLeft className="w-6 h-6 text-emerald-400" />,
      title: "Internal Wallet Transfer",
      desc: "Zero-fee instant balance transfers between registered Dollar Craft accounts using secure email validation."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
      title: "256-Bit Atomic Security",
      desc: "Row-level database concurrency locks and automated double-spend prevention safeguarding capital at rest and in transit."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
      title: "High-Yield Quantum Cycles",
      desc: "Flexible 24-hour to multi-day capital yield plans designed for optimal liquidity management and guaranteed daily rates."
    },
    {
      icon: <Lock className="w-6 h-6 text-teal-400" />,
      title: "Instant Liquidity & Cashout",
      desc: "Multi-chain crypto support (USDT-TRC20, USDT-BEP20, USDT-ERC20) with minimum $50.00 withdrawal threshold."
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md p-2 sm:p-4 w-full max-w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-[#0B0F17] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/20 p-6 md:p-8 text-white overflow-hidden max-h-[90vh] overflow-y-auto space-y-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono">
                Dollar Craft Services
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Comprehensive Digital Asset Micro-Yield Infrastructure
              </p>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s, idx) => (
              <div key={idx} className="p-4 bg-[#07090E] border border-slate-800 hover:border-cyan-500/40 rounded-2xl space-y-2 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    {s.icon}
                  </div>
                  <h3 className="font-bold text-white text-sm">{s.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <p className="text-xs text-slate-400 font-mono">
              Designed for institutional liquidity & global precision.
            </p>
            {onOpenDeposit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Start Investment Now
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
