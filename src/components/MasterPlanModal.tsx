import React from 'react';
import { X, TrendingUp, ShieldCheck, Zap, ArrowRight, CheckCircle2, Wallet, DollarSign, ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo';
import { InvestmentPlan, User } from '../types';
import { INITIAL_PLANS } from '../data/mockData';

interface MasterPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans?: InvestmentPlan[];
  onSelectPlan?: (plan: InvestmentPlan) => void;
  currentUser?: User | null;
}

export const MasterPlanModal: React.FC<MasterPlanModalProps> = ({ 
  isOpen, 
  onClose,
  plans = INITIAL_PLANS,
  onSelectPlan,
  currentUser
}) => {
  if (!isOpen) return null;

  const totalUserDollars = currentUser
    ? (Number(currentUser.principalBalance || 0) + Number(currentUser.earnedYield || 0))
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md p-2 sm:p-4 w-full max-w-full">
      <div className="flex min-h-full items-center justify-center text-center p-0 sm:p-2">
        <div className="relative w-full max-w-6xl bg-gradient-to-b from-[#0D1527] via-[#070C18] to-[#040710] border border-cyan-500/30 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.18)] overflow-hidden text-white text-left my-auto flex flex-col max-h-[92vh] ring-1 ring-cyan-500/20">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Logo size={38} className="w-9 h-9" />
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2 flex-wrap">
                <span className="tracking-tight">Dollar Craft Investment Plans</span>
                <span className="text-[10px] font-mono bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-500/30 font-black uppercase tracking-wider shadow-sm">
                  HIGH YIELD PACKAGES
                </span>
              </h3>
              <p className="text-xs font-semibold text-slate-300 mt-0.5">Select an official investment plan to start streaming high-frequency micro-yield returns</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Investment Plans Grid */}
        <div className="relative z-10 p-5 sm:p-6 overflow-y-auto space-y-6">



          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isStandard = plan.id === 'plan-standard' || plan.name.toLowerCase().includes('standard');
              const isPremium = plan.id === 'plan-premium' || plan.name.toLowerCase().includes('premium');
              const isVip = plan.id === 'plan-vip' || plan.name.toLowerCase().includes('vip');
              
              let cardBg = 'bg-[#060C17] border-slate-800 hover:border-cyan-500/50';
              let glowColor = 'bg-cyan-500/10';
              let btnGradient = 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:brightness-110 text-white font-black shadow-cyan-500/25';
              let badgeCode = 'DC1';
              let badgeStyle = 'bg-cyan-400 text-slate-950 shadow-cyan-500/30';
              let tierStyle = 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30';
              let yieldText = 'text-cyan-300';
              let yieldLabel = 'text-cyan-400';

              if (isVip) {
                cardBg = 'bg-gradient-to-b from-[#2E0938] via-[#1B0522] to-[#0E0212] border-fuchsia-500/80 shadow-2xl shadow-purple-950/80 ring-1 ring-fuchsia-400/50';
                glowColor = 'bg-fuchsia-500/20';
                btnGradient = 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 hover:brightness-110 text-white font-black shadow-fuchsia-500/40';
                badgeCode = 'DC3';
                badgeStyle = 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-fuchsia-500/40 border border-fuchsia-400';
                tierStyle = 'text-fuchsia-300 bg-fuchsia-500/20 border-fuchsia-500/40';
                yieldText = 'text-fuchsia-300';
                yieldLabel = 'text-fuchsia-400';
              } else if (isPremium) {
                cardBg = 'bg-gradient-to-b from-[#2B1B06] via-[#1A1003] to-[#0D0801] border-amber-400/70 shadow-2xl shadow-amber-950/60 ring-1 ring-amber-400/40';
                glowColor = 'bg-amber-500/20';
                btnGradient = 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:brightness-110 text-slate-950 font-black shadow-amber-500/30';
                badgeCode = 'DC2';
                badgeStyle = 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-amber-500/30 border border-amber-300';
                tierStyle = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
                yieldText = 'text-amber-300';
                yieldLabel = 'text-amber-400';
              } else if (isStandard) {
                cardBg = 'bg-gradient-to-b from-[#082220] via-[#041412] to-[#020A09] border-cyan-400/60 shadow-2xl shadow-cyan-950/60 ring-1 ring-cyan-400/40';
                glowColor = 'bg-cyan-500/20';
                btnGradient = 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black shadow-cyan-500/25';
                badgeCode = 'DC1';
                badgeStyle = 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-cyan-500/30 border border-cyan-300';
                tierStyle = 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30';
                yieldText = 'text-cyan-300';
                yieldLabel = 'text-cyan-400';
              }

              return (
                <div 
                  key={plan.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-6 group relative overflow-hidden ${cardBg}`}
                >
                  <div className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none ${glowColor}`} />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md ${badgeStyle}`}>
                          {badgeCode}
                        </span>
                      </div>
                      <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${tierStyle}`}>
                        {plan.tierRequirement || 'ALL USERS'} TIER
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-white uppercase tracking-wide">
                        {plan.name}
                      </h4>
                      <div className="pt-2 flex items-baseline gap-2">
                        <span className={`text-3xl font-black font-mono tracking-tight ${yieldText}`}>
                          {isVip ? '35%' : isPremium ? '30%' : isStandard ? '25%' : `${plan.dailyYieldPercent}%`}
                        </span>
                        <span className={`text-xs font-black uppercase tracking-wider font-mono ${yieldLabel}`}>
                          {isVip || isPremium || isStandard ? 'MONTHLY RETURN' : 'DAILY YIELD'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-2 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 pt-3 border-t border-slate-800/80 text-xs font-mono">
                      <div className="bg-[#050A14]/80 p-3.5 rounded-xl border border-slate-800/90 flex justify-between items-center shadow-inner">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Duration:</span>
                        <span className="text-white font-black text-sm">
                          {isVip || isPremium || isStandard ? '8 Months (240 Days)' : `${plan.durationDays} Days`}
                        </span>
                      </div>
                      <div className="bg-[#050A14]/80 p-3.5 rounded-xl border border-slate-800/90 flex justify-between items-center shadow-inner">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Deposit:</span>
                        <span className={`font-black text-sm ${yieldText}`}>
                          {plan.maxDeposit >= 1000000 ? `$${plan.minDeposit.toLocaleString()} - Unlimited` : `$${plan.minDeposit.toLocaleString()} - $${plan.maxDeposit.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 w-full">
                    <button
                      onClick={() => {
                        if (onSelectPlan) {
                          onSelectPlan(plan);
                        } else {
                          onClose();
                        }
                      }}
                      className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${btnGradient}`}
                    >
                      <span>Activate {plan.name}</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-[#050A14]/90 border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-300 shadow-lg">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Micro-yield streamed live to your balance with 26-decimal fixed-point precision.</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold shrink-0 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Accrual
            </div>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
};

