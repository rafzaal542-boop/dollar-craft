import React, { useState, useEffect } from 'react';
import { BigNumber, formatPrecision, formatCurrency } from '../lib/yieldEngine';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Activity, 
  Eye, 
  EyeOff, 
  Lock,
  ArrowUpRight
} from 'lucide-react';

interface LiveBalanceTickerProps {
  principalBalance: string;
  earnedYield: string;
  microYieldPerSecond: string;
  isLive: boolean;
}

export const LiveBalanceTicker: React.FC<LiveBalanceTickerProps> = ({
  principalBalance,
  earnedYield,
  microYieldPerSecond,
  isLive
}) => {
  const [decimalsCount, setDecimalsCount] = useState<number>(12);
  const [showSensitivity, setShowSensitivity] = useState<boolean>(true);
  const [flashTick, setFlashTick] = useState<boolean>(false);

  // Parse total real-time balance
  const principalBN = new BigNumber(principalBalance || 0);
  const yieldBN = new BigNumber(earnedYield || 0);
  const totalBalanceBN = principalBN.plus(yieldBN);

  // Trigger subtle green pulse visual effect on tick
  useEffect(() => {
    if (!isLive) return;
    setFlashTick(true);
    const timer = setTimeout(() => setFlashTick(false), 200);
    return () => clearTimeout(timer);
  }, [earnedYield, isLive]);

  const formattedTotal = formatPrecision(totalBalanceBN, decimalsCount);
  const [integerPart, decimalPart] = formattedTotal.split('.');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-zinc-900 to-black p-6 border border-zinc-800 shadow-2xl text-white">
      {/* Background Micro-Glow Accent */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Live Yield Stream</span>
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isLive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                {isLive ? 'TICKING (1000ms)' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Sub-penny 18-Decimal High Precision Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Decimal Precision Switcher Buttons */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <span className="text-zinc-500 px-2 text-[10px] hidden sm:inline">Precision:</span>
            <button
              onClick={() => setDecimalsCount(6)}
              className={`px-2 py-0.5 rounded text-[11px] transition-all ${decimalsCount === 6 ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              6d
            </button>
            <button
              onClick={() => setDecimalsCount(12)}
              className={`px-2 py-0.5 rounded text-[11px] transition-all ${decimalsCount === 12 ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              12d
            </button>
            <button
              onClick={() => setDecimalsCount(18)}
              className={`px-2 py-0.5 rounded text-[11px] transition-all ${decimalsCount === 18 ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              18d
            </button>
          </div>

          <button
            onClick={() => setShowSensitivity(!showSensitivity)}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="Toggle Visibility"
          >
            {showSensitivity ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main High Precision Counter */}
      <div className="py-6">
        <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
          <span>Net Consolidated Account Value</span>
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +${formatPrecision(microYieldPerSecond, 8)}/sec
          </span>
        </div>

        {showSensitivity ? (
          <div className="flex items-baseline flex-wrap gap-x-1 font-mono tracking-tight">
            <span className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white">
              ${integerPart}.
            </span>
            <span className={`text-xl sm:text-3xl lg:text-4xl font-bold transition-colors duration-150 ${
              flashTick ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-emerald-400'
            }`}>
              {decimalPart}
            </span>
          </div>
        ) : (
          <div className="text-3xl font-bold text-zinc-500 tracking-widest py-2">
            ••••••••••••••••••••
          </div>
        )}

        <p className="text-[11px] text-zinc-400 mt-2 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            24/7 Cloud AI Yielding: ACTIVE
          </span>
          <span className="text-zinc-500">
            • Continues generating yield 24/7 when browser/tab is closed
          </span>
        </p>
      </div>

      {/* Bottom Metrics Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-800/80">
        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
          <span className="text-[11px] text-zinc-400 block mb-0.5">Active Principal</span>
          <span className="text-sm sm:text-base font-semibold text-zinc-100 font-mono">
            {formatCurrency(principalBalance)}
          </span>
        </div>

        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
          <span className="text-[11px] text-zinc-400 block mb-0.5">Accrued Micro Yield</span>
          <span className="text-sm sm:text-base font-semibold text-emerald-400 font-mono">
            ${formatPrecision(earnedYield, 6)}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
          <span className="text-[11px] text-zinc-400 block mb-0.5">Estimated 24h Yield</span>
          <span className="text-sm sm:text-base font-semibold text-blue-400 font-mono">
            ${formatCurrency(new BigNumber(microYieldPerSecond || 0).multipliedBy(86400))}
          </span>
        </div>
      </div>
    </div>
  );
};
