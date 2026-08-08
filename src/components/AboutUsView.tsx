import React from 'react';
import { ShieldCheck, Globe, Building2, Award, Lock, Cpu, CheckCircle2, TrendingUp, Layers, Zap } from 'lucide-react';

interface AboutUsViewProps {
  onOpenDeposit?: () => void;
  onOpenIBPartner?: () => void;
}

export const AboutUsView: React.FC<AboutUsViewProps> = ({
  onOpenDeposit,
  onOpenIBPartner
}) => {
  const countries = [
    { flag: '🇺🇸', code: 'us', name: 'United States', reg: 'US SEC & FinCEN Registered MSB Entity', lic: 'MSB #310002148291' },
    { flag: '🇨🇦', code: 'ca', name: 'Canada', reg: 'FINTRAC Financial Services Authorization', lic: 'FINTRAC #M20184712' },
    { flag: '🇦🇺', code: 'au', name: 'Australia', reg: 'AUSTRAC Digital Currency Exchange Desk', lic: 'AUSTRAC #100684920' },
    { flag: '🇬🇧', code: 'gb', name: 'United Kingdom', reg: 'FCA Regulated Framework & Asset Custody', lic: 'FCA Reg #930412' },
    { flag: '🇦🇪', code: 'ae', name: 'UAE (Dubai)', reg: 'VARA Digital Asset Jurisdiction License', lic: 'VARA License #2024-089' },
    { flag: '🇸🇬', code: 'sg', name: 'Singapore', reg: 'MAS Capital Markets Infrastructure Hub', lic: 'MAS CMS #101824' },
    { flag: '🇪🇺', code: 'eu', name: 'European Union', reg: 'MiCA Compliant Asset Custody Framework', lic: 'MiCA Custody #EU-8821' },
  ];

  const pillars = [
    {
      icon: Cpu,
      title: 'Sub-Second Micro-Yield Engine',
      desc: 'Powered by BigNumber 26-decimal precision floating rate calculations, delivering real-time continuous yield accrual.',
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400'
    },
    {
      icon: ShieldCheck,
      title: '256-Bit Atomic Double-Spend Shield',
      desc: 'Strict mathematical limit validation preventing compounding anomalies and securing digital asset balances.',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400'
    },
    {
      icon: Globe,
      title: '7 Global Licensed Jurisdictions',
      desc: 'Operating legally across Tier-1 financial hubs under strict regulatory oversight and quarterly audit compliance.',
      color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400'
    },
    {
      icon: Building2,
      title: 'Institutional IB Partner Program',
      desc: 'Dedicated $7,000 USDT IB Membership tier granting 10% direct referral commissions and full principal deployment.',
      color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400'
    }
  ];

  return (
    <div id="about" className="space-y-10 py-2 text-slate-100 font-sans pb-12">
      
      {/* INSTITUTIONAL HERO HEADER */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#0B132B] via-[#081023] to-[#040814] border border-cyan-500/30 p-6 sm:p-10 md:p-12 shadow-2xl overflow-hidden shadow-cyan-950/50">
        
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        <div className="relative z-10 max-w-4xl space-y-6">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2 shadow-sm">
              <Globe className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
              <span>Multi-Jurisdictional Regulated Entity</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Proof of Reserves Verified</span>
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight font-sans leading-none">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400">Dollar Craft</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 font-sans leading-relaxed max-w-3xl">
              Dollar Craft is a premier institutional digital asset yield protocol and financial infrastructure provider. Registered and operating across <span className="text-white font-bold">7 global financial hubs</span>, Dollar Craft sets the golden standard for precision capital growth, transparent micro-yield accrual, and institutional custody defense.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80">
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">Global Hubs</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400">7 Active</div>
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">Yield Precision</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">18 Decimals</div>
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">Security Standard</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">256-Bit Atomic</div>
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">IB Referral Reward</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-indigo-400">10% Direct</div>
            </div>
          </div>

        </div>
      </section>

      {/* 4 CORE INSTITUTIONAL PILLARS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">Institutional Protocol Pillars</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pillars.map((p, i) => {
            const IconComp = p.icon;
            return (
              <div 
                key={i} 
                className={`p-6 rounded-2xl bg-gradient-to-br ${p.color} bg-[#080E1A] border p-6 text-white space-y-3 transition-all hover:scale-[1.01] shadow-xl`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black uppercase font-mono tracking-wide">{p.title}</h3>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* REGISTERED & OPERATING JURISDICTIONS */}
      <section className="bg-gradient-to-b from-[#080E1A] via-[#060B14] to-[#040810] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-mono font-black text-white text-lg sm:text-xl uppercase tracking-wide">
                Registered & Operating Global Hubs
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Fully compliant operations with local regulatory frameworks and license registrations.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/15 px-3.5 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>7 Active Global Licenses</span>
          </span>
        </div>

        {/* 7 Countries Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5">
          {countries.map((c, i) => (
            <div key={i} className="p-4 bg-[#03060D] border border-slate-800 hover:border-cyan-500/50 rounded-2xl flex flex-col items-center text-center gap-2.5 transition-all hover:scale-105 group shadow-lg">
              <div className="w-14 h-9 rounded-lg bg-slate-900 border border-slate-700 shrink-0 overflow-hidden flex items-center justify-center relative shadow-md group-hover:border-cyan-400 transition-all">
                <img 
                  src={`https://flagcdn.com/w80/${c.code}.png`} 
                  alt={`${c.name} flag`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-2xl absolute">{c.flag}</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-xs font-mono flex items-center justify-center gap-1.5">
                  <span>{c.name}</span>
                </h4>
                <p className="text-[10px] text-cyan-300 font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 uppercase">
                  REGULATED
                </p>
                <p className="text-[9px] text-slate-400 font-mono leading-tight pt-1">
                  {c.lic}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Security & Audit Banner Footer */}
        <div className="p-5 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-950 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              <span className="text-white font-bold">Quarterly Audit Compliance:</span> All 7 operating jurisdictions undergo continuous regulatory oversight, quarterly third-party smart contract audits, and verified proof-of-reserve validation.
            </p>
          </div>
        </div>

      </section>

    </div>
  );
};

