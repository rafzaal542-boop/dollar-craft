import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, UserDeposit, Transaction, ReferralReward, SystemMetrics, InvestmentPlan } from './types';
import { BigNumber, formatCurrency, formatPrecision } from './lib/yieldEngine';
import { Header } from './components/Header';
import { LiveBalanceTicker } from './components/LiveBalanceTicker';
import { ActiveCyclesTable } from './components/ActiveCyclesTable';
import { DepositModal } from './components/DepositModal';
import { WithdrawalModal } from './components/WithdrawalModal';
import { AdminPanel } from './components/AdminPanel';
import { MasterPlanModal } from './components/MasterPlanModal';
import { ReferralSystem } from './components/ReferralSystem';
import { AuthModal } from './components/AuthModal';
import { GmailIntegrationModal } from './components/GmailIntegrationModal';
import { DollarCraftDashboard } from './components/DollarCraftDashboard';
import { CustomerDashboardView } from './components/CustomerDashboardView';
import { IBApplicationModal } from './components/IBApplicationModal';
import { IBMembershipModal } from './components/IBMembershipModal';
import { IBDashboardView } from './components/IBDashboardView';
import { InternalTransferPanel } from './components/InternalTransferPanel';
import { AboutUsModal } from './components/AboutUsModal';
import { AboutUsView } from './components/AboutUsView';
import { ServicesModal } from './components/ServicesModal';
import { ContactModal } from './components/ContactModal';
import { IBPartnerFormModal } from './components/IBPartnerFormModal';
import { LegalModal } from './components/LegalModal';
import { LiveEarningsModal } from './components/LiveEarningsModal';
import { WelcomeIntro } from './components/WelcomeIntro';
import { Logo } from './components/Logo';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  ShieldCheck, 
  Zap,
  BarChart2,
  RefreshCw,
  Lock,
  Layers,
  History,
  Info
} from 'lucide-react';

// Central API Base URL Configuration for Production Backend
const API_BASE_URL = 'https://dollar-craft-cl1t803tw-dollar-craft.vercel.app';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [deposits, setDeposits] = useState<UserDeposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referrals, setReferrals] = useState<ReferralReward[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Real-time calculation variables for UI tick rate
  const [microYieldPerSecond, setMicroYieldPerSecond] = useState<string>('0');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  // Theme State (Dark Mode vs High-Contrast Light Mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('dollarcraft_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('dollarcraft_theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('customer_dashboard');
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [selectedPlanForDeposit, setSelectedPlanForDeposit] = useState<string>('plan-standard');
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isMasterPlanOpen, setIsMasterPlanOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(true);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };
  const [isGmailModalOpen, setIsGmailModalOpen] = useState<boolean>(false);
  const [isIBApplyOpen, setIsIBApplyOpen] = useState<boolean>(false);
  const [isIBMembershipModalOpen, setIsIBMembershipModalOpen] = useState<boolean>(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState<boolean>(false);
  const [isServicesOpen, setIsServicesOpen] = useState<boolean>(false);
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);
  const [isIBPartnerFormOpen, setIsIBPartnerFormOpen] = useState<boolean>(false);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>('privacy');
  const [isLiveEarningsOpen, setIsLiveEarningsOpen] = useState<boolean>(false);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState<boolean>(true);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('dollarcraft_active_user');
      setUser(null);
      setDeposits([]);
      setTransactions([]);
      setReferrals([]);
      setIsAuthOpen(true);
      setActiveTab('pro_dashboard');

      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
        const { logoutFirebase } = await import('./lib/firebase');
        await logoutFirebase();
      } catch (e) {
        console.warn('Logout API notice:', e);
      }

      await fetchState(true);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const hasCheckedAuthRef = React.useRef(false);

  // Fetch initial dashboard state
  const fetchState = async (isLogout = false) => {
    try {
      if (isLogout) {
        setUser(null);
        localStorage.removeItem('dollarcraft_active_user');
        setDeposits([]);
        setTransactions([]);
        setReferrals([]);
      }

      const local = localStorage.getItem('dollarcraft_active_user');
      let savedUserEmail = user?.email || '';
      let savedUserId = user?.id || '';

      if (!isLogout && local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed?.email) savedUserEmail = parsed.email;
          if (parsed?.id) savedUserId = parsed.id;
        } catch (e) {}
      }

      if (savedUserEmail) {
        savedUserEmail = savedUserEmail.trim().toLowerCase();
      }

      const headers: Record<string, string> = {};
      if (savedUserEmail) headers['x-user-email'] = savedUserEmail;
      if (savedUserId) headers['x-user-id'] = savedUserId;

      const q = new URLSearchParams();
      if (savedUserEmail) q.set('userEmail', savedUserEmail);
      if (savedUserId) q.set('userId', savedUserId);

      const res = await fetch(`${API_BASE_URL}/api/dashboard/state?${q.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (!isLogout && data.user) {
          setUser(data.user);
          localStorage.setItem('dollarcraft_active_user', JSON.stringify(data.user));
        } else if (isLogout) {
          setUser(null);
          localStorage.removeItem('dollarcraft_active_user');
        }

        if (!hasCheckedAuthRef.current) {
          hasCheckedAuthRef.current = true;
          if (!data.user && !savedUserEmail) {
            setIsAuthOpen(true);
          } else if (data.user) {
            setIsAuthOpen(false);
            setActiveTab('customer_dashboard');
          }
        }
        setDeposits(isLogout ? [] : (data.deposits || []));
        setTransactions(isLogout ? [] : (data.transactions || []));
        setReferrals(isLogout ? [] : (data.referrals || []));
        setPlans(data.plans || []);
        setMetrics(data.metrics || null);
      }

      const usersRes = await fetch(`${API_BASE_URL}/api/admin/users`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
      }
    } catch (err) {
      console.warn('Dashboard state sync notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(() => {
      fetchState();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Connect to SSE Yield Stream for Sub-Second Live Ticking
  useEffect(() => {
    const local = localStorage.getItem('dollarcraft_active_user');
    let savedEmail = user?.email || '';
    let savedId = user?.id || '';
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed?.email) savedEmail = parsed.email;
        if (parsed?.id) savedId = parsed.id;
      } catch (e) {}
    }

    const q = new URLSearchParams();
    if (savedEmail) q.set('userEmail', savedEmail.trim().toLowerCase());
    if (savedId) q.set('userId', savedId);

    const eventSource = new EventSource(`${API_BASE_URL}/api/yield/stream?${q.toString()}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data) return;

        setUser((prev) => {
          if (!prev) return prev;
          const currentEmail = (prev.email || '').trim().toLowerCase();
          const targetEmail = (data.userEmail || '').trim().toLowerCase();

          if (
            targetEmail &&
            currentEmail &&
            targetEmail !== currentEmail &&
            data.userId !== prev.id
          ) {
            return prev;
          }

          const prevBalBN = new BigNumber(prev.principalBalance || '0');
          const incomingBalBN = new BigNumber(data.principalBalance !== undefined ? data.principalBalance : '0');
          const finalBalBN = BigNumber.max(prevBalBN, incomingBalBN);

          const prevYieldBN = new BigNumber(prev.earnedYield || '0');
          const incomingYieldBN = new BigNumber(data.earnedYield !== undefined ? data.earnedYield : '0');
          const finalYieldBN = BigNumber.max(prevYieldBN, incomingYieldBN);

          return {
            ...prev,
            principalBalance: finalBalBN.toFixed(18),
            earnedYield: finalYieldBN.toFixed(18)
          };
        });

        if (data.microYieldPerSecond) {
          setMicroYieldPerSecond(data.microYieldPerSecond);
        }

        // Update active cycles earned yield
        if (data.activeCycles && Array.isArray(data.activeCycles)) {
          setDeposits((prevDeposits) =>
            prevDeposits.map((dep) => {
              if (!dep) return dep;
              const match = data.activeCycles.find((c: any) => c && c.id === dep.id);
              if (match) {
                return {
                  ...dep,
                  earnedYield: match.earnedYield,
                  progressPercent: match.progressPercent
                };
              }
              return dep;
            })
          );
        }
      } catch (e) {
        console.error('Error parsing SSE event:', e);
      }
    };

    eventSource.onerror = () => {
      setIsLiveStreaming(false);
    };

    return () => {
      eventSource.close();
    };
  }, [user?.email, user?.id]);

  // Handlers
  const handleCreateDeposit = async (planId: string, amount: number, network: string, txHash: string) => {
    try {
      // Check for duplicate Transaction ID in Firestore first
      try {
        const { db, auth } = await import('./lib/firebase');
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        if (auth.currentUser && txHash.trim()) {
          const depositsRef = collection(db, 'deposits');
          const q = query(
            depositsRef,
            where('transactionId', '==', txHash.trim()),
            where('status', 'in', ['pending', 'approved', 'PENDING', 'APPROVED', 'ACTIVE'])
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            return {
              success: false,
              error: 'This Transaction ID is already in use. Please enter the correct one from your bank receipt.'
            };
          }
        }
      } catch (checkErr) {
        console.warn('Firestore duplicate pre-check notice:', checkErr);
      }

      const res = await fetch(`${API_BASE_URL}/api/deposit/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, amount, network, txHash })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Deposit request failed.' };
      }

      // Sync deposit document to Firestore if Firebase user exists
      try {
        const { db, auth } = await import('./lib/firebase');
        const { collection, addDoc } = await import('firebase/firestore');
        if (auth.currentUser) {
          await addDoc(collection(db, 'deposits'), {
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email || user?.email || '',
            amount,
            transactionId: txHash.trim(),
            bankName: 'Mashreq Bank',
            planId,
            status: 'pending',
            createdAt: new Date().toISOString()
          });
        }
      } catch (fsErr) {
        console.warn('Firestore deposit sync notice:', fsErr);
      }

      await fetchState();
      return { success: true, message: data.message };
    } catch (err: any) {
      console.warn('Deposit request notice:', err);
      return { 
        success: false, 
        error: err.message === 'Failed to fetch' 
          ? 'Network connection issue. Please check your internet connection and try again.' 
          : (err.message || 'Server error occurred.') 
      };
    }
  };

  const handleSubmitWithdrawal = async (amount: number, destinationAddr: string, network: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/withdrawal/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ 
          amount, 
          destinationAddr, 
          network,
          userId: user?.id,
          userEmail: user?.email
        })
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch (parseErr) {
        console.warn('Non-JSON response from withdrawal API:', parseErr);
        return { success: false, message: 'Server returned unexpected format. Please try again.' };
      }

      if (res.ok && data.success) {
        await fetchState();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Withdrawal request failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error processing withdrawal.' };
    }
  };

  const handleApproveWithdrawal = async (txId: string) => {
    await fetch(`${API_BASE_URL}/api/admin/withdrawal/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId })
    });
    fetchState();
  };

  const handleRejectWithdrawal = async (txId: string, reason: string) => {
    await fetch(`${API_BASE_URL}/api/admin/withdrawal/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId, reason })
    });
    fetchState();
  };

  const handleFreezeUser = async (userId: string, reason: string) => {
    await fetch(`${API_BASE_URL}/api/admin/user/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason })
    });
    fetchState();
  };

  const handleUnfreezeUser = async (userId: string) => {
    await fetch(`${API_BASE_URL}/api/admin/user/unfreeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    fetchState();
  };

  if (showWelcomeIntro) {
    return <WelcomeIntro onComplete={() => setShowWelcomeIntro(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020611] flex flex-col items-center justify-center text-white font-mono">
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 animate-pulse">
          <Zap className="w-5 h-5 text-cyan-400" />
        </div>
        <p className="text-xs font-bold text-slate-300 tracking-wider uppercase">Loading Ecosystem...</p>
      </div>
    );
  }

  const activeDeposits = deposits.filter((d) => d.status === 'ACTIVE');

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden font-sans transition-colors duration-300 selection:bg-cyan-500 selection:text-black ${
      theme === 'light' ? 'light bg-slate-50 text-slate-900' : 'dark bg-[#07090E] text-slate-100'
    }`}>

      {/* Top Header Navigation */}
      <Header
        user={user}
        onOpenDeposit={() => setIsDepositOpen(true)}
        onOpenWithdrawal={() => setIsWithdrawalOpen(true)}
        onOpenAdmin={() => {
          if (user?.email?.toLowerCase() === 'dollarcraft3@gmail.com' || user?.role === 'ADMIN') {
            setIsAdminOpen(true);
          } else {
            alert('Access Denied: Only the authorized sovereign admin account (dollarcraft3@gmail.com) can access the Admin Control Panel.');
          }
        }}
        onOpenMasterPlan={() => setIsMasterPlanOpen(true)}
        onOpenAuth={handleOpenAuth}
        onOpenGmailModal={() => setIsGmailModalOpen(true)}
        onOpenInternalTransfer={() => setActiveTab('internal_transfer')}
        onOpenAboutUs={() => setIsAboutUsOpen(true)}
        onOpenServices={() => setIsServicesOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenIBPartner={() => setIsIBPartnerFormOpen(true)}
        onOpenLiveEarnings={() => setIsLiveEarningsOpen(true)}
        onReplayIntro={() => setShowWelcomeIntro(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Account Frozen Alert Banner */}
      {user?.isFrozen && (
        <div className="bg-red-500/10 border-b border-red-500/30 p-3 text-red-400 font-mono text-xs flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span>ACCOUNT FROZEN BY SECURITY DESK: {user.frozenReason || 'Math verification audit pending.'}</span>
        </div>
      )}

      {/* Main Dashboard Layout */}
      <main className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8 overflow-x-hidden">
        
        {(activeTab === 'pro_dashboard' || activeTab === 'dashboard') && (
          <DollarCraftDashboard
            user={user}
            activeTab={activeTab}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawalOpen(true)}
            onOpenIB={() => setActiveTab('ib_dashboard')}
            onOpenAboutUs={() => setIsAboutUsOpen(true)}
            onOpenServices={() => setIsServicesOpen(true)}
            onOpenContact={() => setIsContactOpen(true)}
            onOpenIBPartner={() => setIsIBPartnerFormOpen(true)}
            onOpenMasterPlan={() => setIsMasterPlanOpen(true)}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeTab === 'customer_dashboard' && (
          <CustomerDashboardView
            currentUser={user}
            deposits={deposits}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawalOpen(true)}
            onOpenMasterPlan={() => setIsMasterPlanOpen(true)}
            onOpenAuth={handleOpenAuth}
            onRefreshData={fetchState}
          />
        )}

        {activeTab === 'ib_dashboard' && (
          <IBDashboardView
            currentUser={user}
            onOpenApplyModal={() => setIsIBMembershipModalOpen(true)}
            onOpenIBPartner={() => setIsIBPartnerFormOpen(true)}
            onRefreshUser={fetchState}
          />
        )}

        {(activeTab === 'about_us' || activeTab === 'about') && (
          <AboutUsView
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenIBPartner={() => setIsIBPartnerFormOpen(true)}
          />
        )}

        {activeTab === 'cycles' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Investment Yield Cycles</h2>
                <p className="text-xs text-zinc-400">Lock principal into defined interest contracts with sub-second yield streaming.</p>
              </div>
              <button
                onClick={() => setIsDepositOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs"
              >
                Craft New Cycle
              </button>
            </div>

            <ActiveCyclesTable
              deposits={deposits}
              onOpenDepositModal={() => setIsDepositOpen(true)}
            />
          </div>
        )}

        {activeTab === 'referrals' && (
          <ReferralSystem user={user} rewards={referrals} />
        )}

        {activeTab === 'history' && (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-white">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <span>Transaction & Yield Audit Ledger</span>
            </h3>

            {transactions.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs font-mono bg-zinc-950 rounded-xl border border-zinc-800">
                No recorded transactions in ledger.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800 pb-2">
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Network / Details</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-white">${tx.amount}</td>
                        <td className="py-3 px-3 text-zinc-400">
                          {tx.cryptoNetwork || 'System Ledger'} {tx.txHash && `(${tx.txHash.substring(0, 8)}...)`}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            tx.status === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-zinc-500">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'internal_transfer' && (
          <InternalTransferPanel
            users={allUsers.length > 0 ? allUsers : (user ? [user] : [])}
            onRefreshData={fetchState}
          />
        )}

      </main>

      {/* FOOTER SECTION WITH COUNTRY FLAGS & QUICK LINKS */}
      <footer className="mt-16 bg-[#05070B] border-t border-slate-800/90 text-slate-400 font-sans py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Bottom Copyright & Disclaimer */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <p>© 2018 Dollar Craft. All Rights Reserved.</p>
            <div className="flex items-center gap-4 text-[11px]">
              <button 
                onClick={() => { setLegalTab('privacy'); setIsLegalOpen(true); }} 
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button 
                onClick={() => { setLegalTab('terms'); setIsLegalOpen(true); }} 
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Modals */}
      <DepositModal
        plans={plans}
        isOpen={isDepositOpen}
        initialPlanId={selectedPlanForDeposit}
        currentUser={user}
        onClose={() => {
          setIsDepositOpen(false);
          setIsMasterPlanOpen(true);
        }}
        onSubmitDeposit={async (planId, amount, network, txHash) => {
          return await handleCreateDeposit(planId, amount, network, txHash);
        }}
      />

      <WithdrawalModal
        isOpen={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
        availableBalance={user ? user.earnedYield || '0' : '0'}
        earnedYield={user?.earnedYield || '0'}
        onSubmitWithdrawal={handleSubmitWithdrawal}
      />

      {metrics && (user?.email?.toLowerCase() === 'dollarcraft3@gmail.com' || user?.role === 'ADMIN') && (
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          metrics={metrics}
          users={allUsers.length > 0 ? allUsers : (user ? [user] : [])}
          transactions={transactions}
          plans={plans}
          onApproveWithdrawal={handleApproveWithdrawal}
          onRejectWithdrawal={handleRejectWithdrawal}
          onFreezeUser={handleFreezeUser}
          onUnfreezeUser={handleUnfreezeUser}
          onUpdatePlanRate={(planId, newRate) => {
            setPlans(plans.map(p => p.id === planId ? { ...p, dailyYieldPercent: newRate } : p));
          }}
        />
      )}

      <MasterPlanModal
        isOpen={isMasterPlanOpen}
        onClose={() => setIsMasterPlanOpen(false)}
        plans={plans}
        currentUser={user}
        onSelectPlan={(plan) => {
          if (plan?.id) {
            setSelectedPlanForDeposit(plan.id);
          }
          setIsMasterPlanOpen(false);
          setIsDepositOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={user}
        initialMode={authInitialMode}
        onLoginSuccess={(u) => {
          setUser(u);
          fetchState();
          setActiveTab('customer_dashboard');
          setIsLiveEarningsOpen(false);
        }}
        onLogout={handleLogout}
      />

      <LiveEarningsModal
        isOpen={isLiveEarningsOpen}
        onClose={() => setIsLiveEarningsOpen(false)}
        user={user}
        onOpenMasterPlan={() => {
          setIsLiveEarningsOpen(false);
          setIsMasterPlanOpen(true);
        }}
      />

      <GmailIntegrationModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        currentUser={user}
      />

      <IBApplicationModal
        isOpen={isIBApplyOpen}
        onClose={() => setIsIBApplyOpen(false)}
        currentUser={user}
        onSuccess={() => {
          fetchState();
        }}
      />

      <IBMembershipModal
        isOpen={isIBMembershipModalOpen}
        onClose={() => setIsIBMembershipModalOpen(false)}
        currentUser={user}
        onSuccess={() => {
          fetchState();
        }}
      />

      <AboutUsModal
        isOpen={isAboutUsOpen}
        onClose={() => setIsAboutUsOpen(false)}
        onOpenIBPartner={() => setIsIBPartnerFormOpen(true)}
      />

      <ServicesModal
        isOpen={isServicesOpen}
        onClose={() => setIsServicesOpen(false)}
        onOpenDeposit={() => setIsDepositOpen(true)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <IBPartnerFormModal
        isOpen={isIBPartnerFormOpen}
        onClose={() => setIsIBPartnerFormOpen(false)}
        currentUser={user}
      />

      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        defaultTab={legalTab}
      />

    </div>
  );
}