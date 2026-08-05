import React, { useState, useEffect } from 'react';
import { User, Transaction, SystemMetrics, InvestmentPlan, IBApplication, IBMembershipPayment, UserDeposit } from '../types';
import { formatCurrency, formatPrecision } from '../lib/yieldEngine';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  Ban, 
  RefreshCw, 
  Sliders, 
  Users, 
  DollarSign, 
  Database, 
  Activity,
  Lock,
  Search,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Globe,
  MessageSquare,
  Briefcase,
  ArrowRightLeft,
  Send,
  CreditCard,
  Copy,
  Clock
} from 'lucide-react';
import { InternalTransferPanel } from './InternalTransferPanel';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: SystemMetrics;
  users: User[];
  transactions: Transaction[];
  plans: InvestmentPlan[];
  onApproveWithdrawal: (txId: string) => void;
  onRejectWithdrawal: (txId: string, reason: string) => void;
  onFreezeUser: (userId: string, reason: string) => void;
  onUnfreezeUser: (userId: string) => void;
  onUpdatePlanRate: (planId: string, newRate: number) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  metrics,
  users,
  transactions,
  plans,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onFreezeUser,
  onUnfreezeUser,
  onUpdatePlanRate
}) => {
  const ADMIN_MASTER_PASSWORD = 'haseeb@craft@007';

  const [adminTab, setAdminTab] = useState<'METRICS' | 'DEPOSITS' | 'WITHDRAWALS' | 'USERS' | 'PLANS' | 'IB_MANAGEMENT' | 'IB_APPLICATIONS' | 'INTERNAL_TRANSFER'>('DEPOSITS');
  const [userSearch, setUserSearch] = useState<string>('');
  const [depositFilter, setDepositFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [ibAppFilter, setIbAppFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [ibAppSearch, setIbAppSearch] = useState<string>('');
  const [selectedUserForFreeze, setSelectedUserForFreeze] = useState<User | null>(null);
  const [preSelectedUserForTransfer, setPreSelectedUserForTransfer] = useState<User | null>(null);
  const [freezeReason, setFreezeReason] = useState<string>('Irregular Yield Velocity Detected');
  const [ibApplications, setIbApplications] = useState<IBApplication[]>([]);
  const [ibPayments, setIbPayments] = useState<IBMembershipPayment[]>([]);
  const [deposits, setDeposits] = useState<UserDeposit[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>(users);
  const [loadingIbApps, setLoadingIbApps] = useState(false);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsersList();
  }, [users]);

  // Admin Master Password Lock State
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsPasswordVerified(false);
      setAdminPasswordInput('');
      setShowAdminPassword(false);
      setPasswordError(null);
    }
  }, [isOpen]);

  const handleVerifyAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput.trim() === ADMIN_MASTER_PASSWORD) {
      setIsPasswordVerified(true);
      setPasswordError(null);
      setAdminPasswordInput('');
    } else {
      setPasswordError('Incorrect Admin Master Password! Access Denied.');
      setIsPasswordVerified(false);
    }
  };

  const fetchIbData = async (isSilent = false) => {
    if (!isSilent) setLoadingIbApps(true);
    try {
      const [appRes, payRes] = await Promise.all([
        fetch('/api/admin/ib/applications'),
        fetch('/api/admin/ib-memberships')
      ]);
      if (appRes.ok) {
        const data = await appRes.json();
        setIbApplications(data.applications || []);
      }
      if (payRes.ok) {
        const data = await payRes.json();
        setIbPayments(data.payments || []);
      }
    } catch (err) {
      console.warn('Error fetching IB data:', err);
    } finally {
      if (!isSilent) setLoadingIbApps(false);
    }
  };

  const fetchDeposits = async (isSilent = false) => {
    if (!isSilent) setLoadingDeposits(true);
    try {
      const res = await fetch('/api/admin/deposits');
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
      }
    } catch (err) {
      console.warn('Error fetching admin deposits:', err);
    } finally {
      if (!isSilent) setLoadingDeposits(false);
    }
  };

  const fetchUsersList = async () => {
    let combinedUsers: User[] = Array.isArray(users) ? [...users] : [];
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          combinedUsers = data.users;
        }
      }
    } catch (err) {
      console.warn('Error fetching admin users:', err);
    }

    try {
      const { db } = await import('../lib/firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((docSnap) => {
        const fsData = docSnap.data();
        const fsEmail = (fsData.email || docSnap.id).toLowerCase();
        const existingIdx = combinedUsers.findIndex(
          (u) => u.id === docSnap.id || (u.email && u.email.toLowerCase() === fsEmail)
        );
        
        // Stable deterministic fallbacks instead of Math.random() to prevent React key/prop flicker
        const stableHash = (docSnap.id || fsEmail).replace(/[^a-zA-Z0-9]/g, '');
        const fallbackWallet = fsData.walletAddress || `0x${stableHash.padEnd(8, '0').substring(0, 8)}`;
        const fallbackReferral = fsData.referralCode || `DC${stableHash.toUpperCase().substring(0, 6)}`;

        if (existingIdx >= 0) {
          combinedUsers[existingIdx] = {
            ...combinedUsers[existingIdx],
            password: fsData.password || combinedUsers[existingIdx].password,
            principalBalance: fsData.principalBalance !== undefined ? String(fsData.principalBalance) : combinedUsers[existingIdx].principalBalance,
            earnedYield: fsData.earnedYield !== undefined ? String(fsData.earnedYield) : combinedUsers[existingIdx].earnedYield,
            tier: fsData.tier || combinedUsers[existingIdx].tier,
            role: fsData.role || combinedUsers[existingIdx].role,
            isFrozen: fsData.isFrozen !== undefined ? !!fsData.isFrozen : combinedUsers[existingIdx].isFrozen
          };
        } else {
          combinedUsers.push({
            id: docSnap.id,
            email: fsEmail || `${docSnap.id}@user.com`,
            password: fsData.password || undefined,
            walletAddress: fallbackWallet,
            role: fsData.role || 'USER',
            tier: fsData.tier || 'SILVER',
            referralCode: fallbackReferral,
            isFrozen: !!fsData.isFrozen,
            createdAt: fsData.createdAt || new Date().toISOString(),
            principalBalance: String(fsData.principalBalance || 0),
            earnedYield: String(fsData.earnedYield || 0),
            totalWithdrawn: String(fsData.totalWithdrawn || 0),
            is_ib: !!fsData.is_ib,
            ibStatus: fsData.ibStatus || 'NONE'
          });
        }
      });
    } catch (fsErr) {
      console.warn('Firestore user fetch sync notice:', fsErr);
    }

    setAdminUsers((prev) => {
      // Compare stringified simplified user lists to prevent unnecessary state update re-renders
      const simplifiedNew = combinedUsers.map(u => `${u.id}-${u.email}-${u.principalBalance}-${u.earnedYield}-${u.isFrozen}-${u.role}-${u.tier}`).join('|');
      const simplifiedPrev = prev.map(u => `${u.id}-${u.email}-${u.principalBalance}-${u.earnedYield}-${u.isFrozen}-${u.role}-${u.tier}`).join('|');
      if (simplifiedNew === simplifiedPrev) {
        return prev; // Return unchanged reference to avoid React re-render flicker
      }
      return combinedUsers;
    });
  };

  useEffect(() => {
    let unsubscribeFirestoreUsers: (() => void) | null = null;

    if (isOpen) {
      fetchDeposits(false);
      fetchUsersList();
      if (adminTab === 'IB_MANAGEMENT' || adminTab === 'IB_APPLICATIONS') {
        fetchIbData(false);
      }

      // Real-time Firestore subscriber for new user accounts from mobile & external devices
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ collection, onSnapshot }) => {
          unsubscribeFirestoreUsers = onSnapshot(collection(db, 'users'), () => {
            fetchUsersList();
          }, (err) => {
            console.warn('Firestore real-time users snapshot notice:', err);
          });
        });
      });

      // Auto-refresh pending deposit requests, users, and IB applications silently in background
      const interval = setInterval(() => {
        fetchDeposits(true);
        fetchUsersList();
        if (adminTab === 'IB_MANAGEMENT' || adminTab === 'IB_APPLICATIONS') {
          fetchIbData(true);
        }
      }, 5000);

      return () => {
        clearInterval(interval);
        if (unsubscribeFirestoreUsers) {
          unsubscribeFirestoreUsers();
        }
      };
    }
  }, [isOpen, adminTab]);

  const handleApproveDeposit = async (depositId: string) => {
    setActionSuccessMsg(null);
    const dep = deposits.find(d => d.id === depositId);
    try {
      const res = await fetch('/api/admin/deposit/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(data.message || 'Deposit approved and $ credited to user balance.');
        
        // Sync Firestore status to approved
        if (dep && dep.txHash) {
          try {
            const { db } = await import('../lib/firebase');
            const { collection, query, where, getDocs, updateDoc, doc } = await import('firebase/firestore');
            const depositsRef = collection(db, 'deposits');
            const q = query(depositsRef, where('transactionId', '==', dep.txHash));
            const snap = await getDocs(q);
            snap.forEach(async (dDoc) => {
              await updateDoc(doc(db, 'deposits', dDoc.id), { 
                status: 'approved', 
                approvedAt: new Date().toISOString() 
              });
            });
          } catch (fsErr) {
            console.warn('Firestore deposit approval sync notice:', fsErr);
          }
        }

        fetchDeposits();
        if (onUnfreezeUser) {
          // Trigger top-level state refresh if needed
          fetchDeposits();
        }
      } else {
        alert(data.error || 'Failed to approve deposit.');
      }
    } catch (err) {
      console.error('Error approving deposit:', err);
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    const dep = deposits.find(d => d.id === depositId);
    const promptReason = window.prompt(
      'Enter rejection reason (e.g. "Invalid Trx ID", "Payment Not Received"):',
      'Invalid Trx ID / Payment Not Received'
    );
    if (promptReason === null) return; // User cancelled

    const finalReason = promptReason.trim() || 'Transaction ID Audit Failed';
    setActionSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/deposit/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, reason: finalReason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(data.message || `Deposit rejected. Reason: ${finalReason}`);

        // Sync Firestore status to rejected
        if (dep && dep.txHash) {
          try {
            const { db } = await import('../lib/firebase');
            const { collection, query, where, getDocs, updateDoc, doc } = await import('firebase/firestore');
            const depositsRef = collection(db, 'deposits');
            const q = query(depositsRef, where('transactionId', '==', dep.txHash));
            const snap = await getDocs(q);
            snap.forEach(async (dDoc) => {
              await updateDoc(doc(db, 'deposits', dDoc.id), { 
                status: 'rejected', 
                rejectionReason: finalReason,
                rejectedAt: new Date().toISOString() 
              });
            });
          } catch (fsErr) {
            console.warn('Firestore deposit rejection sync notice:', fsErr);
          }
        }

        fetchDeposits();
      } else {
        alert(data.error || 'Failed to reject deposit.');
      }
    } catch (err) {
      console.error('Error rejecting deposit:', err);
    }
  };

  const handleCopyTx = (txId: string) => {
    navigator.clipboard.writeText(txId);
    setCopiedTxId(txId);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const handleApproveIbPayment = async (paymentId: string) => {
    setActionSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/ib-membership/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(data.message || 'Approved! $7,000 added to main balance, IB active, 20% commission triggered.');
        fetchIbData();
      }
    } catch (err) {
      console.error('Error approving $7000 IB payment:', err);
    }
  };

  const handleRejectIbPayment = async (paymentId: string) => {
    setActionSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/ib-membership/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, reason: 'Payment Audit Verification Failed' })
      });
      if (res.ok) {
        fetchIbData();
      }
    } catch (err) {
      console.error('Error rejecting $7000 IB payment:', err);
    }
  };

  const handleApproveIb = async (applicationId: string) => {
    setActionSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/ib/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });
      if (res.ok) {
        const data = await res.json();
        setActionSuccessMsg(data.message || 'IB Application approved successfully.');
        fetchIbData();
      }
    } catch (err) {
      console.error('Error approving IB application:', err);
    }
  };

  const handleRejectIb = async (applicationId: string) => {
    setActionSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/ib/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, reason: 'Credentials Audit Failed' })
      });
      if (res.ok) {
        const data = await res.json();
        setActionSuccessMsg(data.message || 'IB Application rejected.');
        fetchIbData();
      }
    } catch (err) {
      console.error('Error rejecting IB application:', err);
    }
  };

  if (!isOpen) return null;

  if (!isPasswordVerified) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
        <div className="relative w-full max-w-md bg-[#0B0F19] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-white p-6 md:p-8">
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/10 animate-pulse">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-black text-white tracking-wide">
              Admin Master Security
            </h2>
            <p className="text-xs text-amber-300/80 font-mono mt-1">
              Dollar Craft Sovereign Control Center
            </p>
          </div>

          <form onSubmit={handleVerifyAdminPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                Enter Master Admin Password
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Enter password..."
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  className={`w-full bg-[#050811] border ${
                    passwordError ? 'border-rose-500/80 ring-2 ring-rose-500/20' : 'border-amber-500/40 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
                  } rounded-xl pl-4 pr-11 py-3.5 font-mono text-sm text-white placeholder-slate-600 outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                  title={showAdminPassword ? "Hide password" : "Show password"}
                >
                  {showAdminPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <div className="mt-2.5 p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-mono font-medium flex items-center gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-black" />
              <span>Unlock Admin Panel</span>
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-500 font-mono mt-5">
            Protected by Dollar Craft System Supervisor Security
          </p>
        </div>
      </div>
    );
  }

  const pendingWithdrawals = transactions.filter((t) => t.type === 'WITHDRAWAL' && t.status === 'PENDING');
  const filteredUsers = adminUsers.filter((u) => u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.id.includes(userSearch));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md p-2 sm:p-4 w-full max-w-full">
      <div className="flex min-h-full items-center justify-center text-center p-0 sm:p-2">
        <div className="relative w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-white text-left my-auto flex flex-col max-h-[90vh]">
        
        {/* Admin Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Dollar Craft Admin Sovereign Control</span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  SYSTEM SUPERVISOR
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Global Liquidity Oversight & Fraud Audit Desk</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsPasswordVerified(false);
              setAdminPasswordInput('');
              setPasswordError(null);
            }}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Lock & Return to Security Entry"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => setAdminTab('METRICS')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all shrink-0 ${
              adminTab === 'METRICS' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            System Metrics
          </button>
          <button
            onClick={() => setAdminTab('DEPOSITS')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all flex items-center gap-2 shrink-0 ${
              adminTab === 'DEPOSITS' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Deposits (Verification)</span>
            {deposits.filter((d) => d.status === 'PENDING' || d.status === 'pending').length > 0 && (
              <span className="bg-amber-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                {deposits.filter((d) => d.status === 'PENDING' || d.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminTab('WITHDRAWALS')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all flex items-center gap-2 shrink-0 ${
              adminTab === 'WITHDRAWALS' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Pending Withdrawals</span>
            {pendingWithdrawals.length > 0 && (
              <span className="bg-amber-500 text-black font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminTab('USERS')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all ${
              adminTab === 'USERS' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            User Accounts ({adminUsers.length})
          </button>
          <button
            onClick={() => setAdminTab('IB_MANAGEMENT')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              adminTab === 'IB_MANAGEMENT' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>IB Management</span>
            {ibPayments.filter(p => p.status === 'PENDING').length > 0 && (
              <span className="bg-amber-400 text-black font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                {ibPayments.filter(p => p.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminTab('IB_APPLICATIONS')}
            className={`px-5 py-3 border-b-2 font-semibold transition-all flex items-center gap-2 shrink-0 ${
              adminTab === 'IB_APPLICATIONS' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10 font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>IB Applications</span>
            {ibApplications.filter(a => a.status === 'PENDING').length > 0 && (
              <span className="bg-cyan-500 text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                {ibApplications.filter(a => a.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setPreSelectedUserForTransfer(null);
              setAdminTab('INTERNAL_TRANSFER');
            }}
            className={`px-5 py-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              adminTab === 'INTERNAL_TRANSFER' ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10' : 'border-transparent text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Internal Transfer</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {adminTab === 'DEPOSITS' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Deposit Audit & Verification Queue</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Review user bank transaction IDs before manual approval and balance crediting.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setDepositFilter(st)}
                      className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        depositFilter === st
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {st} {st === 'PENDING' && `(${deposits.filter(d => d.status === 'PENDING' || d.status === 'pending').length})`}
                    </button>
                  ))}
                  <button
                    onClick={fetchDeposits}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
                    title="Refresh Deposits"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingDeposits ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    {actionSuccessMsg}
                  </span>
                  <button onClick={() => setActionSuccessMsg(null)} className="text-zinc-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {deposits.filter(d => {
                if (depositFilter === 'ALL') return true;
                if (depositFilter === 'PENDING') return d.status === 'PENDING' || d.status === 'pending';
                if (depositFilter === 'APPROVED') return d.status === 'APPROVED' || d.status === 'approved' || d.status === 'ACTIVE';
                if (depositFilter === 'REJECTED') return d.status === 'REJECTED' || d.status === 'rejected';
                return true;
              }).length === 0 ? (
                <div className="p-10 text-center bg-zinc-950/50 rounded-xl border border-zinc-800 text-zinc-500 font-mono text-xs space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                  <p className="font-bold text-zinc-400">No {depositFilter.toLowerCase()} deposit requests found.</p>
                  <p className="text-zinc-600">Deposits submitted by users with bank reference IDs will appear here for manual verification.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deposits
                    .filter(d => {
                      if (depositFilter === 'ALL') return true;
                      if (depositFilter === 'PENDING') return d.status === 'PENDING' || d.status === 'pending';
                      if (depositFilter === 'APPROVED') return d.status === 'APPROVED' || d.status === 'approved' || d.status === 'ACTIVE';
                      if (depositFilter === 'REJECTED') return d.status === 'REJECTED' || d.status === 'rejected';
                      return true;
                    })
                    .map((dep) => {
                      const isPending = dep.status === 'PENDING' || dep.status === 'pending';
                      const isApproved = dep.status === 'APPROVED' || dep.status === 'approved' || dep.status === 'ACTIVE';

                      return (
                        <div
                          key={dep.id}
                          className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/90 font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-all shadow-md"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-base">${dep.principalAmount ? Number(dep.principalAmount).toFixed(2) : '0.00'} USD</span>
                              <span className="bg-zinc-800 text-cyan-300 font-semibold px-2 py-0.5 rounded text-[11px] border border-zinc-700">
                                {dep.planName || 'Standard Plan'} ({dep.dailyYieldPercent}% daily)
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                  isPending
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : isApproved
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                }`}
                              >
                                {dep.status}
                              </span>
                            </div>

                            <div className="text-zinc-400 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1">
                              <div>
                                <span className="text-zinc-500">User Email:</span>{' '}
                                <span className="text-zinc-200 font-bold">{dep.userEmail || dep.userId}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500">Bank Gateway:</span>{' '}
                                <span className="text-cyan-400 font-bold">{dep.cryptoNetwork || 'Dubai Islamic Bank'}</span>
                              </div>
                              <div className="sm:col-span-2 flex items-center gap-2">
                                <span className="text-zinc-500">Bank TXID / Ref:</span>{' '}
                                <span className="text-amber-300 font-black tracking-wider bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                  {dep.txHash}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTx(dep.txHash || '')}
                                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
                                  title="Copy Transaction ID"
                                >
                                  {copiedTxId === dep.txHash ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <div className="sm:col-span-2 text-zinc-500 text-[10px] pt-0.5">
                                Submitted: {new Date(dep.startTime || dep.createdAt || Date.now()).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {isPending && (
                            <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                              <button
                                onClick={() => handleApproveDeposit(dep.id)}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Approve & Credit</span>
                              </button>
                              <button
                                onClick={() => handleRejectDeposit(dep.id)}
                                className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Ban className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {adminTab === 'METRICS' && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-400 block mb-1">Total System Liquidity</span>
                  <span className="text-xl font-mono font-bold text-emerald-400">{formatCurrency(metrics?.systemLiquidity || '98637065765.00')}</span>
                  <span className="text-[10px] text-zinc-500 block mt-1">Reserve Vault Capital</span>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-400 block mb-1">Total Deposited</span>
                  <span className="text-xl font-mono font-bold text-zinc-100">{formatCurrency(metrics.totalDeposited)}</span>
                  <span className="text-[10px] text-zinc-500 block mt-1">{metrics.activeCyclesCount} Active Contracts</span>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-400 block mb-1">Total Paid Out</span>
                  <span className="text-xl font-mono font-bold text-blue-400">{formatCurrency(metrics.totalPaidOut)}</span>
                  <span className="text-[10px] text-zinc-500 block mt-1">Processed Withdrawals</span>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-400 block mb-1">Yield Mathematical Health</span>
                  <span className="text-xl font-mono font-bold text-amber-400">{metrics.yieldHealthScore}%</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">Zero Rounding Drift</span>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'WITHDRAWALS' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-200">Pending Withdrawal Queue</h4>
              {pendingWithdrawals.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950/50 rounded-xl border border-zinc-800 text-zinc-500 font-mono text-xs">
                  No pending withdrawal requests needing manual approval.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingWithdrawals.map((tx) => (
                    <div key={tx.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">${tx.amount} USD</span>
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">{tx.cryptoNetwork}</span>
                          {tx.flaggedByFraud && (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px]">
                              FLAGGED FRAUD
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400 text-[11px]">User: {tx.userEmail || tx.userId}</p>
                        <p className="text-zinc-500 text-[10px] break-all">Destination: {tx.destinationAddr}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => onRejectWithdrawal(tx.id, 'Risk Audit Rejection')}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs transition-colors flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => onApproveWithdrawal(tx.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Disburse</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {adminTab === 'USERS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search users by email or ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto bg-zinc-950 rounded-xl border border-zinc-800">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="p-3">User Email</th>
                      <th className="p-3">Password</th>
                      <th className="p-3">Role / Tier</th>
                      <th className="p-3">Principal</th>
                      <th className="p-3">Earned Yield</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="p-3 font-semibold text-white">{u.email}</td>
                        <td className="p-3 font-mono text-amber-300 font-bold bg-zinc-900/60 rounded select-all">
                          {u.password ? u.password : <span className="text-zinc-600 italic font-normal">OAuth / Not Set</span>}
                        </td>
                        <td className="p-3 text-amber-400">{u.role} ({u.tier})</td>
                        <td className="p-3">${u.principalBalance}</td>
                        <td className="p-3 text-emerald-400">${formatPrecision(u.earnedYield, 4)}</td>
                        <td className="p-3">
                          {u.isFrozen ? (
                            <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                              FROZEN
                            </span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setPreSelectedUserForTransfer(u);
                              setAdminTab('INTERNAL_TRANSFER');
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>$ Transfer</span>
                          </button>
                          {u.isFrozen ? (
                            <button
                              onClick={() => onUnfreezeUser(u.id)}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-[11px] font-semibold"
                            >
                              Unfreeze
                            </button>
                          ) : (
                            <button
                              onClick={() => onFreezeUser(u.id, freezeReason)}
                              className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold border border-red-500/30"
                            >
                              Freeze
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminTab === 'IB_MANAGEMENT' && (
            <div className="space-y-6">
              {actionSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    {actionSuccessMsg}
                  </span>
                  <button onClick={() => setActionSuccessMsg(null)} className="text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* SECTION A: $7,000 IB MEMBERSHIP PAYMENTS REVIEW */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <span>$7,000 IB Membership Activation Requests</span>
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Approving credits $7,000 to user's main balance, activates IB partner status, and triggers $1,400 (20%) direct commission to upline IB.
                    </p>
                  </div>
                  <button
                    onClick={fetchIbData}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingIbApps ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {ibPayments.length === 0 ? (
                  <div className="p-6 text-center bg-zinc-950/50 rounded-xl border border-zinc-800 text-zinc-500 font-mono text-xs">
                    No pending $7,000 IB Membership payments found in queue.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ibPayments.map((pay) => (
                      <div key={pay.id} className="bg-zinc-950 p-4 rounded-2xl border border-amber-500/30 font-mono text-xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm">{pay.userName}</span>
                              <span className="text-cyan-400">({pay.userEmail})</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-black">
                                $7,000.00 USDT
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pay.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                pay.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}>
                                {pay.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500">Submitted: {new Date(pay.createdAt).toLocaleString()}</span>
                          </div>

                          {pay.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRejectIbPayment(pay.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                              <button
                                onClick={() => handleApproveIbPayment(pay.id)}
                                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-black font-extrabold text-xs transition-all flex items-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Approve ($7k Credit + IB + $1400 Comm)</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-300">
                          <div>
                            <span className="text-zinc-500">Payment Channel:</span>{' '}
                            <strong className="text-amber-400">{pay.paymentMethod}</strong>
                          </div>
                          <div className="truncate">
                            <span className="text-zinc-500">TxHash/Proof:</span>{' '}
                            <strong className="text-cyan-300">{pay.proofTxHash || 'Unspecified'}</strong>
                          </div>
                          <div className="truncate">
                            <span className="text-zinc-500">User Wallet:</span>{' '}
                            <strong className="text-zinc-200">{pay.walletAddress || 'Unspecified'}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION B: GENERAL IB APPLICATIONS REVIEW */}
              <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <span>General IB Credentials Applications</span>
                    </h4>
                    <p className="text-xs text-zinc-400 font-mono">Review applicant background and grant 20% IB Partner status.</p>
                  </div>
                </div>

              {ibApplications.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950/50 rounded-xl border border-zinc-800 text-zinc-500 font-mono text-xs">
                  No IB applications found in queue.
                </div>
              ) : (
                <div className="space-y-3">
                  {ibApplications.map((appItem) => (
                    <div key={appItem.id} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 font-mono text-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{appItem.userName}</span>
                            <span className="text-cyan-400">({appItem.userEmail})</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              appItem.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                              appItem.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              {appItem.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500">Submitted: {new Date(appItem.createdAt).toLocaleString()}</span>
                        </div>

                        {appItem.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRejectIb(appItem.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs transition-colors flex items-center gap-1"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={() => handleApproveIb(appItem.id)}
                              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-extrabold text-xs transition-all flex items-center gap-1 shadow-md shadow-cyan-500/20"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Approve IB (20% Rate)</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-zinc-300">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Phone: {appItem.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Country: {appItem.country}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Contact: {appItem.telegramWhatsapp}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                        <span className="text-zinc-500 font-bold uppercase block text-[9px] mb-1">Network & Brokerage Experience:</span>
                        <p className="leading-relaxed font-sans text-xs text-zinc-300">{appItem.experience}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          )}

          {adminTab === 'IB_APPLICATIONS' && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    <span>IB Applications Log (New & Existing Users)</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                    Real-time verification queue for IB partner program submissions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search application..."
                      value={ibAppSearch}
                      onChange={(e) => setIbAppSearch(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono w-44"
                    />
                  </div>

                  {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setIbAppFilter(st)}
                      className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        ibAppFilter === st
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {st} {st === 'PENDING' && `(${ibApplications.filter(a => a.status === 'PENDING').length})`}
                    </button>
                  ))}

                  <button
                    onClick={fetchIbData}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
                    title="Refresh Applications"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingIbApps ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    {actionSuccessMsg}
                  </span>
                  <button onClick={() => setActionSuccessMsg(null)} className="text-zinc-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {ibApplications
                .filter(a => {
                  if (ibAppFilter !== 'ALL' && a.status !== ibAppFilter) return false;
                  if (ibAppSearch.trim()) {
                    const q = ibAppSearch.toLowerCase();
                    return (
                      a.userName.toLowerCase().includes(q) ||
                      a.userEmail.toLowerCase().includes(q) ||
                      a.phone.toLowerCase().includes(q) ||
                      a.country.toLowerCase().includes(q)
                    );
                  }
                  return true;
                }).length === 0 ? (
                <div className="p-10 text-center bg-zinc-950/50 rounded-xl border border-zinc-800 text-zinc-500 font-mono text-xs space-y-2">
                  <Briefcase className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                  <p className="font-bold text-zinc-400">No IB applications found.</p>
                  <p className="text-zinc-600">Applications submitted by users for the IB Partner program will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ibApplications
                    .filter(a => {
                      if (ibAppFilter !== 'ALL' && a.status !== ibAppFilter) return false;
                      if (ibAppSearch.trim()) {
                        const q = ibAppSearch.toLowerCase();
                        return (
                          a.userName.toLowerCase().includes(q) ||
                          a.userEmail.toLowerCase().includes(q) ||
                          a.phone.toLowerCase().includes(q) ||
                          a.country.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((appItem) => (
                      <div key={appItem.id} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 font-mono text-xs space-y-3 hover:border-zinc-700 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm">{appItem.userName}</span>
                              <span className="text-cyan-400">({appItem.userEmail})</span>
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                appItem.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                appItem.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}>
                                {appItem.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500">Submitted: {new Date(appItem.createdAt).toLocaleString()}</span>
                          </div>

                          {appItem.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRejectIb(appItem.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                              <button
                                onClick={() => handleApproveIb(appItem.id)}
                                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-black font-extrabold text-xs transition-all flex items-center gap-1 shadow-md shadow-cyan-500/20 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Approve IB Application</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-zinc-300">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>Phone: <strong className="text-zinc-200">{appItem.phone}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>Country: <strong className="text-zinc-200">{appItem.country}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>Contact: <strong className="text-cyan-300">{appItem.telegramWhatsapp}</strong></span>
                          </div>
                        </div>

                        {appItem.walletAddress && (
                          <div className="text-[11px] text-zinc-400 truncate">
                            <span>USDT Payout Wallet:</span> <strong className="text-zinc-200 font-mono">{appItem.walletAddress}</strong>
                          </div>
                        )}

                        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                          <span className="text-zinc-500 font-bold uppercase block text-[9px] mb-1">Network & Experience:</span>
                          <p className="leading-relaxed font-sans text-xs text-zinc-300">{appItem.experience}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {adminTab === 'INTERNAL_TRANSFER' && (
            <InternalTransferPanel 
              users={users} 
              preSelectedUser={preSelectedUserForTransfer}
            />
          )}
        </div>

      </div>
      </div>
    </div>
  );
};
