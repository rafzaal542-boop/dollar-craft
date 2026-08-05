import React, { useState, useEffect } from 'react';
import { InvestmentPlan, User } from '../types';
import { MOCK_DEPOSIT_WALLETS } from '../data/mockData';
import { QRCodeSVG } from 'qrcode.react';
import { CinematicButton } from './ui/CinematicButton';
import { 
  X, 
  Copy, 
  Check, 
  Building2, 
  ShieldAlert, 
  ArrowRight, 
  Clock, 
  Percent, 
  DollarSign,
  Info,
  CreditCard,
  Wallet
} from 'lucide-react';

interface DepositModalProps {
  plans: InvestmentPlan[];
  isOpen: boolean;
  initialPlanId?: string;
  onClose: () => void;
  onSubmitDeposit: (planId: string, amount: number, network: string, txHash: string) => Promise<{ success: boolean; error?: string; message?: string } | void> | void;
  currentUser?: User | null;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  plans,
  isOpen,
  initialPlanId,
  onClose,
  onSubmitDeposit,
  currentUser
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId || plans[0]?.id || '');
  const [amount, setAmount] = useState<number>(100);
  const [network, setNetwork] = useState<string>('Bank Transfer (IBAN)');
  const [txHash, setTxHash] = useState<string>('');
  const [copiedIban, setCopiedIban] = useState<boolean>(false);
  const [copiedTitle, setCopiedTitle] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [step, setStep] = useState<'SELECT' | 'PAYMENT' | 'CONFIRM'>('SELECT');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [submittedTxId, setSubmittedTxId] = useState<string>('');

  const bankName = MOCK_DEPOSIT_WALLETS.BANK_NAME || 'Dubai Islamic Bank';
  const accountTitle = MOCK_DEPOSIT_WALLETS.ACCOUNT_TITLE || 'Muhammad Nadeem';
  const ibanNumber = MOCK_DEPOSIT_WALLETS.BANK_IBAN || 'PK71DUIB0000000809383001';

  // Keep selectedPlanId and default amount synced when modal opens or initialPlanId changes
  useEffect(() => {
    if (isOpen) {
      const targetId = initialPlanId || selectedPlanId || plans[0]?.id || '';
      const chosen = plans.find((p) => p.id === targetId) || plans.find((p) => p.id === initialPlanId) || plans[0];
      if (chosen) {
        setSelectedPlanId(chosen.id);
        setAmount(chosen.minDeposit);
      }
      setErrorMsg(null);
      setSubmittedSuccess(false);
    }
  }, [isOpen, initialPlanId, plans]);

  if (!isOpen) return null;

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const getPlanCode = (planId: string, idx: number) => {
    if (!planId) return `DC${idx + 1}`;
    const pid = planId.toLowerCase();
    if (pid.includes('standard') || pid === 'dc1') return 'DC1';
    if (pid.includes('premium') || pid === 'dc2') return 'DC2';
    if (pid.includes('vip') || pid === 'dc3') return 'DC3';
    return `DC${idx + 1}`;
  };

  const handleCopyIban = () => {
    navigator.clipboard.writeText(ibanNumber);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(accountTitle);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyAll = () => {
    const fullDetails = `Bank Name: ${bankName}\nAccount Title: ${accountTitle}\nIBAN: ${ibanNumber}`;
    navigator.clipboard.writeText(fullDetails);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const validateAndProcessDeposit = async (txIdToValidate?: string) => {
    setErrorMsg(null);
    const cleanTx = (txIdToValidate || txHash || `WASLIP-${Date.now().toString().slice(-8)}`).trim();

    // 1. AMOUNT VALIDATION: Deposit amount must be > $10
    if (amount <= 10) {
      setErrorMsg('Deposit amount must be greater than $10.');
      return false;
    }

    if (amount < activePlan.minDeposit) {
      setErrorMsg(`Minimum deposit amount for ${activePlan.name} is $${activePlan.minDeposit}.`);
      return false;
    }

    setIsSubmitting(true);

    // 2. Submit to Backend & Sync to Firestore
    try {
      const res = await onSubmitDeposit(activePlan.id, amount, 'Bank Transfer (IBAN)', cleanTx);
      if (res && res.success === false) {
        setErrorMsg(res.error || 'Failed to submit deposit request. Please try again.');
        setIsSubmitting(false);
        return false;
      }
      setSubmittedTxId(cleanTx);
      setSubmittedSuccess(true);
      setErrorMsg(null);
      return true;
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while processing your deposit.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Amount check before proceeding
    if (amount <= 10) {
      setErrorMsg('Deposit amount must be greater than $10.');
      return;
    }

    if (amount < activePlan.minDeposit || amount > activePlan.maxDeposit) {
      setErrorMsg(`Amount must be between $${activePlan.minDeposit} and $${activePlan.maxDeposit}`);
      return;
    }

    await validateAndProcessDeposit();
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await validateAndProcessDeposit();
  };

  const handleCloseSuccess = () => {
    setSubmittedSuccess(false);
    setStep('SELECT');
    setTxHash('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md p-2 sm:p-4 w-full max-w-full">
      <div className="flex min-h-full items-center justify-center text-center p-0 sm:p-2">
        <div className="relative w-full max-w-xl bg-gradient-to-b from-[#0D1527] via-[#070C18] to-[#040710] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden text-white text-left my-auto max-h-[90vh] overflow-y-auto ring-1 ring-cyan-500/20">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-center p-5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-xl font-black text-white flex items-center justify-center">
              <span className={`text-base sm:text-lg font-black px-5 py-2 rounded-2xl border shadow-xl tracking-wider uppercase flex items-center gap-2.5 mx-auto ${
                getPlanCode(activePlan.id, plans.indexOf(activePlan)) === 'DC3'
                  ? 'bg-gradient-to-r from-fuchsia-950/90 via-purple-900/80 to-fuchsia-950/90 text-fuchsia-300 border-fuchsia-400/60 shadow-fuchsia-500/30 ring-1 ring-fuchsia-400/30'
                  : getPlanCode(activePlan.id, plans.indexOf(activePlan)) === 'DC2'
                  ? 'bg-gradient-to-r from-amber-950/90 via-orange-900/80 to-amber-950/90 text-amber-300 border-amber-400/60 shadow-amber-500/30 ring-1 ring-amber-400/30'
                  : 'bg-gradient-to-r from-cyan-950/90 via-blue-900/80 to-teal-950/90 text-cyan-300 border-cyan-400/60 shadow-cyan-500/30 ring-1 ring-cyan-400/30'
              }`}>
                <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse shrink-0" />
                {activePlan.name}
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-6">
          {submittedSuccess ? (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
                <Clock className="w-8 h-8 animate-pulse text-emerald-400" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-white uppercase tracking-wide">Deposit Request Submitted</h4>
                <p className="text-xs text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
                  Your deposit request is submitted. It will be verified within 30 minutes.
                </p>
              </div>

              <div className="bg-[#050A14] p-4 rounded-2xl border border-cyan-500/30 text-xs font-mono space-y-2.5 text-left shadow-inner">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="text-cyan-300 font-bold tracking-wider">{submittedTxId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Deposit Principal:</span>
                  <span className="text-emerald-400 font-bold">${amount}.00</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Bank Name:</span>
                  <span className="text-white font-bold">{bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                    Pending Manual Verification
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseSuccess}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xl shadow-emerald-500/20"
              >
                Done & Return to Dashboard
              </button>
            </div>
          ) : step === 'SELECT' ? (
            <form onSubmit={handleNextToPayment} className="space-y-5">
              {/* Active Selected Plan Summary */}
              <div>
                {/* Selected Plan Details Box */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xl transition-all ${
                  getPlanCode(activePlan.id, plans.indexOf(activePlan)) === 'DC3'
                    ? 'bg-gradient-to-r from-[#240A34] to-[#12051B] border-fuchsia-500/50 shadow-fuchsia-950/50'
                    : getPlanCode(activePlan.id, plans.indexOf(activePlan)) === 'DC2'
                    ? 'bg-gradient-to-r from-[#251908] to-[#110A03] border-amber-500/50 shadow-amber-950/50'
                    : 'bg-gradient-to-r from-[#091D1A] to-[#040E0C] border-cyan-500/50 shadow-cyan-950/50'
                }`}>
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-black text-sm shrink-0 shadow-md ${
                      getPlanCode(activePlan.id, plans.indexOf(activePlan)) === 'DC3'
                        ? 'bg-fuchsia-500/25 border border-fuchsia-400 text-fuchsia-300 shadow-fuchsia-500/30'
                        : getPlanCode(activePlan.id, plans.indexOf(activePlan)) === 'DC2'
                        ? 'bg-amber-500/25 border border-amber-400 text-amber-300 shadow-amber-500/30'
                        : 'bg-cyan-500/25 border border-cyan-400 text-cyan-300 shadow-cyan-500/30'
                    }`}>
                      {getPlanCode(activePlan.id, plans.indexOf(activePlan))}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white flex items-center gap-2">
                        <span>{activePlan.name}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          getPlanCode(activePlan.id, plans.indexOf(activePlan)) === 'DC3'
                            ? 'text-fuchsia-300 bg-fuchsia-950 border-fuchsia-800/80'
                            : getPlanCode(activePlan.id, plans.indexOf(activePlan)) === 'DC2'
                            ? 'text-amber-300 bg-amber-950 border-amber-800/80'
                            : 'text-cyan-300 bg-cyan-950 border-cyan-800/80'
                        }`}>
                          {activePlan.dailyYieldPercent}% / day
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono font-medium mt-1">
                        Range: ${activePlan.minDeposit.toLocaleString()} - ${activePlan.maxDeposit.toLocaleString()} USD
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-300 shrink-0">
                    <div className="font-semibold">Duration: {activePlan.durationDays} Days</div>
                    <div className={`font-black text-xs ${
                      getPlanCode(activePlan.id, plans.indexOf(activePlan)) === 'DC3'
                        ? 'text-fuchsia-300'
                        : getPlanCode(activePlan.id, plans.indexOf(activePlan)) === 'DC2'
                        ? 'text-amber-300'
                        : 'text-cyan-300'
                    }`}>
                      ~{(activePlan.dailyYieldPercent * 30).toFixed(0)}% / Month
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Internal Transfer Balance Card */}
              {currentUser && (
                <div className="bg-[#050D18] border border-emerald-500/40 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider block">
                        Admin Internal Transfer Balance
                      </span>
                      <span className="text-xs text-slate-300 font-sans">
                        Credited to {currentUser.email}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-emerald-300">
                      ${(Number(currentUser.principalBalance || 0) + Number(currentUser.earnedYield || 0)).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                  Deposit Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-mono font-bold text-lg">$</span>
                  <input
                    type="number"
                    min={activePlan.minDeposit}
                    max={activePlan.maxDeposit}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#070D18] border border-slate-700/80 rounded-2xl py-3.5 pl-9 pr-20 font-mono text-white text-lg font-bold focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(activePlan.maxDeposit)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-mono font-black px-3 py-1.5 rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    MAX
                  </button>
                </div>
                <div className="p-3 mt-2.5 rounded-xl bg-[#060B14] border border-slate-800/80 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Estimated Yield:</span>
                  <div className="text-right">
                    <span className="text-emerald-400 font-black mr-3">~${((amount * activePlan.dailyYieldPercent) / 100).toFixed(2)}/day</span>
                    <span className="text-cyan-300 font-bold">~${(((amount * activePlan.dailyYieldPercent) / 100) / 86400).toFixed(6)}/sec</span>
                  </div>
                </div>
              </div>

              {/* Deposit Method Display - ONLY Bank Transfer IBAN */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Deposit Method</span>
                  <span className="text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">Verified Bank Gateway</span>
                </label>
                
                <div className="p-4 rounded-2xl bg-[#070D18] border border-cyan-500/40 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                        <Building2 className="w-5 h-5 text-cyan-300" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-wide">
                          {bankName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Direct Bank Deposit
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold uppercase">
                      Active
                    </span>
                  </div>

                  {/* Account Title */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Account Title:</span>
                    <span className="text-white font-bold">{accountTitle}</span>
                  </div>

                  {/* IBAN Preview with direct copy button */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-slate-400">IBAN:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-bold tracking-wider">{ibanNumber}</span>
                      <button
                        type="button"
                        onClick={handleCopyIban}
                        className="px-2 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                        title="Copy IBAN"
                      >
                        {copiedIban ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300 text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-cyan-300" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Payment Slip on WhatsApp Requirement Box */}
              <div className="bg-[#050D1A] p-4.5 rounded-2xl border border-emerald-500/40 space-y-3 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Share Payment Deposit Slip</h4>
                    <p className="text-[11px] text-emerald-400 font-mono font-bold">WhatsApp: 03711386489</p>
                  </div>
                </div>

                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  Please share your payment deposit slip on Dollar Craft&apos;s official WhatsApp number: <strong className="text-emerald-400 font-mono text-sm underline">03711386489</strong>.
                </p>

                <a
                  href={`https://wa.me/923711386489?text=${encodeURIComponent(`Hello Dollar Craft, I am sending my payment deposit slip for $${amount} USD deposit in ${activePlan.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer border border-emerald-400/50 hover:scale-[1.01]"
                >
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>Share Slip on Official WhatsApp</span>
                </a>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium flex items-start gap-2 shadow-lg animate-fadeIn">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 hover:brightness-110 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer"
              >
                <span>Confirm & Submit Deposit Request</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            </form>
          ) : step === 'PAYMENT' ? (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              <div className="bg-[#050A14] p-5 rounded-2xl border border-cyan-500/30 text-center shadow-lg">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Transfer Amount</p>
                <p className="text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-teal-300">
                  ${amount}.00 USD
                </p>
                <p className="text-xs text-slate-300 font-mono mt-1 font-semibold flex items-center justify-center gap-1.5">
                  Deposit Gateway: <span className="text-cyan-400 font-bold">{bankName}</span>
                </p>
              </div>

              {/* Bank IBAN Premium Card with Inline Copy Buttons */}
              <div className="bg-gradient-to-b from-[#091120] to-[#040812] p-5 rounded-2xl border border-cyan-500/50 shadow-2xl space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-inner">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-white uppercase tracking-wider block">
                        {bankName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Official Deposit Gateway
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                    Verified Account
                  </span>
                </div>

                {/* Account Title Field with Inline Copy */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Account Title
                  </label>
                  <div className="p-3 bg-[#050A14] border border-slate-800 rounded-xl flex items-center justify-between gap-2 shadow-inner">
                    <span className="font-mono text-sm font-black text-white tracking-wide">
                      {accountTitle}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTitle}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border border-slate-700/60 shrink-0"
                    >
                      {copiedTitle ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[10px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* IBAN Field with Inline Copy Button */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Bank IBAN Number
                  </label>
                  <div className="p-3 bg-[#050A14] border border-cyan-500/50 rounded-xl flex items-center justify-between gap-2 shadow-inner">
                    <span className="font-mono text-xs sm:text-sm font-black text-cyan-300 tracking-wider break-all">
                      {ibanNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyIban}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
                    >
                      {copiedIban ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span className="text-emerald-200 text-[11px]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-cyan-200" />
                          <span className="text-[11px]">Copy IBAN</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Copy All Details Action */}
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700/80"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-mono">All Bank Details Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-cyan-400" />
                      <span>Copy All Bank Details</span>
                    </>
                  )}
                </button>
              </div>

              {/* WhatsApp Deposit Slip Requirements in PAYMENT Step */}
              <div className="bg-[#050D1A] p-4.5 rounded-2xl border border-emerald-500/40 space-y-3 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Send Slip to Official WhatsApp</h4>
                    <p className="text-[11px] text-emerald-400 font-mono font-bold">Number: 03711386489</p>
                  </div>
                </div>

                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  Payment deposit slip Dollar Craft ke official WhatsApp number per share karo. Yeh hai number: <strong className="text-emerald-400 font-mono text-sm underline">03711386489</strong>.
                </p>

                <a
                  href={`https://wa.me/923711386489?text=${encodeURIComponent(`Hello Dollar Craft, I have transferred $${amount} USD to IBAN ${ibanNumber}. Here is my payment deposit slip.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer border border-emerald-400/50 hover:scale-[1.01]"
                >
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>Share Slip on Live WhatsApp</span>
                </a>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium flex items-start gap-2 shadow-lg">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 font-medium">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Please transfer exact amount (${amount}.00) to IBAN <strong className="text-white font-mono">{ibanNumber}</strong>, then send your slip on WhatsApp (<strong className="text-emerald-400">03711386489</strong>).
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep('SELECT');
                  }}
                  className="w-1/3 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-all border border-slate-700/60"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <span>Submit Deposit Request</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : step === 'CONFIRM' ? (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="bg-[#050A14] p-4 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">Bank Transaction Verification</h4>
                <p className="text-xs text-slate-400 font-medium">
                  Enter your Bank Transfer Reference / Transaction ID below for manual admin verification within 30 minutes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                  Bank Transaction ID / Reference Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRX9823014791..."
                  value={txHash}
                  onChange={(e) => {
                    setTxHash(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className={`w-full bg-[#070D18] border ${
                    errorMsg ? 'border-rose-500/80 ring-2 ring-rose-500/20' : 'border-slate-700/80'
                  } rounded-2xl p-3.5 font-mono text-xs text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all`}
                />
                {errorMsg && (
                  <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium flex items-start gap-2 shadow-lg animate-fadeIn">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-400 bg-[#050A14] p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>Deposit Principal:</span>
                  <span className="text-white font-bold">${amount}.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Bank Name:</span>
                  <span className="text-cyan-400 font-bold">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Title:</span>
                  <span className="text-white font-bold">{accountTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span>IBAN Account:</span>
                  <span className="text-cyan-300 font-bold text-[11px]">{ibanNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verification Window:</span>
                  <span className="text-emerald-400 font-bold">Within 30 minutes</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep('PAYMENT');
                  }}
                  className="w-1/3 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-all border border-slate-700/60"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <span>Submit Bank Transaction ID</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : null}
        </div>

      </div>
      </div>
    </div>
  );
};

