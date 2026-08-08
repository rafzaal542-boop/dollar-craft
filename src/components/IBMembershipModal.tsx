import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { 
  Building2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  Copy, 
  Check, 
  QrCode, 
  CreditCard, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Award
} from 'lucide-react';
import { MOCK_DEPOSIT_WALLETS } from '../data/mockData';
import { MashreqLogo } from './MashreqLogo';
import { PaypalLogo } from './PaypalLogo';

interface IBMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSubmitted?: () => void;
}

export const IBMembershipModal: React.FC<IBMembershipModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmitted
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'USDT_TRC20' | 'USDT_BEP20' | 'BINANCE_PAY' | 'BANK_TRANSFER' | 'PAYPAL'>('USDT_TRC20');
  const [proofTxHash, setProofTxHash] = useState('');
  const [userWallet, setUserWallet] = useState(currentUser?.walletAddress || '');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const getDepositDetails = () => {
    switch (paymentMethod) {
      case 'USDT_TRC20':
        return {
          title: 'USDT (Tron TRC-20)',
          address: MOCK_DEPOSIT_WALLETS.USDT_TRC20,
          network: 'TRON (TRC20)',
          fee: '~1.5 USDT',
          qr: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${MOCK_DEPOSIT_WALLETS.USDT_TRC20}`
        };
      case 'USDT_BEP20':
        return {
          title: 'USDT (BNB Smart Chain BEP-20)',
          address: MOCK_DEPOSIT_WALLETS.USDT_BEP20,
          network: 'BSC (BEP20)',
          fee: '~0.3 USDT',
          qr: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${MOCK_DEPOSIT_WALLETS.USDT_BEP20}`
        };
      case 'BINANCE_PAY':
        return {
          title: 'Binance Pay ID / Merchant QR',
          address: '293847104 (Dollar Craft Official)',
          network: 'Binance Pay App',
          fee: '$0 Zero Fee',
          qr: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=BINANCE_PAY_293847104`
        };
      case 'BANK_TRANSFER':
        return {
          title: 'Mashreq Bank Direct Transfer',
          bankName: 'Mashreq Bank',
          accountTitle: 'IRTAZA COMMUNICATION',
          accountNumber: 'PK36MSHQ0000089200164395',
          iban: 'PK36MSHQ0000089200164395',
          address: 'Mashreq Bank | Title: IRTAZA COMMUNICATION | IBAN: PK36MSHQ0000089200164395',
          network: 'Mashreq Bank',
          fee: 'Zero Fee',
          qr: null
        };
      case 'PAYPAL':
        return {
          title: 'PayPal Live Gateway',
          bankName: 'PayPal',
          accountTitle: 'Dollar Craft Official',
          accountNumber: 'PayPal Gateway',
          iban: 'PayPal Gateway',
          address: 'PayPal Gateway',
          network: 'PayPal',
          fee: 'Zero Fee',
          qr: null
        };
    }
  };

  const details = getDepositDetails();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod === 'PAYPAL') {
      setError('System Busy: PayPal payment gateway is currently busy. Please select Bank Transfer or Crypto.');
      return;
    }

    if (!proofTxHash.trim()) {
      setError('Please enter your Transaction Hash (TxID) or Payment Reference Number.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/ib/membership/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          proofTxHash: proofTxHash.trim(),
          walletAddress: userWallet.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message || 'IB Membership Payment of $7,000 submitted successfully for Admin approval!');
        if (onSubmitted) onSubmitted();
      } else {
        setError(data.error || 'Failed to submit IB membership payment.');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md p-2 sm:p-4 w-full max-w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0B0F17] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-500/20 p-5 sm:p-7 text-white overflow-hidden my-6"
        >
          {/* Subtle Glow Background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex justify-between items-start mb-5 border-b border-slate-800/80 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-cyan-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight font-mono">
                    Activate IB Membership - $7,000
                  </h3>
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-extrabold bg-amber-400 text-slate-950 rounded-full animate-pulse shadow-sm">
                    10% DIRECT REWARD
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Deposit $7,000 USDT to unlock full IB Membership & get $7,000 added to your main balance!
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Value Proposition Grid (3 Key Benefits) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5 relative z-10">
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> 1. Main Balance Credit
              </span>
              <p className="text-xs font-bold text-white">$7,000 Full Deposit</p>
              <p className="text-[10px] text-slate-400 leading-tight">100% added to your investable main wallet balance.</p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> 2. Instant IB Status
              </span>
              <p className="text-xs font-bold text-white">Active IB Partner</p>
              <p className="text-[10px] text-slate-400 leading-tight">Get custom referral link & 10-level matrix access.</p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> 3. Direct Commission
              </span>
              <p className="text-xs font-bold text-white">10% Direct Commission</p>
              <p className="text-[10px] text-slate-400 leading-tight">Earn 10% instant reward on every direct IB client.</p>
            </div>
          </div>

          {success ? (
            <div className="space-y-4 py-4 text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-mono">Payment Submitted for Approval!</h4>
                <p className="text-xs text-slate-300 font-mono mt-2 max-w-md mx-auto leading-relaxed">
                  {success}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-left space-y-2 max-w-md mx-auto">
                <div className="flex justify-between text-slate-400">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-400 font-bold">$7,000.00 USDT</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pending Admin Actions:</span>
                  <span className="text-amber-400 font-bold">2 Requests Generated</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 pl-4 list-disc">
                  <li>Request A: Add $7,000 to your Normal Investable Wallet</li>
                  <li>Request B: Activate IB Membership & Trigger 10% Upline Commission</li>
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
              >
                Close & Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1.5">
                  1. Select Payment Channel ($7,000 USDT)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('USDT_TRC20')}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                      paymentMethod === 'USDT_TRC20'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    USDT TRC-20
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('USDT_BEP20')}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                      paymentMethod === 'USDT_BEP20'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    USDT BEP-20
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BINANCE_PAY')}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                      paymentMethod === 'BINANCE_PAY'
                        ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Binance Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('BANK_TRANSFER');
                      setError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden group ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-gradient-to-br from-[#0B1E38] to-[#040C1A] border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50 scale-[1.02]'
                        : 'bg-slate-900/90 border-cyan-500/30 text-slate-300 hover:border-cyan-400/60 hover:text-white'
                    }`}
                  >
                    <MashreqLogo className="w-5 h-5 shrink-0" />
                    <span>Bank IBAN</span>
                    <span className="relative flex h-1.5 w-1.5 ml-0.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('PAYPAL');
                      setError('System Busy: PayPal payment gateway is currently busy. Please select Bank Transfer or Crypto.');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 relative overflow-hidden group ${
                      paymentMethod === 'PAYPAL'
                        ? 'bg-gradient-to-br from-[#0B1A3A] to-[#040A1A] border-blue-400 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-blue-400/50 scale-[1.02]'
                        : 'bg-slate-900/90 border-blue-500/30 text-slate-300 hover:border-blue-400/60 hover:text-white'
                    }`}
                  >
                    <PaypalLogo className="w-5 h-5 shrink-0" />
                    <span>PayPal</span>
                    <span className="relative flex h-1.5 w-1.5 ml-0.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Step 2: Deposit Address & QR Box */}
              {paymentMethod === 'PAYPAL' ? (
                <div className="p-4 rounded-2xl bg-[#070A16] border border-blue-500/50 space-y-3 font-mono">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                      <PaypalLogo className="w-5 h-5 shrink-0" />
                      PayPal Live Gateway
                    </span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold animate-pulse">
                      System Busy
                    </span>
                  </div>

                  <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>System Busy: PayPal channel is currently busy. Please select Bank Transfer or USDT.</span>
                  </div>
                </div>
              ) : paymentMethod === 'BANK_TRANSFER' ? (
                <div className="p-4 rounded-2xl bg-[#070A12] border border-blue-500/40 space-y-3 font-mono">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wide flex items-center gap-2">
                      <MashreqLogo className="w-6 h-6 shrink-0" />
                      <span>Mashreq Bank Transfer Details</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("Bank Name: Mashreq Bank\nAccount Title: IRTAZA COMMUNICATION\nIBAN: PK36MSHQ0000089200164395")}
                      className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-500/40 text-blue-300 text-[10px] font-bold hover:bg-blue-900 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAddress ? 'Copied Details' : 'Copy Bank Details'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Bank Name</span>
                      <span className="text-white font-bold">Mashreq Bank</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Account Title</span>
                      <span className="text-amber-400 font-bold">IRTAZA COMMUNICATION</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">IBAN</span>
                      <span className="text-emerald-400 font-bold break-all">PK36MSHQ0000089200164395</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#070A12] border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">
                        Send Exactly $7,000.00 USD to:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white break-all bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 flex-1">
                          {details.address}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(details.address)}
                          className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 transition-colors cursor-pointer shrink-0"
                          title="Copy Deposit Address"
                        >
                          {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {details.qr && (
                      <div className="p-1.5 bg-white rounded-xl shrink-0 border border-slate-700">
                        <img src={details.qr} alt="Deposit QR Code" className="w-20 h-20 rounded" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                    <span>Network: <strong className="text-white">{details.network}</strong></span>
                    <span>Est. Fee: <strong className="text-amber-400">{details.fee}</strong></span>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Verification Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1">
                    2. Payment Proof / TxID / Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0x8a912c7d9e4a5f3210bc9... or Bank Ref #"
                    value={proofTxHash}
                    onChange={(e) => setProofTxHash(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase block mb-1">
                    3. Your Wallet Address (For Verification / Payouts)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TQn9Y2khEsLJW1ChVWFMSMeSTnMXZ..."
                    value={userWallet}
                    onChange={(e) => setUserWallet(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>Submitting $7,000 Payment...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit $7,000 IB Payment for Admin Approval</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
