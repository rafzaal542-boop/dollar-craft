import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { ShieldCheck, Cpu, Globe2, Sparkles, CheckCircle2, TrendingUp, Layers, Lock } from 'lucide-react';

interface WelcomeIntroProps {
  onComplete: () => void;
}

export const WelcomeIntro: React.FC<WelcomeIntroProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [simulatedYield, setSimulatedYield] = useState<string>('0.00000000000000000000000000');

  const steps = [
    { title: 'Initializing 26-Decimal Micro-Tick Engine...', icon: Cpu, detail: 'BigNumber Fixed-Point Precision Active' },
    { title: 'Verifying Audited Multi-Sig Custodial Vaults...', icon: ShieldCheck, detail: 'AES-256 Multi-Layer Cryptographic Lock' },
    { title: 'Syncing 7 Regulated Global Financial Hubs...', icon: Globe2, detail: 'Sub-Second Institutional Liquidity Network' },
    { title: 'Institutional Protocol Active • Access Granted', icon: CheckCircle2, detail: 'Automated Capital Growth Stream Ready' }
  ];

  useEffect(() => {
    // Fast cinematic 3-second progress ticker
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsReady(true);
          setTimeout(() => {
            onComplete();
          }, 300);
          return 100;
        }
        // Smooth progression tuned for 3 seconds
        const next = prev + 1.15;
        
        // Update current step index
        if (next >= 75) setCurrentStep(3);
        else if (next >= 50) setCurrentStep(2);
        else if (next >= 25) setCurrentStep(1);
        else setCurrentStep(0);

        // Generate live 26-decimal string tick simulation
        const randomFraction = Math.floor(next * 149204859120485).toString().padStart(26, '0');
        setSimulatedYield(`0.${randomFraction.substring(0, 26)}`);

        return next;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(16px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-5 sm:p-8 bg-[#020611] text-white overflow-hidden select-none"
    >
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.15)_0%,_rgba(3,7,18,0.96)_70%,_#020611_100%)] pointer-events-none" />

      {/* Cinematic Ambient Light Spheres */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.6, 0.35],
          x: [-40, 40, -40],
          y: [-30, 30, -30]
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 0.95, 1.2],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[130px] pointer-events-none"
      />

      {/* High-Tech Grid Matrix Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Top Protocol Tag */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between pt-2">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/90 backdrop-blur-xl shadow-xl mx-auto"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          <span className="text-[11px] font-mono font-black tracking-widest text-cyan-300 uppercase">
            DOLLAR CRAFT INSTITUTIONAL PROTOCOL v4.2
          </span>
        </motion.div>
      </div>

      {/* Central Content Hero */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-2xl w-full px-4">
        
        {/* 3D Glowing Circular Logo Container */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6 group"
        >
          {/* Multi-layered Neon Rings & Aura Glows (Plan-inspired gradient colors) */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-8 rounded-full bg-gradient-to-r from-cyan-500/40 via-amber-500/30 to-fuchsia-600/40 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 rounded-full border-2 border-dashed border-cyan-400/40 pointer-events-none"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-2 rounded-full border border-fuchsia-400/30 pointer-events-none"
          />

          {/* Circle Shape Logo Box */}
          <div className="relative p-6 sm:p-8 rounded-full bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 border-2 border-cyan-400/60 shadow-[0_0_100px_rgba(6,182,212,0.45)] backdrop-blur-2xl ring-2 ring-cyan-400/30 flex items-center justify-center">
            <Logo size={140} className="w-28 h-28 sm:w-36 sm:h-36 drop-shadow-[0_15px_35px_rgba(6,182,212,0.7)]" />
          </div>
        </motion.div>

        {/* Brand Name & Glowing Welcome Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="space-y-3"
        >
          {/* Welcome Tag */}
          <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-cyan-950/90 via-slate-900 to-fuchsia-950/90 text-cyan-300 border border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-cyan-400/40">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-200 to-fuchsia-300">
              WELCOME TO
            </span>
          </div>

          {/* Dollar Craft Glowing Main Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight uppercase select-none my-2 drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-200 to-fuchsia-300">
              DOLLAR CRAFT
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide max-w-lg mx-auto leading-relaxed">
            Institutional 26-Decimal Precision Micro-Yield Protocol & Asset Growth Ecosystem
          </p>
        </motion.div>

        {/* Launching Status Message */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8 flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-xl"
        >
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin-slow shrink-0" />
          <span className="text-xs font-mono font-extrabold tracking-widest text-cyan-200 uppercase">
            {isReady ? 'REDIRECTING TO DASHBOARD...' : 'AUTOMATICALLY LAUNCHING ECOSYSTEM...'}
          </span>
        </motion.div>

      </div>

      {/* Footer Security Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-900 pt-3.5 text-[11px] font-mono text-slate-500"
      >
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AES-256 AUDITED MULTI-SIGNATURE CUSTODIAL VAULTS</span>
        </div>
        <div className="flex items-center gap-3">
          <span>7 REGULATED HUBS</span>
          <span>•</span>
          <span className="text-cyan-400 font-bold">26-DECIMAL FLOATING RATE ENGINE</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
