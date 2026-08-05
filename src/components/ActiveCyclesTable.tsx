import React from 'react';
import { UserDeposit } from '../types';
import { formatPrecision, formatCurrency } from '../lib/yieldEngine';
import { CinematicButton } from './ui/CinematicButton';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  ShieldCheck, 
  Zap,
  BarChart3
} from 'lucide-react';

interface ActiveCyclesTableProps {
  deposits: UserDeposit[];
  onOpenDepositModal: () => void;
}

export const ActiveCyclesTable: React.FC<ActiveCyclesTableProps> = ({
  deposits,
  onOpenDepositModal
}) => {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-white shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span>Active Micro-Yield Cycles</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Real-time yield compounding across your locked investment deposits
          </p>
        </div>

        <CinematicButton
          onClick={onOpenDepositModal}
          variant="primary"
          size="sm"
          icon={<Play className="w-3.5 h-3.5 fill-current" />}
        >
          Start New Cycle
        </CinematicButton>
      </div>

      {deposits.length === 0 ? (
        <div className="text-center py-12 px-4 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-800">
          <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto mb-3 stroke-[1.5]" />
          <h4 className="text-sm font-bold text-zinc-300">No Active Yield Cycles</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            You currently have no active investment contracts running. Select a plan to start receiving sub-second micro-yield payouts.
          </p>
          <CinematicButton
            onClick={onOpenDepositModal}
            variant="utility"
            size="sm"
          >
            Explore Yield Plans
          </CinematicButton>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-800/80 pb-2">
                <th className="py-3 px-3 font-semibold uppercase tracking-wider">Plan & Network</th>
                <th className="py-3 px-3 font-semibold uppercase tracking-wider">Principal Deposit</th>
                <th className="py-3 px-3 font-semibold uppercase tracking-wider">Daily Rate</th>
                <th className="py-3 px-3 font-semibold uppercase tracking-wider">Accrued Micro-Yield</th>
                <th className="py-3 px-3 font-semibold uppercase tracking-wider">Cycle Progress</th>
                <th className="py-3 px-3 font-semibold uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {deposits.map((dep) => {
                const progress = Math.min(100, Math.max(0, dep.progressPercent || 0));

                return (
                  <tr key={dep.id} className="hover:bg-zinc-950/40 transition-colors group">
                    
                    {/* Plan & Network */}
                    <td className="py-4 px-3">
                      <div className="font-sans font-bold text-sm text-zinc-100 group-hover:text-emerald-400 transition-colors">
                        {dep.planName}
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          {dep.cryptoNetwork.replace('_', ' ')}
                        </span>
                        {dep.txHash && (
                          <span className="text-zinc-600 truncate max-w-[100px]">
                            Tx: {dep.txHash.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Principal */}
                    <td className="py-4 px-3 font-semibold text-zinc-200">
                      {formatCurrency(dep.principalAmount)}
                    </td>

                    {/* Daily Rate */}
                    <td className="py-4 px-3 text-emerald-400 font-bold">
                      +{dep.dailyYieldPercent}% / day
                    </td>

                    {/* Accrued Yield */}
                    <td className="py-4 px-3">
                      <div className="text-emerald-400 font-bold text-sm">
                        +${formatPrecision(dep.earnedYield, 8)}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Updated 1s interval
                      </div>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-4 px-3 min-w-[160px]">
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Progress</span>
                        <span className="font-bold text-emerald-400">{progress.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-1 flex justify-between">
                        <span>Started: {new Date(dep.startTime).toLocaleDateString()}</span>
                        <span>Ends: {new Date(dep.endTime).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-3 text-right font-sans">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        dep.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : dep.status === 'COMPLETED'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {dep.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {dep.status}
                      </span>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
