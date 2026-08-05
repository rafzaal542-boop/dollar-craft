import React, { useState } from 'react';
import { User, ReferralReward } from '../types';
import { formatCurrency, formatPrecision } from '../lib/yieldEngine';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Award, 
  TrendingUp, 
  Gift,
  Layers
} from 'lucide-react';

interface ReferralSystemProps {
  user?: User | null;
  rewards: ReferralReward[];
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({ user, rewards }) => {
  const [copied, setCopied] = useState(false);

  const referralLink = user ? `${window.location.origin}?ref=${user.referralCode}` : window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const level1Earnings = rewards.filter(r => r.level === 1).reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const level2Earnings = rewards.filter(r => r.level === 2).reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const level3Earnings = rewards.filter(r => r.level === 3).reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const totalReferralEarnings = level1Earnings + level2Earnings + level3Earnings;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-950 p-6 border border-zinc-800 text-white relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Gift className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              3-Tier Multi-Level Referral Program
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Earn Passive Yield from Network Deposits
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Invite fellow yield crafters to Dollar Craft. Earn 5.0% on Level 1 direct referrals, 2.5% on Level 2, and 1.0% on Level 3 automatically credited to your principal balance.
          </p>
        </div>

        {/* Link Share Box */}
        <div className="mt-6 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full text-left font-mono text-xs text-emerald-300 truncate px-2 py-1 bg-zinc-900 rounded border border-zinc-800">
            {referralLink}
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Link!' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </div>

      {/* 3-Tier Earnings Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 text-white relative">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold block">LEVEL 1 DIRECT</span>
              <h3 className="text-lg font-bold text-zinc-100">5.0% Yield Bonus</h3>
            </div>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mb-4">Direct referrals invited using your unique craft referral link.</p>
          <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline font-mono">
            <span className="text-xs text-zinc-500">Total Bonus:</span>
            <span className="text-base font-bold text-emerald-400">${formatPrecision(level1Earnings, 4)}</span>
          </div>
        </div>

        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 text-white relative">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-mono text-blue-400 font-bold block">LEVEL 2 NETWORK</span>
              <h3 className="text-lg font-bold text-zinc-100">2.5% Yield Bonus</h3>
            </div>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mb-4">Secondary network tier referred by your direct partners.</p>
          <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline font-mono">
            <span className="text-xs text-zinc-500">Total Bonus:</span>
            <span className="text-base font-bold text-blue-400">${formatPrecision(level2Earnings, 4)}</span>
          </div>
        </div>

        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 text-white relative">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-mono text-amber-400 font-bold block">LEVEL 3 EXTENDED</span>
              <h3 className="text-lg font-bold text-zinc-100">1.0% Yield Bonus</h3>
            </div>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mb-4">Tertiary network tier referred by level 2 network members.</p>
          <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline font-mono">
            <span className="text-xs text-zinc-500">Total Bonus:</span>
            <span className="text-base font-bold text-amber-400">${formatPrecision(level3Earnings, 4)}</span>
          </div>
        </div>

      </div>

      {/* Rewards Ledger Table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-white">
        <h3 className="text-sm font-bold text-zinc-200 mb-4 font-mono uppercase tracking-wider">
          Referral Reward Ledger
        </h3>

        {rewards.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs font-mono bg-zinc-950/40 rounded-xl border border-zinc-800">
            No referral rewards accrued yet. Share your invite link to begin earning network bonuses.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800 pb-2">
                  <th className="py-2.5 px-3">Referred User</th>
                  <th className="py-2.5 px-3">Network Level</th>
                  <th className="py-2.5 px-3">Bonus Amount</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {rewards.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-3 text-zinc-200">{r.referredUserEmail || r.referredUserId}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-bold">
                        Level {r.level}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">+${r.amount}</td>
                    <td className="py-3 px-3 text-right text-zinc-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
