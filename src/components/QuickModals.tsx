"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Copy, 
  Check, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertCircle,
  ShieldCheck,
  Zap,
  Sparkles
} from "lucide-react";
import BigNumber from "bignumber.js";
import { QRCodeSVG } from "qrcode.react";
import { CinematicButton } from "./ui/CinematicButton";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess?: (amount: string) => void;
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string;
  onWithdrawSuccess?: (amount: string) => void;
}

// ------------------- 1. DEPOSIT MODAL (Electric Blue & Platinum Silver Theme) -------------------
export function DepositModal({ isOpen, onClose, onDepositSuccess }: DepositModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<"TRC20" | "BEP20">("TRC20");
  const [depositAmount, setDepositAmount] = useState<string>("");

  const walletAddresses = {
    TRC20: "T9xZ8yQ2wE4rT6yU8iO0pA1sD3fG5hJ7kL",
    BEP20: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  };

  const currentAddress = walletAddresses[selectedNetwork];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    
    if (onDepositSuccess) onDepositSuccess(depositAmount);
    setDepositAmount("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0B0F17] border border-cyan-500/30 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-[0_0_50px_rgba(0,102,255,0.2)] relative overflow-hidden text-slate-100"
          >
            {/* Radial Glow Overlay */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-600/20 to-cyan-500/20 rounded-2xl border border-cyan-500/40 text-cyan-400">
                  <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
                    Deposit USDT
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Dollar Craft High-Precision Micro-Yield Protocol
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="mt-6 space-y-5">
              {/* Network Selector Tabs */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 font-mono">
                  1. Select Blockchain Network
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedNetwork("TRC20")}
                    className={`py-3 px-4 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedNetwork === "TRC20"
                        ? "bg-gradient-to-r from-blue-950 to-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(0,210,255,0.25)]"
                        : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    USDT (TRC20 - TRON)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNetwork("BEP20")}
                    className={`py-3 px-4 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedNetwork === "BEP20"
                        ? "bg-gradient-to-r from-blue-950 to-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(0,210,255,0.25)]"
                        : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    USDT (BEP20 - BSC)
                  </button>
                </div>
              </div>

              {/* Dynamic QR Code Card */}
              <div className="bg-[#07090E] p-4 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
                <div className="bg-white p-3 rounded-2xl shadow-xl">
                  <QRCodeSVG 
                    value={currentAddress} 
                    size={110}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2.5 font-mono">
                  Scan QR Code or copy deposit address below
                </p>
              </div>

              {/* Address Display & Copy Button */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 font-mono">
                  2. Deposit Address ({selectedNetwork})
                </label>
                <div className="flex items-center gap-2 bg-[#07090E] border border-slate-800 rounded-2xl p-2.5 focus-within:border-cyan-500 transition-all">
                  <span className="text-xs text-cyan-400 font-mono font-bold truncate flex-1 px-2 select-all">
                    {currentAddress}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "COPIED!" : "COPY"}
                  </button>
                </div>
              </div>

              {/* Deposit Amount Input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 font-mono">
                  3. Expected Deposit Amount (USDT)
                </label>
                <input
                  type="number"
                  step="any"
                  min="10"
                  placeholder="Minimum 10 USDT"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-[#07090E] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono font-bold"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <CinematicButton
                  type="button"
                  onClick={onClose}
                  variant="utility"
                  size="lg"
                  className="flex-1"
                >
                  CANCEL
                </CinematicButton>
                <CinematicButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                >
                  CONFIRM DEPOSIT
                </CinematicButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ------------------- 2. WITHDRAWAL MODAL (Electric Blue & Platinum Silver Theme) -------------------
export function WithdrawModal({ isOpen, onClose, currentBalance, onWithdrawSuccess }: WithdrawModalProps) {
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleMaxClick = () => {
    const bn = new BigNumber(currentBalance);
    setWithdrawAmount(bn.toFixed(4));
    setErrorMsg("");
  };

  const handleSubmitWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const bnAmount = new BigNumber(withdrawAmount || "0");
    const bnBalance = new BigNumber(currentBalance);

    if (bnAmount.isLessThanOrEqualTo(0)) {
      setErrorMsg("Please enter a valid withdrawal amount.");
      return;
    }

    if (bnAmount.isGreaterThan(bnBalance)) {
      setErrorMsg("Insufficient net balance for withdrawal.");
      return;
    }

    if (destinationAddress.trim().length < 10) {
      setErrorMsg("Please provide a valid USDT destination address.");
      return;
    }

    if (onWithdrawSuccess) onWithdrawSuccess(withdrawAmount);
    setWithdrawAmount("");
    setDestinationAddress("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0B0F17] border border-slate-700/80 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden text-slate-100"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800/90 rounded-2xl border border-slate-700 text-slate-200">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide uppercase">
                    Withdraw Funds
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Instant mathematical verification queue
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWithdrawal} className="mt-6 space-y-4">
              {/* Available Balance Banner */}
              <div className="bg-[#07090E] p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-mono uppercase">Available Net Balance:</span>
                <span className="text-sm font-mono font-black text-cyan-400">
                  ${currentBalance} USD
                </span>
              </div>

              {/* Error Alert Box */}
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 font-mono">
                  Withdrawal Amount (USDT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => {
                      setWithdrawAmount(e.target.value);
                      setErrorMsg("");
                    }}
                    className="w-full bg-[#07090E] border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono font-bold pr-20"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-blue-900 to-cyan-900 hover:from-blue-800 hover:to-cyan-800 text-cyan-300 text-xs font-extrabold rounded-xl border border-cyan-500/40 transition-all cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Destination Address */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 font-mono">
                  Destination Wallet Address (USDT TRC20 / BEP20)
                </label>
                <input
                  type="text"
                  placeholder="Paste destination wallet address here..."
                  value={destinationAddress}
                  onChange={(e) => {
                    setDestinationAddress(e.target.value);
                    setErrorMsg("");
                  }}
                  className="w-full bg-[#07090E] border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  required
                />
              </div>

              {/* Security Disclaimer */}
              <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-[#07090E] p-3.5 rounded-2xl border border-slate-800/80">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Withdrawal queue automatically validates yields against protocol APR to protect liquidity.</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <CinematicButton
                  type="button"
                  onClick={onClose}
                  variant="utility"
                  size="lg"
                  className="flex-1"
                >
                  CANCEL
                </CinematicButton>
                <CinematicButton
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  SUBMIT WITHDRAWAL
                </CinematicButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
