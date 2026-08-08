import React, { useState, useRef } from 'react';
import { BigNumber, formatCurrency, formatPrecision } from '../lib/yieldEngine';
import { CinematicButton } from './ui/CinematicButton';
import html2canvas from 'html2canvas';
import { 
  X, 
  ShieldCheck, 
  ArrowUpRight, 
  AlertTriangle, 
  Lock, 
  CheckCircle2, 
  Info,
  Key,
  Building2,
  Wallet,
  CreditCard,
  Camera,
  Download,
  Share2,
  Check
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
  const [accountTitle, setAccountTitle] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [destinationAddr, setDestinationAddr] = useState<string>('');
  const [network, setNetwork] = useState<string>('BANK_TRANSFER');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isCaptured, setIsCaptured] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<{
    amount: string;
    gateway: string;
    title: string;
    number: string;
    txRef: string;
    timestamp: string;
  } | null>(null);

  const slipRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const maxBalanceBN = new BigNumber(availableBalance || 0);

  const getGatewayLabel = (gw: string) => {
    switch (gw) {
      case 'BANK_TRANSFER': return 'Bank Transfer';
      case 'EASYPAISA': return 'EasyPaisa';
      case 'JAZZCASH': return 'JazzCash';
      default: return gw;
    }
  };

  const handleCaptureScreenshot = async () => {
    if (!slipRef.current) return;
    try {
      const canvas = await html2canvas(slipRef.current, {
        backgroundColor: '#050c18',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const imageUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `DollarCraft_Withdrawal_Slip_${Date.now()}.png`;
      link.href = imageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsCaptured(true);
      setTimeout(() => setIsCaptured(false), 3000);
    } catch (err) {
      console.error('Failed to generate screenshot:', err);
      // Fallback: open in new tab if direct download fails
      try {
        if (slipRef.current) {
          const canvas = await html2canvas(slipRef.current, { backgroundColor: '#050c18' });
          const win = window.open('');
          if (win) {
            win.document.write(`<img src="${canvas.toDataURL()}" style="max-width:100%;" />`);
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback screenshot failed:', fallbackErr);
      }
    }
  };

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

    let targetDestination = destinationAddr.trim();

    if (['BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH'].includes(network)) {
      if (!accountTitle.trim()) {
        setErrorMsg('Please enter the Account Title.');
        return;
      }
      if (!accountNumber.trim()) {
        setErrorMsg(network === 'BANK_TRANSFER' ? 'Please enter the IBAN Number.' : 'Please enter the Account Number.');
        return;
      }
      targetDestination = network === 'BANK_TRANSFER'
        ? `Title: ${accountTitle.trim()} | IBAN: ${accountNumber.trim()}`
        : `Title: ${accountTitle.trim()} | Acc: ${accountNumber.trim()}`;
    } else {
      if (!targetDestination || targetDestination.length < 5) {
        setErrorMsg('Please enter valid destination account or wallet details.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmitWithdrawal(numAmount, targetDestination, network);
      if (result.success) {
        const txRef = `WD-${Math.floor(100000 + Math.random() * 900000)}`;
        const timestamp = new Date().toLocaleString();
        
        setSubmittedData({
          amount: numAmount.toFixed(2),
          gateway: getGatewayLabel(network),
          title: accountTitle.trim() || 'Valued Client',
          number: accountNumber.trim() || destinationAddr.trim(),
          txRef,
          timestamp,
        });

        setSuccessMsg(result.message);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Withdrawal request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetModal = () => {
    setAmount('');
    setAccountTitle('');
    setAccountNumber('');
    setDestinationAddr('');
    setSuccessMsg('');
    setSubmittedData(null);
    onClose();
  };

  const currentTitle = accountTitle.trim() || 'Your Name';
  const currentNumber = accountNumber.trim() || destinationAddr.trim() || 'Account / IBAN';
  const currentAmount = amount ? parseFloat(amount).toFixed(2) : '0.00';
  const currentGateway = getGatewayLabel(network);

  const whatsappMessage = encodeURIComponent(
    `Hello Dollar Craft Official Support, I am sending my withdrawal request slip.\n\n` +
    `💸 *Withdrawal Amount:* $${submittedData?.amount || currentAmount} USD\n` +
    `🏦 *Payout Gateway:* ${submittedData?.gateway || currentGateway}\n` +
    `👤 *Account Title:* ${submittedData?.title || currentTitle}\n` +
    `💳 *Account / IBAN Number:* ${submittedData?.number || currentNumber}\n` +
    `📌 *Ref Code:* ${submittedData?.txRef || 'WD-PENDING'}\n\n` +
    `Please process my withdrawal request. Thank you!`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-sm p-2 sm:p-4 w-full max-w-full">
      <div className="flex min-h-full items-center justify-center text-center p-0 sm:p-2">
        <div className="relative w-full max-w-md bg-gradient-to-b from-[#0a1526] via-[#050e1c] to-[#030712] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/80 overflow-hidden text-white text-left my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-cyan-500/20 bg-gradient-to-r from-[#071322]/80 via-[#0a182b]/80 to-[#040c17]/80 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                <span>Withdrawal Request</span>
              </h3>
              <p className="text-[11px] font-mono text-cyan-300/80 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Instant Daily Profit Settlement</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleResetModal}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-all cursor-pointer shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 relative z-10">
          {successMsg && submittedData ? (
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/60">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h4 className="text-lg font-black text-white tracking-tight">Withdrawal Request Queued</h4>
                <p className="text-xs text-emerald-300 font-mono font-semibold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full inline-block">{successMsg}</p>
              </div>

              {/* Official Withdrawal Slip Card (Target for html2canvas screenshot) */}
              <div 
                ref={slipRef}
                id="withdrawal-slip-card"
                className="bg-gradient-to-b from-[#06162a] via-[#040e1d] to-[#020812] p-5 rounded-2xl border border-emerald-500/50 shadow-2xl text-white space-y-3.5 relative overflow-hidden"
              >
                {/* Background Watermark / Logo Accent */}
                <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Slip Header */}
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase font-mono block">DOLLAR CRAFT OFFICIAL</span>
                    <h5 className="text-sm font-extrabold text-white">Withdrawal Slip</h5>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>PENDING VERIFICATION</span>
                  </div>
                </div>

                {/* Amount Banner */}
                <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-emerald-950/80 p-3.5 rounded-xl border border-emerald-500/40 flex items-center justify-between shadow-inner">
                  <span className="text-xs text-slate-300 font-medium">Payout Amount:</span>
                  <span className="text-2xl font-mono font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                    ${submittedData.amount} USD
                  </span>
                </div>

                {/* Details Table */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Gateway:</span>
                    <span className="text-slate-100 font-bold">{submittedData.gateway}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Account Title:</span>
                    <span className="text-slate-100 font-bold">{submittedData.title}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Account / IBAN:</span>
                    <span className="text-emerald-300 font-bold break-all max-w-[180px] text-right">{submittedData.number}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Ref Code:</span>
                    <span className="text-amber-400 font-bold">{submittedData.txRef}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Date & Time:</span>
                    <span className="text-slate-300 text-[10px]">{submittedData.timestamp}</span>
                  </div>
                </div>

                {/* Slip Footer */}
                <div className="text-[9px] text-slate-400 font-mono text-center pt-2 border-t border-slate-800/80">
                  Dollar Craft Atomic Ledger Settlement Gateway • Official Verification Receipt
                </div>
              </div>

              {/* Action Buttons: Share on WhatsApp */}
              <div className="space-y-2.5 pt-1">
                {/* Direct Share on Live WhatsApp Button */}
                <a
                  href={`/api/whatsapp-support?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/80 transition-all cursor-pointer border border-emerald-400/50 hover:scale-[1.02] active:scale-[0.99]"
                >
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>Share Slip on Live WhatsApp</span>
                </a>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleResetModal}
                  className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-white font-mono transition-colors cursor-pointer"
                >
                  Done / Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4.5">
              
              {/* Available Daily Profit Balance Showcase Card */}
              <div className="bg-gradient-to-r from-[#041d1a] via-[#072d28] to-[#031815] p-4 rounded-2xl border border-emerald-500/40 shadow-xl shadow-emerald-950/40 relative overflow-hidden flex items-center justify-between">
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] text-emerald-300 font-mono font-bold uppercase tracking-wider">Available Profit Balance</span>
                  </div>
                  <span className="text-2xl font-mono font-black text-emerald-400 tracking-tight drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                    ${formatPrecision(maxBalanceBN, 6)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAmount(maxBalanceBN.toFixed(2))}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-mono font-black shadow-lg shadow-emerald-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  MAX
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wide">
                    Withdrawal Amount (USD)
                  </label>
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                    MIN $50.00 USD
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-mono font-extrabold text-lg">$</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#030914] border border-slate-800 rounded-2xl py-3 pl-9 pr-4 font-mono text-white text-lg font-bold focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Network / Payout Type */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wide flex items-center justify-between">
                  <span>PAYOUT BANK AND OTHER</span>
                  <span className="text-cyan-400 text-[10px] font-mono font-bold">Select Gateway</span>
                </label>

                {/* Visual Gateway Selector Cards with Logos */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setNetwork('BANK_TRANSFER')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer relative overflow-hidden ${
                      network === 'BANK_TRANSFER'
                        ? 'bg-gradient-to-br from-[#0a232e] to-[#04121a] border-cyan-400 text-white ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-950/80'
                        : 'bg-[#030812] border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">Bank</div>
                      <div className="text-[9px] font-mono text-cyan-400 font-bold mt-0.5">IBAN / Local</div>
                    </div>
                  </button>

                  {/* EasyPaisa */}
                  <button
                    type="button"
                    onClick={() => setNetwork('EASYPAISA')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer relative overflow-hidden ${
                      network === 'EASYPAISA'
                        ? 'bg-gradient-to-br from-[#062619] to-[#02130c] border-emerald-400 text-white ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-950/80'
                        : 'bg-[#030812] border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#00A859] border border-emerald-300 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-md">
                      eP
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">EasyPaisa</div>
                      <div className="text-[9px] font-mono text-emerald-400 font-bold mt-0.5">Wallet</div>
                    </div>
                  </button>

                  {/* JazzCash */}
                  <button
                    type="button"
                    onClick={() => setNetwork('JAZZCASH')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer relative overflow-hidden ${
                      network === 'JAZZCASH'
                        ? 'bg-gradient-to-br from-[#280c0d] to-[#140405] border-red-500 text-white ring-2 ring-red-500/50 shadow-lg shadow-red-950/80'
                        : 'bg-[#030812] border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D12027] via-[#A8181E] to-[#6E0E12] border border-amber-400/60 flex items-center justify-center font-black text-amber-300 text-xs shrink-0 shadow-md">
                      JC
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">JazzCash</div>
                      <div className="text-[9px] font-mono text-red-400 font-bold mt-0.5">Wallet</div>
                    </div>
                  </button>
                </div>

                {/* Dropdown for payout networks */}
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full bg-[#030914] border border-slate-800 rounded-xl py-2.5 px-3.5 font-mono text-xs text-slate-200 focus:border-cyan-400 focus:outline-none transition-all shadow-inner"
                >
                  <option value="BANK_TRANSFER">🏦 Bank Transfer (IBAN / Local Bank)</option>
                  <option value="EASYPAISA">🟢 EasyPaisa Mobile Account</option>
                  <option value="JAZZCASH">🔴 JazzCash Mobile Account</option>
                </select>
              </div>

              {/* Destination Account & IBAN Details - 2 Separate Input Boxes */}
              {['BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH'].includes(network) ? (
                <div className="space-y-3">
                  {/* Box 1: Account Title & Bank Name */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-200 uppercase mb-1.5 flex items-center justify-between">
                      <span>{network === 'BANK_TRANSFER' ? 'Account Title & Bank Name' : 'Account Title'}</span>
                      <span className="text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">Box 1</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        network === 'BANK_TRANSFER'
                          ? 'e.g. Muhammad Ali (Meezan Bank)'
                          : 'e.g. Muhammad Ali'
                      }
                      value={accountTitle}
                      onChange={(e) => setAccountTitle(e.target.value)}
                      className="w-full bg-[#030914] border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:border-emerald-400 focus:outline-none transition-all shadow-inner"
                    />
                  </div>

                  {/* Box 2: IBAN Number or Mobile Account Number */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-200 uppercase mb-1.5 flex items-center justify-between">
                      <span>{network === 'BANK_TRANSFER' ? 'IBAN Number' : 'Account Number'}</span>
                      <span className="text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">Box 2</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        network === 'BANK_TRANSFER'
                          ? 'e.g. PK36MEZN0001020304050607'
                          : network === 'EASYPAISA'
                          ? 'e.g. 03001234567'
                          : 'e.g. 03011234567'
                      }
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-[#030914] border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:border-emerald-400 focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 uppercase mb-1.5">
                    Destination Account Number / Details
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Account Number or Destination Details..."
                    value={destinationAddr}
                    onChange={(e) => setDestinationAddr(e.target.value)}
                    className="w-full bg-[#030914] border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:border-emerald-400 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              )}

              {/* Error Box */}
              {errorMsg && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-start gap-2.5 font-mono shadow-md">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Anti-Exploit Security Note */}
              <div className="p-3.5 bg-[#030914]/90 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono shadow-md">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Atomic Lock Protection Active</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Withdrawal requests undergo real-time mathematical yield sanity checks.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <CinematicButton
                  type="button"
                  onClick={handleResetModal}
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

