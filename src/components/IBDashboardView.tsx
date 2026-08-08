import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, IBCommission, GeneratedIbLink } from '../types';
import { 
  Building2, 
  Copy, 
  Check, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  Award, 
  ShieldCheck, 
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  Zap,
  Layers,
  CheckCircle2,
  Lock,
  Target,
  CreditCard,
  Server,
  Globe,
  Link,
  Plus,
  Radio,
  Activity,
  Terminal,
  Trash2
} from 'lucide-react';

interface IBDashboardViewProps {
  currentUser?: User | null;
  onOpenApplyModal: () => void;
  onOpenIBPartner?: () => void;
  onRefreshUser?: () => void;
}

interface IBDashboardData {
  is_ib: boolean;
  ibStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  referralLink: string;
  ibReferralCode: string;
  maxCapAmount?: string;
  remainingCap?: string;
  capProgressPercent?: number;
  totalReferredUsers: number;
  totalClientInvestments: string;
  totalCommissionEarned: string;
  withdrawableCommission: string;
  commissions: IBCommission[];
  generatedLinks?: GeneratedIbLink[];
  referredClients: Array<{
    id: string;
    email: string;
    createdAt: string;
    totalInvested: string;
  }>;
}

export const IBDashboardView: React.FC<IBDashboardViewProps> = ({
  currentUser,
  onOpenApplyModal,
  onOpenIBPartner,
  onRefreshUser
}) => {
  const [data, setData] = useState<IBDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLinkMap, setCopiedLinkMap] = useState<Record<string, boolean>>({});
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // On-demand generator state
  const [campaignName, setCampaignName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [selectedNode, setSelectedNode] = useState('US-EAST-CLOUD-01');
  const [generating, setGenerating] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  const serverNodes = [
    { id: 'US-EAST-CLOUD-01', name: 'US East Cloud Node #01', ping: '12ms' },
    { id: 'EU-CENTRAL-NODE-04', name: 'EU Central Big Data Node #04', ping: '24ms' },
    { id: 'ASIA-PACIFIC-NODE-09', name: 'Asia Pacific High Speed Node #09', ping: '18ms' },
    { id: 'QUANTUM-NODE-77', name: 'Quantum Ultra Low-Latency Node #77', ping: '8ms' }
  ];

  const fetchIBData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch('/api/ib/dashboard');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.warn('IB dashboard sync notice:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchIBData(true);
    const interval = setInterval(() => {
      fetchIBData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleCopyLink = (url?: string, key?: string) => {
    const targetUrl = url || data?.referralLink;
    if (!targetUrl) return;
    navigator.clipboard.writeText(targetUrl);

    if (key) {
      setCopiedLinkMap((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedLinkMap((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateOnDemandLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const normalizedCode = accessCode.trim().toUpperCase();
    if (!normalizedCode) {
      setMessage({
        type: 'error',
        text: 'COUPON CODE REQUIRED: Link generation denied! Enter your authorized IB Coupon Code.'
      });
      return;
    }

    const codeNum = parseInt(normalizedCode.replace('IB7000-CMP-', ''), 10);
    const isValidCode = /^IB7000-CMP-\d{3}$/.test(normalizedCode) && codeNum >= 1 && codeNum <= 100;

    if (!isValidCode) {
      setMessage({
        type: 'error',
        text: 'Authorized format required'
      });
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch('/api/ib/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: campaignName || 'On-Demand IB Client',
          accessCode: normalizedCode,
          serverNode: selectedNode
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: result.message });
        setCampaignName('');
        setAccessCode('');
        await fetchIBData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Link generation failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    setDeletingLinkId(linkId);
    setMessage(null);
    try {
      const res = await fetch(`/api/ib/links/${linkId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: result.message || 'IB link deleted.' });
        await fetchIBData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete link' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setDeletingLinkId(null);
    }
  };

  const handleWithdrawCommission = async () => {
    setWithdrawing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/ib/withdraw-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: result.message });
        await fetchIBData();
        if (onRefreshUser) onRefreshUser();
      } else {
        setMessage({ type: 'error', text: result.error || 'Withdrawal failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-10">
      
      {/* INSTITUTIONAL HERO BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0B132B] via-[#091024] to-[#040814] p-6 sm:p-8 md:p-10 border border-cyan-500/30 text-white shadow-2xl shadow-cyan-950/40 overflow-hidden">
        
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-tr from-amber-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        <div className="relative z-10 space-y-6">
          
          {/* Header Badges */}
          {currentUser?.ibStatus === 'APPROVED' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-black uppercase flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ACTIVE IB PARTNER
              </span>
            </div>
          )}

          {/* Title & Description & CTAs */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase leading-tight">
                BECOME AN IB PROGRAM <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400">
                  PAY $7000 AND EARN 10% PER REFERRAL
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
                Activate your official IB Membership for <span className="text-white font-bold">$7,000 USDT</span>. Your full $7,000 deposit is 100% credited directly into your main trading balance while unlocking institutional partner status to earn an instant <span className="text-amber-300 font-black">10% direct commission</span> on every referral!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto shrink-0 pt-2 xl:pt-0">
              <button
                onClick={onOpenIBPartner || onOpenApplyModal}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Building2 className="w-4 h-4" />
                <span>Become an IB Partner</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* IB Status Alert Banner */}
      {currentUser?.ibStatus === 'PENDING' && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent border border-amber-500/40 text-amber-200 text-xs font-mono flex items-start gap-3.5 shadow-lg">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <span className="font-black text-amber-300 text-sm uppercase block">IB Membership Payment Pending Verification</span>
            <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
              Your $7,000 USDT deposit verification is in progress by our compliance team. Once confirmed: 1. Full $7,000 credited to your main balance, 2. IB Status activated, 3. 10% upline referral commission dispatched automatically.
            </p>
          </div>
        </div>
      )}

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Direct Sales */}
        <div className="bg-[#080E1A] p-6 rounded-2xl border border-slate-800/90 text-white relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-mono text-slate-400 font-extrabold uppercase tracking-wider">Total Direct Sales</span>
            <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            ${parseFloat(data?.totalClientInvestments || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> Direct referred clients investment volume
          </p>
        </div>

        {/* Card 2: Total Earned Commission */}
        <div className="bg-[#080E1A] p-6 rounded-2xl border border-slate-800/90 text-white relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-mono text-slate-400 font-extrabold uppercase tracking-wider">Total Earned Commission</span>
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-amber-400 tracking-tight">
            ${parseFloat(data?.totalCommissionEarned || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Cumulative IB referral rewards
          </p>
        </div>

        {/* Card 3: Commission Wallet Balance */}
        <div className="bg-gradient-to-b from-[#091926] via-[#08121D] to-[#050A12] p-6 rounded-2xl border border-cyan-500/40 text-white relative overflow-hidden shadow-2xl group hover:border-cyan-400/60 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-mono text-cyan-300 font-extrabold uppercase tracking-wider">Commission Wallet</span>
            <span className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            ${parseFloat(data?.withdrawableCommission || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          
          <button
            onClick={handleWithdrawCommission}
            disabled={withdrawing || parseFloat(data?.withdrawableCommission || '0') <= 0}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/15 disabled:opacity-40 disabled:hover:brightness-100 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            <span>{withdrawing ? 'Transferring...' : 'Withdraw Commission'}</span>
          </button>
        </div>

        {/* Card 4: Total $7000 Memberships Sold */}
        <div className="bg-[#080E1A] p-6 rounded-2xl border border-slate-800/90 text-white relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-mono text-slate-400 font-extrabold uppercase tracking-wider">$7000 Memberships Sold</span>
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight flex items-baseline gap-2">
            <span>{currentUser?.ibMembershipsSold || (data?.commissions?.filter(c => parseFloat(c.commissionAmount) >= 700).length || 0)}</span>
            <span className="text-xs text-slate-400 font-bold uppercase">Units</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Earn 10% ($700) per sale
          </p>
        </div>

      </div>

      {/* ON-DEMAND BIG DATA SERVER IB REFERRAL LINK GENERATOR */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#060B14] border border-cyan-500/30 relative overflow-hidden shadow-2xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg shadow-cyan-500/10">
              <Server className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                  IB REFERRAL GENERATOR
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Generate high-speed global IB referral links.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerateOnDemandLink} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono font-extrabold text-cyan-300 uppercase mb-1.5 flex items-center justify-between">
              <span>Mandatory IB Access Code</span>
              <span className="text-[10px] text-amber-400 font-bold">REQUIRED</span>
            </label>
            <input
              type="text"
              placeholder="ENTER SECRET ACCESS CODE"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              required
              className="w-full px-4 py-3 rounded-xl bg-[#03060D] border border-amber-500/50 text-xs text-amber-300 font-bold placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono transition-all"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 stroke-[3]" />
              )}
              <span>{generating ? 'Allocating Node...' : 'Generate New IB Link'}</span>
            </button>
          </div>
        </form>

        {/* List of Generated Links */}
        {data?.generatedLinks && data.generatedLinks.length > 0 && (
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Link className="w-4 h-4 text-cyan-400" /> Active Generated Client Links ({data.generatedLinks.length})
            </span>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {data.generatedLinks.map((item) => {
                const isCopied = !!copiedLinkMap[item.id];
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#03060D] border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-1 truncate flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white uppercase text-xs">
                          {item.campaignName}
                        </span>
                        {item.accessCode && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                            CODE: {item.accessCode}
                          </span>
                        )}
                        <span className="text-[10px] px-2.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
                          {item.serverNode}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-cyan-400 text-xs truncate select-all font-semibold">
                        {item.fullUrl}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => handleCopyLink(item.fullUrl, item.id)}
                        className="px-3.5 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteLink(item.id)}
                        disabled={deletingLinkId === item.id}
                        title="Delete IB Link"
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 transition-all cursor-pointer disabled:opacity-40"
                      >
                        {deletingLinkId === item.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Notification Banner */}
      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-mono flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span className="font-bold">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-white font-bold px-2 py-1">✕</button>
        </div>
      )}



    </div>
  );
};


