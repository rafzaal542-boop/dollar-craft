import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, UserDeposit } from '../types';
import { 
  User as UserIcon, 
  UserCheck, 
  Mail, 
  ShieldCheck, 
  BadgeCheck, 
  Copy, 
  Check, 
  Key, 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Award, 
  Lock, 
  CheckCircle2, 
  LogIn, 
  Clock, 
  Send, 
  Sparkles, 
  Calendar, 
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  Gift
} from 'lucide-react';

interface CustomerDashboardViewProps {
  currentUser?: User | null;
  deposits?: UserDeposit[];
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenMasterPlan?: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  onOpenInternalTransfer?: () => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  currentUser,
  deposits = [],
  onOpenDeposit,
  onOpenWithdraw,
  onOpenMasterPlan,
  onOpenAuth,
  onOpenInternalTransfer
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'deposits' | 'transfers'>('profile');
  const [internalTransfers, setInternalTransfers] = useState<any[]>([]);

  useEffect(() => {
    const userEmail = (currentUser?.email || '').trim().toLowerCase();
    const userId = currentUser?.id || '';
    if (!userEmail && !userId) return;

    const fetchInternalTransfers = async () => {
      try {
        const q = new URLSearchParams();
        if (userEmail) q.set('email', userEmail);
        if (userId) q.set('userId', userId);
        const res = await fetch(`/api/user/internal-transfers?${q.toString()}`, {
          headers: {
            'x-user-email': userEmail,
            'x-user-id': userId
          }
        });
        if (res.ok) {
          const data = await res.json();
          setInternalTransfers(data.transfers || []);
        }
      } catch (err) {
        console.warn('Failed to fetch user internal transfers:', err);
      }
    };

    fetchInternalTransfers();
    const interval = setInterval(fetchInternalTransfers, 3000);
    return () => clearInterval(interval);
  }, [currentUser?.email, currentUser?.id]);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getCalculatedTotalDeposit = () => {
    if (!currentUser) return '0.0000';
    const depositSum = deposits.reduce(
      (sum, d) => sum + (parseFloat(d.principalAmount || (d as any).amount) || 0),
      0
    );
    const transferSum = internalTransfers
      .filter(
        (t: any) =>
          t.toWalletType === 'MAIN_WALLET' ||
          t.toWalletType === 'INVESTMENT_WALLET' ||
          !t.toWalletType
      )
      .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
    const userPrincipal = parseFloat(currentUser.principalBalance || '0') || 0;
    return Math.max(userPrincipal, depositSum, transferSum).toFixed(4);
  };

  const calculateTotalBalance = () => {
    if (!currentUser) return '0.0000';
    const principal = parseFloat(getCalculatedTotalDeposit());
    const yieldAmt = parseFloat(currentUser.earnedYield || '0') || 0;
    return (principal + yieldAmt).toFixed(4);
  };

  const allCombinedDeposits = [...deposits];
  internalTransfers.forEach((itx) => {
    if (
      itx.toWalletType === 'MAIN_WALLET' ||
      itx.toWalletType === 'INVESTMENT_WALLET' ||
      !itx.toWalletType
    ) {
      const exists = allCombinedDeposits.some(
        (d) => d.txHash === itx.transferId || d.id.includes(itx.transferId)
      );
      if (!exists) {
        allCombinedDeposits.unshift({
          id: `dep-${itx.transferId}`,
          userId: currentUser?.id || '',
          userEmail: currentUser?.email || '',
          planId: 'plan-standard',
          planName: 'Standard Yield Plan (Internal Transfer)',
          principalAmount: String(itx.amount || '0'),
          earnedYield: '0.000000000000000000',
          totalPayout: '0',
          dailyYieldPercent: 0.83,
          cryptoNetwork: 'Internal Transfer (Main Wallet)',
          txHash: itx.transferId,
          status: 'ACTIVE',
          startTime: itx.createdAt || new Date().toISOString(),
          endTime: new Date(Date.now() + 240 * 86400 * 1000).toISOString(),
          lastYieldTick: new Date().toISOString(),
          progressPercent: 0
        });
      }
    }
  });

  return (
    <div className="w-full bg-[#040812] text-slate-100 p-3 sm:p-6 lg:p-8 font-sans min-h-screen space-y-6 sm:space-y-8">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#0A1124] via-[#0E1A38] to-[#080E20] p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-blue-600/20 border border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-950/50">
            <UserCheck className="w-8 h-8 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-mono">
                Customer Dashboard
              </h1>
              {currentUser ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  AUTHENTICATED
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  GUEST SESSION
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
              Personal customer portal, credentials, portfolio balances & contract yields
            </p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3 flex-wrap relative z-10">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-base shadow-md shrink-0">
                {(currentUser.firstName ? currentUser.firstName[0] : (currentUser.email ? currentUser.email[0] : 'C')).toUpperCase()}
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Active Account</span>
                <span className="text-xs font-bold text-white font-mono block truncate max-w-[160px]">
                  {currentUser.email}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. AUTHENTICATED VS LOGGED OUT STATE */}
      {!currentUser ? (
        /* LOGGED OUT GATEWAY CARD */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#0A1226] to-[#050A18] border border-cyan-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-xl">
            <UserIcon className="w-10 h-10" />
          </div>

          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-mono">
              Access Your Customer Dashboard
            </h2>
            <p className="text-sm text-slate-300 font-mono leading-relaxed">
              Please log in to your Dollar Craft account to view your signed-in profile details, registered email address, high-precision yield accruals, principal balances, and transaction history.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onOpenAuth && onOpenAuth('login')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-sm uppercase font-mono tracking-wider flex items-center gap-2.5 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer active:scale-95"
            >
              <LogIn className="w-5 h-5" />
              <span>LOG IN TO CUSTOMER ACCOUNT</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* LOGGED IN FULL CUSTOMER DASHBOARD PAGE */
        <div className="space-y-8">
          
          {/* TOP CARDS: FINANCIAL OVERVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Net Portfolio */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B152C] to-[#060D1E] border border-cyan-500/30 space-y-3 shadow-xl hover:border-cyan-400/60 transition-all">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
                <span className="uppercase font-bold flex items-center gap-1.5 text-cyan-300">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  TOTAL BALANCE
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                ${calculateTotalBalance()}
              </div>
            </div>

            {/* Card 2: Active Principal Deposit */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B152C] to-[#060D1E] border border-emerald-500/40 space-y-3 shadow-xl hover:border-emerald-400/60 transition-all">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
                <span className="uppercase font-bold flex items-center gap-1.5 text-emerald-400">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  TOTAL DEPOSIT
                </span>
                {internalTransfers.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                    <Send className="w-3 h-3 text-purple-400" />
                    {internalTransfers.length} TRANSFER{internalTransfers.length > 1 ? 'S' : ''}
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                ${getCalculatedTotalDeposit()}
              </div>
              {internalTransfers.length > 0 && (
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1 text-purple-300">
                    <Send className="w-3 h-3" />
                    Internal Transfer Credit:
                  </span>
                  <span className="text-emerald-300 font-bold">
                    +${internalTransfers.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Card 3: Earned Yield */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B152C] to-[#060D1E] border border-slate-800 space-y-3 shadow-xl hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
                <span className="uppercase font-bold flex items-center gap-1.5 text-amber-300">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  DAILY PROFIT
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
                ${(parseFloat(currentUser.earnedYield || '0') || 0).toFixed(4)}
              </div>
            </div>

            {/* Card 4: Referral Bonus (5% Auto Commission) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B152C] to-[#060D1E] border border-amber-500/40 space-y-3 shadow-xl hover:border-amber-400/60 transition-all">
              <div className="flex items-center justify-between text-slate-400 font-mono text-xs">
                <span className="uppercase font-bold flex items-center gap-1.5 text-amber-300">
                  <Gift className="w-4 h-4 text-amber-400" />
                  REFERRAL BONUS
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30">
                  5% AUTO
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
                ${(parseFloat(currentUser?.ibTotalCommission || currentUser?.ibWithdrawableCommission || '0') || 0).toFixed(2)}
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1">
                <span>Direct Deposit Bonus:</span>
                <span className="text-amber-400 font-bold">5% Per Referred Deposit</span>
              </div>
            </div>

          </div>

          {/* QUICK ACTIONS HUB */}
          <div className="p-6 rounded-3xl bg-[#070D1D] border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Customer Quick Action Hub
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={onOpenDeposit}
                className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-md shadow-emerald-950/30"
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>DEPOSIT FUNDS</span>
              </button>

              <button
                onClick={onOpenWithdraw}
                className="p-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-md shadow-cyan-950/30"
              >
                <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                <span>WITHDRAW EARNINGS</span>
              </button>

              {onOpenInternalTransfer && (
                <button
                  onClick={onOpenInternalTransfer}
                  className="p-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-md shadow-purple-950/30"
                >
                  <Send className="w-4 h-4 text-purple-400" />
                  <span>INTERNAL TRANSFER</span>
                </button>
              )}

              <button
                onClick={onOpenMasterPlan}
                className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-md shadow-amber-950/30"
              >
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>INVESTMENT PLANS</span>
              </button>
            </div>
          </div>

          {/* MAIN PROFILE DETAILS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col (2 cols): Detailed Account Information */}
            <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#070D1D] border border-slate-800 space-y-6 shadow-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white uppercase font-mono">
                      Account Credentials & Identity
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Verified customer sign-in details & profile attributes
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VERIFIED
                </span>
              </div>

              {/* Data Table / Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                
                {/* Full Name */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase block">Customer Name</span>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-cyan-400" />
                    <span>
                      {currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}` : 'Customer'}
                    </span>
                  </div>
                </div>

                {/* Signed-in Email */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase block">Signed-In Email</span>
                  <div className="text-sm font-bold text-emerald-300 flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </div>
                </div>

                {/* Account ID */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] uppercase block">Account ID</span>
                    <button
                      onClick={() => handleCopy(currentUser.id, 'accId')}
                      className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'accId' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'accId' ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-cyan-300 break-all select-all pt-0.5">
                    {currentUser.id}
                  </div>
                </div>

                {/* Referral Code */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] uppercase block">Referral Code</span>
                    <button
                      onClick={() => handleCopy(currentUser.referralCode || 'DC-CLIENT', 'ref')}
                      className="text-[10px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'ref' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'ref' ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                  <div className="text-sm font-bold text-amber-300 pt-0.5">
                    {currentUser.referralCode || 'DC-CLIENT'}
                  </div>
                </div>

                {/* Member Since */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase block">Registration Date</span>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>
                      {new Date(currentUser.createdAt || Date.now()).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Security Status */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] uppercase block">Security Clearance</span>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>2FA & Google Auth Enabled</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Col (1 col): Security & Referral Overview */}
            <div className="space-y-6">
              
              {/* Card 1: Referral Link Share */}
              <div className="p-6 rounded-3xl bg-[#070D1D] border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 text-amber-300 font-mono text-xs font-bold uppercase">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Customer Referral Program</span>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  Share your unique referral link to earn tiered commissions on client deposits.
                </p>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Your Referral Link</span>
                  <div className="flex items-center justify-between gap-2 font-mono text-xs text-cyan-300 overflow-hidden">
                    <span className="truncate">
                      {window.location.origin}/?ref={currentUser.referralCode || 'DC-CLIENT'}
                    </span>
                    <button
                      onClick={() => handleCopy(`${window.location.origin}/?ref=${currentUser.referralCode || 'DC-CLIENT'}`, 'link')}
                      className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-colors shrink-0 cursor-pointer"
                      title="Copy link"
                    >
                      {copiedField === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Institutional Protection */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Institutional Fund Protection</span>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  All customer principal deposits are held in segregated cold wallets backed by multi-signature cryptographic proof.
                </p>
              </div>

            </div>

          </div>

          {/* ACTIVE DEPOSITS & CONTRACTS TABLE */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#070D1D] border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white uppercase font-mono">
                    Active Investment Deposits ({allCombinedDeposits.length})
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Contracts generating real-time interest stream
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenDeposit}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-md shadow-emerald-500/20"
              >
                + New Deposit
              </button>
            </div>

            {allCombinedDeposits.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-mono text-xs space-y-3">
                <p>No active investment deposits found for this customer account.</p>
                <button
                  onClick={onOpenDeposit}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md cursor-pointer hover:brightness-110"
                >
                  Create First Deposit Cycle
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="pb-3 font-semibold">Deposit ID</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Plan</th>
                      <th className="pb-3 font-semibold">Daily Rate</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {allCombinedDeposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 text-cyan-300 font-semibold">{dep.id.slice(0, 8)}...</td>
                        <td className="py-3 text-emerald-400 font-bold">${(parseFloat(dep.principalAmount || (dep as any).amount || '0') || 0).toFixed(2)}</td>
                        <td className="py-3 text-white uppercase font-bold">{dep.planName || 'Standard'}</td>
                        <td className="py-3 text-amber-300 font-bold">{dep.dailyYieldPercent || 1.5}%</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            dep.status === 'APPROVED' || dep.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            dep.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {dep.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">
                          {new Date(dep.startTime || Date.now()).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* INTERNAL TRANSFERS RECEIVED FROM ADMIN */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#070D1D] border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white uppercase font-mono flex items-center gap-2">
                    Internal Transfers Received ({internalTransfers.length})
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Admin dollar allocations credited directly to your email account balance
                  </p>
                </div>
              </div>

              {internalTransfers.length > 0 && (
                <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold">
                  Total Received: ${internalTransfers.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0).toFixed(4)}
                </span>
              )}
            </div>

            {internalTransfers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-mono text-xs space-y-2">
                <p>No internal transfers received for {currentUser.email} yet.</p>
                <p className="text-[11px] text-slate-500">
                  Dollars transferred by Admin via Internal Transfer to your email will instantly reflect in your Total Deposit balance and be listed here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="pb-3 font-semibold">Transfer ID</th>
                      <th className="pb-3 font-semibold">Sender</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Wallet Type</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Note / Purpose</th>
                      <th className="pb-3 font-semibold">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {internalTransfers.map((tx) => (
                      <tr key={tx.id || tx.transferId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 text-cyan-300 font-bold">{tx.transferId || tx.id}</td>
                        <td className="py-3 text-slate-300">{tx.fromUserEmail || 'Admin System'}</td>
                        <td className="py-3 text-emerald-400 font-bold text-sm">
                          +${parseFloat(tx.amount || 0).toFixed(4)}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                            {tx.toWalletType?.replace('_', ' ') || 'MAIN WALLET'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                            {tx.status || 'SUCCESS'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 max-w-[180px] truncate">
                          {tx.note || 'Admin Internal Credit'}
                        </td>
                        <td className="py-3 text-slate-400">
                          {new Date(tx.createdAt || Date.now()).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
