import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Zap, Sparkles, Play, Pause, CheckCircle2, 
  Activity, Flame, BarChart3, Clock, TrendingUp
} from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';
import { ReceiveDollarModal } from './ReceiveDollarModal';

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

interface LiveEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onOpenMasterPlan?: () => void;
}

export const LiveEarningsModal: React.FC<LiveEarningsModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenMasterPlan
}) => {
  const userKey = user?.email || 'user';
  const [isEarning, setIsEarningState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`dc_isEarning_${userKey}`) === 'true';
    } catch {
      return false;
    }
  });

  const [earnedAmount, setEarnedAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`dc_earnedAmount_${userKey}`);
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(86400);
  const [turboBooster, setTurboBooster] = useState<boolean>(false);
  const [isReceiveDollarOpen, setIsReceiveDollarOpen] = useState<boolean>(false);
  const [transfers, setTransfers] = useState<InternalTransferRecord[]>([]);
  const [depositError, setDepositError] = useState<string | null>(null);

  const setIsEarning = (val: boolean) => {
    setIsEarningState(val);
    try {
      localStorage.setItem(`dc_isEarning_${userKey}`, val ? 'true' : 'false');
      localStorage.setItem(`dc_lastEarningTime_${userKey}`, Date.now().toString());
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  // Fetch internal transfers to compute rate and balance
  const fetchTransfers = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/user/internal-transfers?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers || []);
      }
    } catch (err) {
      console.warn('Error fetching internal transfers in LiveEarningsModal:', err);
    }
  };

  useEffect(() => {
    if (isOpen && user?.email) {
      fetchTransfers();
    }
  }, [isOpen, user?.email]);

  // Calculate total dollars received strictly from internal transfers
  const totalTransfersReceived = transfers.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

  // Tier calculation: DC1 ($100 - $500 -> 25% monthly), DC2 ($501 - $1000 -> 30% monthly), DC3 ($1001+ -> 35% monthly)
  let monthlyRate = 0.25;
  let tierBadge = 'DC1 (25% Monthly Return)';

  if (totalTransfersReceived >= 1001) {
    monthlyRate = 0.35;
    tierBadge = 'DC3 (35% Monthly Return)';
  } else if (totalTransfersReceived > 500) {
    monthlyRate = 0.30;
    tierBadge = 'DC2 (30% Monthly Return)';
  } else if (totalTransfersReceived >= 100) {
    monthlyRate = 0.25;
    tierBadge = 'DC1 (25% Monthly Return)';
  } else if (totalTransfersReceived > 0) {
    monthlyRate = 0.20;
    tierBadge = 'Starter (20% Monthly Return)';
  }

  // Calculate yield speed per second
  const effectiveBaseDollars = totalTransfersReceived > 0 ? totalTransfersReceived : 0;
  const yieldPerSecond = (effectiveBaseDollars * monthlyRate) / 2592000;

  // Catch up on offline background earnings when component or transfers update
  useEffect(() => {
    if (isEarning && yieldPerSecond > 0) {
      try {
        const lastTime = localStorage.getItem(`dc_lastEarningTime_${userKey}`);
        if (lastTime) {
          const elapsedSecs = (Date.now() - parseInt(lastTime, 10)) / 1000;
          if (elapsedSecs > 1) {
            const addedYield = elapsedSecs * (turboBooster ? yieldPerSecond * 2.5 : yieldPerSecond);
            setEarnedAmount((prev) => {
              const updated = prev + addedYield;
              localStorage.setItem(`dc_earnedAmount_${userKey}`, updated.toString());
              return updated;
            });
          }
        }
        localStorage.setItem(`dc_lastEarningTime_${userKey}`, Date.now().toString());
      } catch (e) {
        console.warn('Background yield catchup error:', e);
      }
    }
  }, [isEarning, yieldPerSecond, userKey, turboBooster]);

  // Real-time automatic dollars generation tick & next cycle countdown
  useEffect(() => {
    let interval: any;
    if (isEarning) {
      interval = setInterval(() => {
        setEarnedAmount((prev) => {
          const next = prev + (turboBooster ? yieldPerSecond * 2.5 : yieldPerSecond);
          try {
            localStorage.setItem(`dc_earnedAmount_${userKey}`, next.toString());
            localStorage.setItem(`dc_lastEarningTime_${userKey}`, Date.now().toString());
          } catch (e) {
            console.warn('LocalStorage save error:', e);
          }
          return next;
        });
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 86400));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isEarning, yieldPerSecond, turboBooster, userKey]);

  if (!isOpen) return null;

  // Format seconds into HH : MM : SS
  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return {
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0')
    };
  };

  const { hours, minutes, seconds } = formatTime(secondsRemaining);

  // Formatted live generated balance
  const formattedBalance = earnedAmount.toFixed(8);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden w-full max-w-full bg-[#030712] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Ambient Animated Glow Backgrounds */}
        <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none -z-10" />

        {/* TOP NAVIGATION BAR */}
        <header className="sticky top-0 z-30 bg-[#050B18]/90 backdrop-blur-xl border-b border-cyan-500/20 px-4 sm:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left Title Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-[#0B1A35] to-purple-500/20 border border-cyan-400/50 flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <Logo size={28} className="w-full h-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent font-mono uppercase">
                    Live Earnings Engine
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE 24/7
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Real-Time Automated Yield & Mining Hashrate Stream</p>
              </div>
            </div>

            {/* Quick Actions & Exit */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-[#0A1328] border border-cyan-500/30 rounded-2xl px-3.5 py-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-300 font-mono">Hashrate: <strong className="text-cyan-300">{turboBooster ? '980 MH/s' : '450 MH/s'}</strong></span>
              </div>

              {/* INVEST Button next to Hashrate */}
              {onOpenMasterPlan && (
                <button
                  onClick={onOpenMasterPlan}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 hover:brightness-110 text-slate-950 font-mono text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:scale-105 active:scale-95"
                >
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                  <span>INVEST</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:border-cyan-400/50"
              >
                <span>EXIT ENGINE</span>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN PAGE BODY */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-8">
          
          {/* TOP HERO ROW: Left Main Card + Right Live Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
            
            {/* HERO CARD (Exact match with user requested layout screenshot + ultra polish) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-5 relative bg-[#070D1B] border border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_90px_rgba(6,182,212,0.25)] flex flex-col justify-between overflow-hidden text-center group"
            >
              {/* Background ambient lighting */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Main Brand Logo Badge */}
              <div className="flex flex-col items-center pt-2">
                <div className="w-20 h-20 rounded-3xl bg-[#0B1A35] border border-cyan-400/80 shadow-[0_0_40px_rgba(6,182,212,0.6)] flex items-center justify-center p-2.5 mb-4 group-hover:scale-105 transition-transform">
                  <Logo size={64} className="w-full h-full" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent tracking-tight font-mono uppercase">
                  Live Earnings
                </h2>

                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-mono text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Admin Internal Transfer Balance</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide mt-2">
                  Current Balance
                </p>

                {/* Big Live Decimal Counter */}
                <div className="my-4 font-mono font-black text-3xl sm:text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-cyan-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                  ${formattedBalance}
                </div>
              </div>

              {/* Next Cycle Timer Card */}
              <div className="w-full p-4 sm:p-4.5 rounded-2xl bg-[#0B152B]/90 border border-slate-800/90 flex items-center justify-between my-4 shadow-inner relative z-10">
                <div className="flex items-center gap-2">
                  <Zap className="w-4.5 h-4.5 text-cyan-400 fill-cyan-400" />
                  <span className="text-slate-300 text-xs sm:text-sm font-medium">Next cycle:</span>
                </div>

                {/* Digital Clock Display */}
                <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold">
                  <span className="px-3 py-1.5 rounded-xl bg-[#040814] border border-slate-800 text-white tracking-widest shadow-inner">
                    {hours}
                  </span>
                  <span className="text-cyan-400 font-bold">:</span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#040814] border border-slate-800 text-white tracking-widest shadow-inner">
                    {minutes}
                  </span>
                  <span className="text-cyan-400 font-bold">:</span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#040814] border border-slate-800 text-white tracking-widest shadow-inner">
                    {seconds}
                  </span>
                </div>
              </div>

              {/* Deposit Error Warning Banner */}
              {depositError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-center text-red-300 font-mono text-xs sm:text-sm font-bold relative z-10 animate-pulse">
                  ⚠️ {depositError}
                </div>
              )}

              {/* Start / Pause Engine Button */}
              <button
                onClick={() => {
                  if (totalTransfersReceived <= 0) {
                    setDepositError("First deposit your dollar");
                    setIsReceiveDollarOpen(true);
                  } else {
                    setDepositError(null);
                    setIsEarning(true);
                    setIsReceiveDollarOpen(true);
                  }
                }}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base font-sans flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(52,211,153,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer relative z-10 ${
                  isEarning
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 ring-2 ring-emerald-300'
                    : 'bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400 hover:brightness-110 text-slate-950'
                }`}
              >
                {isEarning ? (
                  <>
                    <Zap className="w-5 h-5 fill-slate-950 text-slate-950 animate-pulse" />
                    <span className="tracking-wide uppercase font-mono font-black">EARNING IN PROGRESS</span>
                    <Sparkles className="w-5 h-5 text-slate-950 animate-bounce" />
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-slate-950 text-slate-950 stroke-[2.5]" />
                    <span className="tracking-wide uppercase font-mono">START EARN AUTOMATICALLY</span>
                    <Sparkles className="w-5 h-5 text-slate-950 animate-bounce" />
                  </>
                )}
              </button>
            </motion.div>

            {/* RIGHT SIDE: FULL STATS & REALTIME GRAPH STREAM */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              
              {/* LIVE REALTIME PERFORMANCE CHART CANVAS / VISUALIZER */}
              <div className="bg-[#070D1B] border border-slate-800 rounded-3xl p-5 sm:p-6 h-full flex flex-col justify-between relative overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-200">Real-Time Yield Stream Visualizer</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
                    {isEarning ? (yieldPerSecond * (turboBooster ? 2.5 : 1)).toFixed(8) : '0.00000000'} USD/sec
                  </span>
                </div>

                {/* Animated Bars Graphic Simulation */}
                <div className="py-6 flex items-end justify-between gap-1.5 sm:gap-3 h-36">
                  {[40, 55, 35, 70, 65, 85, 50, 95, 75, 88, 60, 100, 90, 110, 105, 120].map((height, i) => (
                    <div key={i} className="flex-1 bg-slate-900/80 rounded-t-lg h-full flex items-end overflow-hidden">
                      <motion.div 
                        initial={{ height: '20%' }}
                        animate={{ height: isEarning ? `${Math.min(100, height)}%` : '15%' }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', delay: i * 0.08 }}
                        className={`w-full rounded-t-lg ${
                          i % 3 === 0 
                            ? 'bg-gradient-to-t from-cyan-600 to-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                            : i % 2 === 0
                            ? 'bg-gradient-to-t from-purple-600 to-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                            : 'bg-gradient-to-t from-emerald-600 to-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Footer Controls Row */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>STATUS: ACTIVE & STREAMING</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>NETWORK: MAINNET-AI</span>
                    <span>LATENCY: 12ms</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* LOWER CONTROLS & BOOSTERS SECTION */}
          <div className="w-full">
            {/* 2.5x Turbo Multiplier Toggle */}
            <div className="bg-[#070D1B] border border-amber-500/30 rounded-3xl p-6 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-sm text-white uppercase">2.5x Turbo Booster</h4>
                  <p className="text-xs text-slate-400">Accelerate yield velocity by +150%</p>
                </div>
              </div>
              <button
                onClick={() => setTurboBooster(!turboBooster)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                  turboBooster ? 'bg-amber-400' : 'bg-slate-800'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-slate-950 shadow-md transition-transform ${
                  turboBooster ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* RECENT LIVE TRANSACTION LEDGER */}
          <div className="bg-[#070D1B] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-200">Live Yield Block Ledger</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Updated 1 sec ago</span>
            </div>

            <div className="divide-y divide-slate-800/60 font-mono text-xs">
              {[
                { time: 'Just now', amount: '+0.00000045 USDT', hash: '0x8f2a...c391', type: 'AI Yield Mining Block #891204', status: 'CONFIRMED' },
                { time: '12s ago', amount: '+0.00000045 USDT', hash: '0x3d91...120e', type: 'AI Yield Mining Block #891203', status: 'CONFIRMED' },
                { time: '24s ago', amount: '+0.00000045 USDT', hash: '0x1c84...fa82', type: 'AI Yield Mining Block #891202', status: 'CONFIRMED' },
                { time: '36s ago', amount: '+0.00000045 USDT', hash: '0x9920...78b1', type: 'AI Yield Mining Block #891201', status: 'CONFIRMED' },
              ].map((row, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-slate-300 hover:bg-slate-900/40 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-100">{row.type}</span>
                      <span className="text-slate-500 text-[10px] ml-2">({row.hash})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="text-emerald-400 font-bold">{row.amount}</span>
                    <span className="text-slate-500 w-16 text-[10px]">{row.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>

        {/* Receive Dollar Portal Modal */}
        <ReceiveDollarModal
          isOpen={isReceiveDollarOpen}
          onClose={() => setIsReceiveDollarOpen(false)}
          user={user}
          onOpenMasterPlan={onOpenMasterPlan}
          isEarning={isEarning}
          setIsEarning={setIsEarning}
          generatedYield={earnedAmount}
          setGeneratedYield={setEarnedAmount}
          totalTransfersReceived={totalTransfersReceived}
          yieldPerSecond={yieldPerSecond}
          monthlyRate={monthlyRate}
          tierBadge={tierBadge}
          depositError={depositError}
          setDepositError={setDepositError}
        />
      </div>
    </AnimatePresence>
  );
};

