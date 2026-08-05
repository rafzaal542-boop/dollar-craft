import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Building2, ShieldCheck, CheckCircle2, Lock, Cpu } from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIBPartner?: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  isOpen,
  onClose,
  onOpenIBPartner
}) => {
  if (!isOpen) return null;

  const countries = [
    { flag: '🇺🇸', code: 'us', name: 'USA', reg: 'SEC & FinCEN Registered Entity', lic: 'MSB #310002148291' },
    { flag: '🇨🇦', code: 'ca', name: 'Canada', reg: 'FINTRAC Financial Services', lic: 'FINTRAC #M20184712' },
    { flag: '🇦🇺', code: 'au', name: 'Australia', reg: 'AUSTRAC DCE Desk', lic: 'AUSTRAC #100684920' },
    { flag: '🇬🇧', code: 'gb', name: 'UK', reg: 'FCA Regulated Framework', lic: 'FCA Reg #930412' },
    { flag: '🇦🇪', code: 'ae', name: 'UAE', reg: 'VARA Digital Asset License', lic: 'VARA #2024-089' },
    { flag: '🇸🇬', code: 'sg', name: 'Singapore', reg: 'MAS Capital Markets Hub', lic: 'MAS CMS #101824' },
    { flag: '🇪🇺', code: 'eu', name: 'Europe', reg: 'MiCA Asset Custody Framework', lic: 'MiCA #EU-8821' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md p-2 sm:p-4 w-full max-w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-gradient-to-b from-[#0B132B] via-[#081023] to-[#040814] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/80 p-6 md:p-8 text-white overflow-hidden max-h-[90vh] overflow-y-auto space-y-6"
        >
          {/* Subtle Glow Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-800/80 pb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg shadow-cyan-500/10">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight font-sans">
                  About Dollar Craft
                </h2>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                  Regulated Entity
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5">
                Registered & Operating across 7 Global Financial Hubs
              </p>
            </div>
          </div>

          {/* Overview Section */}
          <div className="p-5 rounded-2xl bg-[#03060D] border border-slate-800 space-y-3 font-sans text-xs text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold uppercase text-xs">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Institutional Digital Asset Infrastructure</span>
            </div>
            <p className="text-sm font-medium text-slate-100 leading-relaxed">
              Dollar Craft is a premier institutional digital asset yield protocol and global investment provider. 
              Built on sub-second precision calculation engines (26-decimal BigNumber) and multi-jurisdictional custody infrastructure, Dollar Craft serves individual and corporate clients across <span className="text-white font-bold">7 global financial hubs</span>.
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Backed by 256-bit atomic double-spend defense, strict mathematical yield caps, and automated 24/7 liquidity operations.
            </p>
          </div>

          {/* Country Regulatory Highlights */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Registered & Operating Jurisdictions</span>
              </h3>
              <span className="text-xs text-emerald-300 font-mono font-bold bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>7 Active Hubs</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {countries.map((c, i) => (
                <div key={i} className="p-3 bg-[#03060D] border border-slate-800 hover:border-cyan-500/40 rounded-2xl space-y-1.5 transition-all text-center">
                  <div className="w-12 h-8 mx-auto rounded bg-slate-900 border border-slate-700/80 overflow-hidden flex items-center justify-center relative shadow-sm">
                    <img 
                      src={`https://flagcdn.com/w80/${c.code}.png`} 
                      alt={`${c.name} flag`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="text-base absolute">{c.flag}</span>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-white font-mono block">
                      {c.name}
                    </span>
                    <span className="text-[9px] text-cyan-300 font-mono font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30 block mt-1">
                      REGULATED
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono block mt-1">
                      {c.lic}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Quarterly audit compliance & verified proof of reserves.</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase font-mono tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

