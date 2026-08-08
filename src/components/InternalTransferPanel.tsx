import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Wallet, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  PlusCircle, 
  Lock, 
  X, 
  History, 
  Sparkles,
  UserCheck,
  ArrowRightLeft,
  DollarSign
} from 'lucide-react';
import { User, InternalTransfer, InternalTransferWalletType, AutoTransferSignupConfig } from '../types';
import { BigNumber, formatCurrency } from '../lib/yieldEngine';

interface InternalTransferPanelProps {
  users: User[];
  onRefreshData?: () => void;
  preSelectedUser?: User | null;
}

export const InternalTransferPanel: React.FC<InternalTransferPanelProps> = ({
  users,
  onRefreshData,
  preSelectedUser
}) => {
  // State
  const [adminBalance, setAdminBalance] = useState<string>('9273632653543654767657.00');
  const [autoSignupConfig, setAutoSignupConfig] = useState<AutoTransferSignupConfig>({
    enabled: false,
    bonusAmount: '5.00',
    targetWallet: 'MAIN_WALLET'
  });
  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Transfer Form State
  const [userSearch, setUserSearch] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(preSelectedUser || null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [walletType, setWalletType] = useState<InternalTransferWalletType>('MAIN_WALLET');
  const [note, setNote] = useState<string>('');

  // Password Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Topup Admin Wallet Modal State
  const [isTopupModalOpen, setIsTopupModalOpen] = useState<boolean>(false);
  const [topupAmount, setTopupAmount] = useState<string>('10000');

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Auto Signup Settings save loading
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  const fetchState = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/internal-transfers/state');
      if (res.ok) {
        const data = await res.json();
        setAdminBalance(data.adminWalletBalance || '50000.00');
        if (data.autoSignupConfig) {
          setAutoSignupConfig(data.autoSignupConfig);
        }
        setTransfers(data.transfers || []);
      }
    } catch (err) {
      console.warn('Error fetching internal transfer state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    if (preSelectedUser) {
      setSelectedUser(preSelectedUser);
      setUserSearch(preSelectedUser.email);
    }
  }, [preSelectedUser]);

  const filteredUsersForSearch = users.filter(u => 
    u && u.role !== 'ADMIN' && (
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.id && u.id.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(userSearch.toLowerCase()))
    )
  );

  const getEffectiveRecipient = (): User | null => {
    if (selectedUser) return selectedUser;
    const cleanSearch = userSearch.trim();
    if (!cleanSearch) return null;

    // Search in users array by email or id
    const matched = users.find(
      (u) => u && ((u.email && u.email.toLowerCase() === cleanSearch.toLowerCase()) || (u.id && u.id.toLowerCase() === cleanSearch.toLowerCase()))
    );
    if (matched) return matched;

    // If valid email string provided, construct recipient shell
    if (cleanSearch.includes('@')) {
      return {
        id: cleanSearch,
        email: cleanSearch,
        role: 'USER',
        tier: 'SILVER',
        principalBalance: '0.00',
        earnedYield: '0.00',
        totalWithdrawn: '0.00',
        walletAddress: '0x000',
        referralCode: 'DC0000',
        isFrozen: false,
        createdAt: new Date().toISOString()
      };
    }
    return null;
  };

  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const target = getEffectiveRecipient();
    if (!target) {
      setErrorMsg('Please enter a valid user email address or select a client account.');
      return;
    }

    if (!selectedUser) {
      setSelectedUser(target);
    }

    const amountBN = new BigNumber(transferAmount || 0);
    if (amountBN.isNaN() || amountBN.isLessThanOrEqualTo(0)) {
      setErrorMsg('Please enter a valid transfer amount greater than $0.');
      return;
    }
    if (amountBN.isGreaterThan(new BigNumber(adminBalance))) {
      setErrorMsg(`Insufficient Admin Wallet Balance. Maximum available: ${formatCurrency(adminBalance)}`);
      return;
    }

    setAdminPassword('');
    setPasswordError('');
    setIsConfirmModalOpen(true);
  };

  const handleExecuteTransfer = async () => {
    if (!adminPassword || adminPassword.trim() !== 'gdbcbfjnxh@craft@007') {
      setPasswordError('Invalid Admin Password. Authorization denied.');
      return;
    }

    const target = getEffectiveRecipient();
    if (!target) {
      setPasswordError('Recipient user email is required.');
      return;
    }

    setActionLoading(true);
    setPasswordError('');
    try {
      const res = await fetch('/api/admin/internal-transfers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: target.id,
          toUserEmail: target.email,
          amount: transferAmount,
          toWalletType: walletType,
          note,
          adminPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Funds transferred successfully!');
        setIsConfirmModalOpen(false);
        setTransferAmount('');
        setNote('');
        fetchState();
        if (onRefreshData) onRefreshData();
      } else {
        setPasswordError(data.error || 'Failed to process internal transfer.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Server error processing transfer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverseTransfer = async (transferId: string) => {
    if (!window.confirm('Are you sure you want to reverse this internal transfer? Funds will be deducted from the client and returned to Admin Wallet.')) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/internal-transfers/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        fetchState();
        if (onRefreshData) onRefreshData();
      } else {
        setErrorMsg(data.error || 'Failed to reverse transfer.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error reversing transfer.');
    }
  };

  const handleTopupAdminWallet = async () => {
    const amountNum = parseFloat(topupAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    try {
      const res = await fetch('/api/admin/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: topupAmount })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminBalance(data.newBalance);
        setIsTopupModalOpen(false);
        setSuccessMsg(`Admin Personal Wallet topped up by +$${parseFloat(topupAmount).toFixed(2)}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAutoSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings/auto-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoSignupConfig)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Auto Internal Transfer on Signup settings saved successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 text-white font-sans">

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 font-mono text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP SECTION: Admin Personal Wallet Balance & Auto Signup Bonus Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Admin Personal Wallet Balance */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#0B0F17] via-[#0D1322] to-[#07090E] p-6 rounded-2xl border border-cyan-500/30 relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Wallet className="w-32 h-32 text-cyan-400" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Admin Personal Web Wallet
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono text-[10px] font-bold">
                OWNER VAULT
              </span>
            </div>

            <p className="text-xs text-slate-400">Available capital for internal client transfers</p>
            
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-3 tracking-tight break-all">
              {formatCurrency(adminBalance)}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 mt-4 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400 font-mono">Instant deduction on send</p>
            <button
              onClick={() => setIsTopupModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Top Up Admin</span>
            </button>
          </div>
        </div>

        {/* Card 2: Bonus Feature - Auto Internal Transfer on Signup Settings */}
        <div className="lg:col-span-2 bg-[#0B0F17] p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Auto Internal Transfer on Signup (Welcome Bonus)</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Status:</span>
                <button
                  type="button"
                  onClick={() => setAutoSignupConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                    autoSignupConfig.enabled ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              When enabled, any new user who registers will automatically receive an instant welcome bonus transfer from your Admin Personal Wallet.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Welcome Bonus Amount ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={autoSignupConfig.bonusAmount}
                    onChange={(e) => setAutoSignupConfig(prev => ({ ...prev, bonusAmount: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    placeholder="5.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Destination Target Wallet
                </label>
                <select
                  value={autoSignupConfig.targetWallet}
                  onChange={(e) => setAutoSignupConfig(prev => ({ ...prev, targetWallet: e.target.value as InternalTransferWalletType }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="MAIN_WALLET">Main / Investment Balance</option>
                  <option value="IB_COMMISSION_WALLET">IB Commission Wallet</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={handleSaveAutoSettings}
              disabled={savingSettings}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingSettings ? 'Saving...' : 'Save Signup Bonus Settings'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* MIDDLE SECTION: Internal Transfer Form */}
      <div className="bg-[#0B0F17] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/90 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
              <span>Send Funds via Internal Transfer</span>
            </h3>
            <p className="text-xs text-slate-400">Transfer funds from Admin Personal Wallet to any client wallet instantly.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
            Zero Fee Instant Transfer
          </span>
        </div>

        <form onSubmit={handleOpenConfirmModal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Field 1: Select User Live Search */}
            <div className="relative">
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                1. Select Client (Search Email / ID) *
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type email or user ID..."
                  value={userSearch}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setSelectedUser(null);
                    setShowDropdown(true);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-8 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                {selectedUser && (
                  <UserCheck className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                )}
              </div>

              {/* Live Search Dropdown */}
              {showDropdown && userSearch.length > 0 && !selectedUser && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-[#0F1420] border border-slate-700 rounded-xl max-h-56 overflow-y-auto shadow-2xl divide-y divide-slate-800">
                  {filteredUsersForSearch.length === 0 ? (
                    <div className="p-3 text-xs font-mono space-y-2">
                      <p className="text-slate-400">No pre-loaded client found in cache.</p>
                      {userSearch.includes('@') && (
                        <button
                          type="button"
                          onClick={() => {
                            const newRecipient = getEffectiveRecipient();
                            if (newRecipient) setSelectedUser(newRecipient);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg transition-colors flex items-center gap-2 font-bold"
                        >
                          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Send to account: {userSearch.trim()}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {filteredUsersForSearch.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setUserSearch(u.email);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left p-3 hover:bg-cyan-950/40 transition-colors flex items-center justify-between font-mono text-xs"
                        >
                          <div>
                            <p className="font-bold text-white">{u.email}</p>
                            <p className="text-[10px] text-slate-400">ID: {u.id} | Tier: {u.tier}</p>
                          </div>
                          <span className="text-emerald-400 font-bold">${u.principalBalance}</span>
                        </button>
                      ))}
                      {userSearch.includes('@') && !filteredUsersForSearch.some(u => u.email.toLowerCase() === userSearch.trim().toLowerCase()) && (
                        <button
                          type="button"
                          onClick={() => {
                            const newRecipient = getEffectiveRecipient();
                            if (newRecipient) setSelectedUser(newRecipient);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-colors flex items-center gap-2 font-mono text-xs font-bold"
                        >
                          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Send to typed email: {userSearch.trim()}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              {selectedUser && (
                <p className="text-[11px] text-emerald-400 mt-1 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Selected: {selectedUser.email} (${selectedUser.principalBalance})
                </p>
              )}
            </div>

            {/* Field 2: Enter Amount */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                2. Enter Transfer Amount ($) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 10, 50, 100, 7000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Field 3: Select Wallet Type */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                3. Destination Wallet *
              </label>
              <select
                value={walletType}
                onChange={(e) => setWalletType(e.target.value as InternalTransferWalletType)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="MAIN_WALLET">Main Wallet / Investment Balance</option>
                <option value="IB_COMMISSION_WALLET">IB Commission Wallet</option>
              </select>
            </div>

            {/* Field 4: Note / Reason */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                4. Note / Reason (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Welcome Bonus, Signup Gift"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:opacity-90 text-black font-extrabold text-xs font-mono transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[3]" />
              <span>TRANSFER NOW</span>
            </button>
          </div>
        </form>
      </div>

      {/* BOTTOM SECTION: Transfer History Table */}
      <div className="bg-[#0B0F17] rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Internal Transfers History Ledger</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">Total Logs: {transfers.length}</span>
        </div>

        {transfers.length === 0 ? (
          <div className="py-10 text-center text-slate-500 font-mono text-xs bg-zinc-950/50 rounded-xl border border-zinc-800/80">
            No internal transfers recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3">Date</th>
                  <th className="p-3">Transfer ID</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To Client</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Target Wallet</th>
                  <th className="p-3">Note</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-cyan-400">{t.transferId}</td>
                    <td className="p-3 text-slate-300">Admin ({t.fromUserEmail})</td>
                    <td className="p-3 text-white font-bold">{t.toUserEmail}</td>
                    <td className="p-3 font-bold text-emerald-400 text-sm">+${t.amount}</td>
                    <td className="p-3 text-slate-300 text-[11px]">
                      {t.toWalletType === 'MAIN_WALLET' ? 'Main Wallet' : 'IB Commission Wallet'}
                    </td>
                    <td className="p-3 text-slate-400 max-w-[150px] truncate">{t.note || '-'}</td>
                    <td className="p-3">
                      {t.status === 'SUCCESS' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                          SUCCESS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-[10px]">
                          REVERSED
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {t.status === 'SUCCESS' && (
                        <button
                          onClick={() => handleReverseTransfer(t.id)}
                          className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-[11px] transition-colors flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reverse</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: 2FA / Admin Password Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <div className="bg-[#0D121F] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Admin Password Security Check</h3>
                <p className="text-xs text-slate-400">Confirm authorization before disbursing funds</p>
              </div>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="text-white font-bold">{selectedUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="text-emerald-400 font-bold">${transferAmount} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="text-cyan-400">{walletType === 'MAIN_WALLET' ? 'Main Wallet' : 'IB Commission'}</span>
              </div>
              {note && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Note:</span>
                  <span className="text-slate-300">{note}</span>
                </div>
              )}
            </div>

            {passwordError && (
              <p className="text-xs font-mono text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/30">
                {passwordError}
              </p>
            )}

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Enter Admin Password *
              </label>
              <input
                type="password"
                placeholder="Enter password..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteTransfer()}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                autoFocus
              />
              <p className="text-[10px] text-slate-400 mt-1 font-mono">Requires master admin authorization password</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-xs font-mono font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-extrabold text-xs flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{actionLoading ? 'Transferring...' : 'CONFIRM & SEND'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Top Up Admin Personal Wallet */}
      {isTopupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <div className="bg-[#0D121F] border border-cyan-500/40 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsTopupModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-cyan-400" />
              <span>Top Up Admin Personal Balance</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                Amount to Add ($)
              </label>
              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleTopupAdminWallet}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs"
            >
              + ADD TO BALANCE
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
