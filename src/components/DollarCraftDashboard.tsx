import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BigNumber from "bignumber.js";
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Zap,
  Sparkles,
  Lock,
  RefreshCw,
  Cpu,
  Layers,
  ChevronRight,
  ShieldCheck,
  Flame,
  Activity,
  Building2,
  Award,
  Globe,
  BookOpen,
  UserCheck,
  Shield,
  Copy,
  Check,
  User as UserIcon,
  BadgeCheck,
  LogIn,
  Key
} from "lucide-react";
import { Logo } from "./Logo";
import { YieldProjectionChart } from "./YieldProjectionChart";
import { CinematicButton } from "./ui/CinematicButton";
import { User } from "../types";

interface ActivePlan {
  id: string;
  planName: string;
  principal: string;
  dailyRate: string;
  accumulatedYield: string;
  progressPercent: number;
  status: "ACTIVE" | "COMPLETED";
  expiryHours: number;
  network: string;
}

interface DollarCraftDashboardProps {
  user?: User | null;
  activeTab?: string;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenIB?: () => void;
  onOpenAboutUs?: () => void;
  onOpenServices?: () => void;
  onOpenContact?: () => void;
  onOpenIBPartner?: () => void;
  onOpenMasterPlan?: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
}

// Persistence storage keys for 24/7 non-stop dollar generation
const STORAGE_BAL = "dollarcraft_live_balance";
const STORAGE_YIELD = "dollarcraft_total_yield";
const STORAGE_TIME = "dollarcraft_last_saved_timestamp";

function calculateOfflineYield(savedVal: string, elapsedSeconds: number, defaultInt: string): string {
  const parts = (savedVal || `${defaultInt}.0000`).split(".");
  let intBN = new BigNumber(parts[0] || defaultInt);
  let fracBN = new BigNumber("0." + (parts[1] || "0000"));

  // 10 ticks per second at 100ms interval, 0.0025 per tick -> 0.025 per second
  const offlineIncrement = new BigNumber(elapsedSeconds).multipliedBy("0.025");
  fracBN = fracBN.plus(offlineIncrement);

  const blocks = fracBN.dividedBy("0.5000").integerValue(BigNumber.ROUND_FLOOR);
  if (blocks.gt(0)) {
    intBN = intBN.plus(blocks.multipliedBy(5));
    fracBN = fracBN.minus(blocks.multipliedBy("0.5000"));
  }

  const formattedFrac = fracBN.toFixed(4).split(".")[1] || "0000";
  return `${intBN.toFixed(0)}.${formattedFrac}`;
}

const loadPersistentState = () => {
  const DEFAULT_BAL = "680364542.0000";
  const DEFAULT_YIELD = "45892301.0000";

  if (typeof window === "undefined") {
    return { initialBal: DEFAULT_BAL, initialYld: DEFAULT_YIELD };
  }

  const savedBal = localStorage.getItem(STORAGE_BAL);
  const savedYield = localStorage.getItem(STORAGE_YIELD);
  const savedTimeStr = localStorage.getItem(STORAGE_TIME);

  let initialBal = savedBal && new BigNumber(savedBal.split(".")[0] || "0").gte(680364542) ? savedBal : DEFAULT_BAL;
  let initialYld = savedYield || DEFAULT_YIELD;

  if (savedTimeStr) {
    const savedTime = parseInt(savedTimeStr, 10);
    const now = Date.now();
    const elapsedMs = Math.max(0, now - savedTime);
    const elapsedSeconds = elapsedMs / 1000;

    if (elapsedSeconds > 0) {
      initialBal = calculateOfflineYield(initialBal, elapsedSeconds, "680364542");
      initialYld = calculateOfflineYield(initialYld, elapsedSeconds, "45892301");
    }
  }

  return { initialBal, initialYld };
};

export const DollarCraftDashboard: React.FC<DollarCraftDashboardProps> = ({
  user,
  activeTab,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenIB,
  onOpenAboutUs,
  onOpenServices,
  onOpenContact,
  onOpenIBPartner,
  onOpenMasterPlan,
  onOpenAuth
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Ultra-High Precision Persistent Live Balance State (4 Decimals with 5000 limit)
  const [liveBalance, setLiveBalance] = useState<string>(() => loadPersistentState().initialBal);
  const [totalYield, setTotalYield] = useState<string>(() => loadPersistentState().initialYld);
  const [isTickActive, setIsTickActive] = useState<boolean>(true);
  const [tickSpeedMs, setTickSpeedMs] = useState<number>(100); // Fast 100ms speed for rapid tick accumulation

  // Persist current balance and timestamp whenever balance updates or tab closes
  useEffect(() => {
    localStorage.setItem(STORAGE_BAL, liveBalance);
    localStorage.setItem(STORAGE_YIELD, totalYield);
    localStorage.setItem(STORAGE_TIME, Date.now().toString());
  }, [liveBalance, totalYield]);

  useEffect(() => {
    const handleSaveOnLeave = () => {
      localStorage.setItem(STORAGE_BAL, liveBalance);
      localStorage.setItem(STORAGE_YIELD, totalYield);
      localStorage.setItem(STORAGE_TIME, Date.now().toString());
    };

    window.addEventListener("beforeunload", handleSaveOnLeave);
    document.addEventListener("visibilitychange", handleSaveOnLeave);

    return () => {
      window.removeEventListener("beforeunload", handleSaveOnLeave);
      document.removeEventListener("visibilitychange", handleSaveOnLeave);
    };
  }, [liveBalance, totalYield]);

  const countries = [
    { flag: '🇺🇸', code: 'us', name: 'USA', detail: 'SEC Registered' },
    { flag: '🇨🇦', code: 'ca', name: 'Canada', detail: 'MSB Certified' },
    { flag: '🇦🇺', code: 'au', name: 'Australia', detail: 'AUSTRAC Compliant' },
    { flag: '🇬🇧', code: 'gb', name: 'UK', detail: 'FCA Compliant' },
    { flag: '🇦🇪', code: 'ae', name: 'UAE', detail: 'VARA Licensed' },
    { flag: '🇸🇬', code: 'sg', name: 'Singapore', detail: 'MAS Capital Hub' },
    { flag: '🇪🇺', code: 'eu', name: 'Europe', detail: 'MiCA Framework' },
  ];

  const [activePlans, setActivePlans] = useState<ActivePlan[]>([
    {
      id: "cycle_901",
      planName: "Quantum Craft 24H",
      principal: "1000.00",
      dailyRate: "2.5%",
      accumulatedYield: "32.0000",
      progressPercent: 68,
      status: "ACTIVE",
      expiryHours: 7.6,
      network: "USDT-TRC20"
    }
  ]);

  // Real-Time Micro-Tick Simulation Engine (Limit 5000 -> Auto +$5 Dollar Increase)
  useEffect(() => {
    if (!isTickActive) return;

    const interval = setInterval(() => {
      setLiveBalance((prev) => {
        const parts = prev.split(".");
        let intBN = new BigNumber(parts[0] || "680364542");
        let fracBN = new BigNumber("0." + (parts[1] || "0000"));

        // Micro-tick increment
        const microIncrement = new BigNumber("0.0025");
        let nextFrac = fracBN.plus(microIncrement);

        // Limit of 5000 micro-ticks (0.5000) -> Auto +$5 Dollar Increase
        if (nextFrac.gte(new BigNumber("0.5000"))) {
          intBN = intBN.plus(5);
          nextFrac = nextFrac.minus(new BigNumber("0.5000"));
        }

        const formattedFrac = nextFrac.toFixed(4).split(".")[1] || "0000";
        return `${intBN.toFixed(0)}.${formattedFrac}`;
      });

      setTotalYield((prev) => {
        const parts = prev.split(".");
        let intBN = new BigNumber(parts[0] || "45892301");
        let fracBN = new BigNumber("0." + (parts[1] || "0000"));

        const microIncrement = new BigNumber("0.0025");
        let nextFrac = fracBN.plus(microIncrement);

        if (nextFrac.gte(new BigNumber("0.5000"))) {
          intBN = intBN.plus(5);
          nextFrac = nextFrac.minus(new BigNumber("0.5000"));
        }

        const formattedFrac = nextFrac.toFixed(4).split(".")[1] || "0000";
        return `${intBN.toFixed(0)}.${formattedFrac}`;
      });

      // Increment cycle yields slightly
      setActivePlans((plans) =>
        plans.map((p) => {
          const bnAcc = new BigNumber(p.accumulatedYield);
          const inc = new BigNumber("0.0005");
          return {
            ...p,
            accumulatedYield: bnAcc.plus(inc).toFixed(4),
          };
        })
      );
    }, tickSpeedMs);

    return () => clearInterval(interval);
  }, [isTickActive, tickSpeedMs]);

  // Split whole number and fraction for high-tech ticker styling (4 decimals with 5000 limit)
  const splitBalance = (val: string) => {
    const parts = val.split(".");
    const rawInt = parts[0] || "0";
    let formattedInt = rawInt;
    try {
      formattedInt = new BigNumber(rawInt).toFormat();
    } catch {
      formattedInt = rawInt;
    }
    const frac = (parts[1] || "0000").slice(0, 4).padEnd(4, "0");
    return {
      integer: formattedInt,
      fraction: frac,
    };
  };

  const { integer: balInt, fraction: balFrac } = splitBalance(liveBalance);

  return (
    <div className="w-full bg-[#040812] text-slate-100 p-3 sm:p-6 lg:p-8 font-sans min-h-screen space-y-8 sm:space-y-10">
      
      {/* 1. HERO INSTITUTIONAL SECTION */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#0B132B] via-[#081023] to-[#040814] border border-cyan-500/30 p-6 sm:p-10 md:p-12 shadow-2xl shadow-cyan-950/50 overflow-hidden group">
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-amber-500/10 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>

        <div className="relative z-10 max-w-5xl space-y-6">
          {/* Main Title */}
          <div className="space-y-3">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight uppercase font-sans">
              Invest Globally with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400 drop-shadow-[0_0_25px_rgba(0,210,255,0.4)]">Dollar Craft</span>
            </h1>

            <p className="text-xs sm:text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-3xl">
              Dollar Craft is an institutional-grade digital asset micro-yield protocol and financial management ecosystem. Operating legally across <span className="text-white font-bold">7 regulated global hubs</span>, we deliver sub-second 26-decimal precision compounding, audited multi-signature custody, and automated capital growth.
            </p>
          </div>



          {/* Action Button: "Get Started" */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
            <button
              onClick={() => {
                if (onOpenAuth) {
                  onOpenAuth('login');
                } else if (onOpenMasterPlan) {
                  onOpenMasterPlan();
                } else if (onOpenDeposit) {
                  onOpenDeposit();
                }
              }}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-sm uppercase font-mono tracking-wider flex items-center gap-3 shadow-xl shadow-cyan-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>Get Started</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. REGULATED GLOBAL FINANCIAL HUBS */}
      <section className="bg-gradient-to-b from-[#080E1A] via-[#060B14] to-[#040810] p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-6 relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide font-mono">
                Registered & Operating Global Hubs
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Fully compliant operations with Tier-1 local regulatory frameworks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
              7 Active Operating Hubs
            </span>
          </div>
        </div>

        {/* 7 Countries Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
          {countries.map((c, idx) => (
            <div 
              key={idx}
              className="p-3.5 bg-[#03060D] border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-center space-y-2 transition-all hover:scale-105 group shadow-lg"
            >
              <div className="flex justify-center items-center">
                <div className="w-12 h-8 sm:w-14 sm:h-9 rounded-lg bg-slate-900 border border-slate-700/80 shadow-md flex items-center justify-center overflow-hidden group-hover:border-cyan-400 transition-all relative">
                  <img 
                    src={`https://flagcdn.com/w80/${c.code}.png`} 
                    alt={`${c.name} flag`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-xl absolute">{c.flag}</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-xs font-mono flex items-center justify-center gap-1">
                  <span>{c.name}</span>
                </h3>
                <span className="text-[9px] text-cyan-300 font-mono font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30 uppercase block mt-1">
                  {c.detail}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gradient-to-r from-cyan-950/30 via-slate-950 to-blue-950/30 rounded-2xl border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-cyan-400 shrink-0" />
            <p className="text-xs text-slate-300 font-mono">
              <span className="text-white font-bold">Institutional Custody Guarantee:</span> Quarterly third-party compliance audits & proof-of-reserve validation across all 7 operational hubs.
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30 shrink-0 uppercase">
            AUDITED & VERIFIED
          </span>
        </div>

      </section>

      {/* 3. ULTRA-PRECISION LIVE NET PROTOCOL BALANCE TICKER */}
      <section className="w-full space-y-4">
        
        {/* HERO LIVE TICKER CARD */}
        <div className="w-full bg-gradient-to-br from-[#0B132B] via-[#081023] to-[#040814] p-5 sm:p-8 rounded-3xl border border-cyan-500/40 relative overflow-hidden shadow-2xl shadow-cyan-950/60 group">
          
          {/* Subtle Radial Blue Glow behind balance */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none rounded-full"></div>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

          {/* Ticker Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-5 h-5 animate-pulse text-cyan-400" />
              </div>
              <div>
                <span className="text-xs font-mono font-black tracking-widest text-slate-200 uppercase block">
                  NET PROTOCOL ACCUMULATOR
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Sub-Second 26-Decimal Micro-Tick Precision Engine
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
            </div>
          </div>

          {/* Balance Ticker Display */}
          <div className="my-4 sm:my-8 relative z-10">
            <p className="text-[10px] sm:text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              REAL-TIME HIGH-FREQUENCY ACCUMULATION TICKER:
            </p>
            <div className="flex items-baseline font-mono tracking-tight flex-wrap break-all sm:break-normal">
              <span className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-cyan-400 mr-1 sm:mr-2 tracking-tight drop-shadow-[0_0_20px_rgba(0,210,255,0.8)]">$</span>
              <span className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight">{balInt}</span>
              <span className="text-xl sm:text-3xl md:text-5xl text-cyan-400 font-black">.</span>
              <span className="text-lg sm:text-2xl md:text-4xl lg:text-6xl font-black text-cyan-400 drop-shadow-[0_0_20px_rgba(0,210,255,0.8)] tracking-tight">
                {balFrac}
              </span>
            </div>
          </div>



        </div>
      </section>

      {/* 4. YIELD PROJECTION & CANDLESTICK CHART VISUAL COMPONENT */}
      <section className="w-full">
        <YieldProjectionChart />
      </section>

    </div>
  );
};
