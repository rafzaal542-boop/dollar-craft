import React, { useState } from 'react';
import { BigNumber, formatCurrency, formatPrecision } from '../lib/yieldEngine';
import { CinematicButton } from './ui/CinematicButton';
import { 
  X, 
  ShieldCheck, 
  ArrowUpRight, 
  AlertTriangle, 
  Lock, 
  CheckCircle2, 
  Info,
  Key
} from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: string;
  earnedYield: string;
  onSubmitWithdrawal: (amount: number, destinationAddr: string, network: string) => Promise<{ success: boolean; message: string }>;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  earnedYield,
  onSubmitWithdrawal
}) => {
  const [amount, setAmount] = useState<string>('');
  const [destinationAddr, setDestinationAddr] = useState<string>('');
  const [network, setNetwork] = useState<string>('USDT_TRC20');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const maxBalanceBN = new BigNumber(availableBalance || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive withdrawal amount.');
      return;
    }

    if (numAmount < 50) {
      setErrorMsg('Minimum withdrawal amount is $50.00 USD.');
      return;
    }

    if (new BigNumber(numAmount).isGreaterThan(maxBalanceBN)) {
      setErrorMsg(`Insufficient funds. Your available withdrawable balance is ${formatCurrency(maxBalanceBN)}.`);
      return;
    }

    if (!destinationAddr.trim() || destinationAddr.length < 10) {
      setErrorMsg('Please enter a valid destination wallet address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmitWithdrawal(numAmount, destinationAddr.trim(), network);
      if (result.success) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          onClose();
          setAmount('');
          setDestinationAddr('');
          setSuccessMsg('');
        }, 2200);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Withdrawal request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-sm p-2 sm:p-4 w-full max-w-full">
      <div className="flex min-h-full items-center justify-center text-center p-0 sm:p-2">
        <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-white text-left my-auto max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/50">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Withdrawal Request</span>
            </h3>
            <p className="text-xs text-zinc-400">High-Security Atomic Ledger Payout Gateway</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successMsg ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Withdrawal Queued</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto font-mono">{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Available Balance Box */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Available Withdrawable Balance</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    ${formatPrecision(maxBalanceBN, 6)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAmount(maxBalanceBN.toFixed(2))}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-semibold transition-colors"
                >
                  MAX
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-zinc-300 uppercase">
                    Withdrawal Amount (USD)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    MIN $50.00 USD
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-8 pr-4 font-mono text-white text-base focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Network */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Payout Crypto Network
                </label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="USDT_TRC20">USDT (TRC20 TRON)</option>
                  <option value="USDT_BEP20">USDT (BEP20 BSC)</option>
                  <option value="USDT_ERC20">USDT (ERC20 Ethereum)</option>
                  <option value="USDC_SOL">USDC (Solana)</option>
                </select>
              </div>

              {/* Destination Wallet */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Destination Wallet Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your crypto wallet address..."
                  value={destinationAddr}
                  onChange={(e) => setDestinationAddr(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Error Box */}
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2 font-mono">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Anti-Exploit Security Note */}
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1 font-mono">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Atomic Lock Protection Active</span>
                </div>
                <p className="text-zinc-500">
                  Withdrawal requests undergo real-time mathematical yield sanity checks. Approved requests execute automatically via queue.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <CinematicButton
                  type="button"
                  onClick={onClose}
                  variant="utility"
                  size="md"
                  className="w-1/3"
                >
                  Cancel
                </CinematicButton>
                <CinematicButton
                  type="submit"
                  isLoading={isSubmitting}
                  variant="secondary"
                  size="md"
                  className="w-2/3"
                >
                  Submit Withdrawal Request
                </CinematicButton>
              </div>

            </form>
          )}
        </div>

      </div>
      </div>
    </div>
  );
};
