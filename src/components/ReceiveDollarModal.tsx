import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Wallet, DollarSign, ArrowDownLeft, CheckCircle2, 
  Sparkles, ShieldCheck, TrendingUp, Clock, RefreshCw, Mail,
  Play, Pause, Zap
} from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';

interface InternalTransferRecord {
  id: string;
  transferId: string;
  fromUserEmail: string;
  toUserEmail: string;
  toWalletType: string;
  amount: string;
  note?: string;
  status: string;
  createdAt: string;
}

interface ReceiveDollarModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onOpenMasterPlan?: () => void;
  isEarning: boolean;
  setIsEarning: (val: boolean) => void;
  generatedYield: number;
  setGeneratedYield: React.Dispatch<React.SetStateAction<number>>;
  totalTransfersReceived: number;
  yieldPerSecond: number;
  monthlyRate: number;
  tierBadge: string;
  depositError: string | null;
  setDepositError: (msg: string | null) => void;
}

export const ReceiveDollarModal: React.FC<ReceiveDollarModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenMasterPlan,
  isEarning,
  setIsEarning,
  generatedYield,
  setGeneratedYield,
  totalTransfersReceived,
  yieldPerSecond,
  monthlyRate,
  tierBadge,
  depositError,
  setDepositError
}) => {
  const [transfers, setTransfers] = useState<InternalTransferRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<string>('0.00');

  const fetchUserTransfers = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user/internal-transfers?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers || []);
        if (data.principalBalance) {
          setUserBalance(data.principalBalance);
        }
      }
    } catch (err) {
      console.warn('Error fetching user internal transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.email) {
      fetchUserTransfers();
    }
  }, [isOpen, user?.email]);

  if (!isOpen) return null;

  const totalDollars = totalTransfersReceived;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md p-2 sm:p-4 flex items-center justify-center font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl bg-[#050D1A] border border-emerald-500/40 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden text-white"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="relative z-10 px-6 py-5 border-b border-emerald-500/20 bg-[#081528]/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400/20 via-teal-500/20 to-cyan-400/20 border border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <DollarSign className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                    Internal Transfer Received
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black font-mono tracking-wide text-white uppercase mt-0.5">
                  RECEIVE DOLLAR HERE
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="relative z-10 p-6 space-y-6">

            {/* User Account Info Bar */}
            <div className="bg-[#08182B] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                    Account Email
                  </span>
                  <span className="text-sm font-bold font-mono text-cyan-300">
                    {user?.email || 'Registered User Email'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Admin Internal Transfer Active</span>
              </div>
            </div>

            {/* Main Dollar Balance Display Card with START EARN button */}
            <div className="bg-gradient-to-br from-[#061D2E] via-[#072432] to-[#0A1A29] border-2 border-emerald-400/60 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Admin Internal Transfer Dollar Balance</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">
                    Total dollars transferred directly by Admin to your account email:
                  </p>
                </div>
                
                <button 
                  onClick={fetchUserTransfers}
                  disabled={loading}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 transition-all cursor-pointer"
                  title="Refresh Transfers"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                    ${totalDollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-400 uppercase">USD</span>
                </div>

                {/* Tier Speed Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{tierBadge}</span>
                </div>
              </div>

              {/* Automatic Live Generated Yield Bar */}
              {isEarning && (
                <div className="bg-[#041221] border border-emerald-500/50 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                  <div>
                    <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Live Automatic Generated Dollars
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Speed: <strong className="text-cyan-300">{(yieldPerSecond * 3600).toFixed(6)} USD/hr</strong>
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-lg sm:text-xl font-black font-mono text-emerald-300">
                      +${generatedYield.toFixed(8)} USD
                    </span>
                  </div>
                </div>
              )}

              {/* Deposit Error Warning Banner */}
              {depositError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-center text-red-300 font-mono text-xs sm:text-sm font-bold animate-pulse shadow-lg">
                  ⚠️ {depositError}
                </div>
              )}

              {/* START EARN Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (totalDollars <= 0) {
                      setDepositError("First deposit your dollar");
                    } else {
                      setDepositError(null);
                      setIsEarning(true);
                    }
                  }}
                  className={`w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base font-mono flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg ${
                    isEarning
                      ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:brightness-110 active:scale-98'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-98'
                  }`}
                >
                  {isEarning ? (
                    <>
                      <Zap className="w-5 h-5 fill-slate-950 text-slate-950 animate-pulse" />
                      <span className="uppercase tracking-wider font-black">EARNING IN PROGRESS</span>
                      <Sparkles className="w-5 h-5 text-slate-950 animate-bounce" />
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-slate-950 stroke-[2.5]" />
                      <span className="uppercase tracking-wider">START EARN AUTOMATICALLY</span>
                      <Sparkles className="w-5 h-5 text-slate-950" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Status: <strong className="text-emerald-400">CREDITED TO WALLET</strong></span>
                <span>Auto Rate: <strong className="text-cyan-300">{(monthlyRate * 100)}% Monthly</strong></span>
              </div>
            </div>

            {/* Received Internal Transfers List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  Received Internal Transfer Records
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {transfers.length} {transfers.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>

              {transfers.length > 0 ? (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {transfers.map((tx) => (
                    <div 
                      key={tx.id}
                      className="bg-[#08182B] border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-xl flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-white">
                              {tx.transferId || 'ITX-TRANSFER'}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                              {tx.toWalletType === 'IB_COMMISSION_WALLET' ? 'IB Wallet' : 'Main Wallet'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                            From Admin: {tx.fromUserEmail || 'Admin Wallet'}
                            {tx.note ? ` • Note: ${tx.note}` : ''}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {new Date(tx.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black font-mono text-emerald-400 block">
                          +${Number(tx.amount || 0).toFixed(2)} USD
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-block mt-0.5">
                          {tx.status || 'SUCCESS'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#08182B]/60 border border-dashed border-slate-800 rounded-2xl p-5 text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold font-mono text-slate-300">
                    No Internal Transfers Received Yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto font-sans">
                    When Admin sends funds to account email <strong className="text-cyan-300">{user?.email}</strong> via Internal Transfer, the dollars will show here automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>

              {onOpenMasterPlan && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMasterPlan();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 hover:brightness-110 text-slate-950 font-mono text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:scale-105 active:scale-95"
                >
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                  <span>INVEST RECEIVED DOLLARS</span>
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
