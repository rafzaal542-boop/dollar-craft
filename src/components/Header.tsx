import React, { useState, useEffect } from 'react';
import { User, UserNotification } from '../types';
import { Logo } from './Logo';
import { CinematicButton } from './ui/CinematicButton';
import { 
  PlusCircle, 
  ArrowDownLeft, 
  SlidersHorizontal, 
  BookOpen, 
  Zap,
  Sparkles,
  Layers,
  Users,
  History,
  Mail,
  Sun,
  Moon,
  Building2,
  ArrowRightLeft,
  Bell,
  BellRing,
  CheckCircle2,
  X,
  TrendingUp,
  ChevronDown,
  LogOut,
  Copy,
  ShieldCheck,
  Check,
  LogIn,
  User as UserIcon,
  Settings,
  ChevronRight,
  ArrowLeft,
  Cpu
} from 'lucide-react';
import { LiveEarningsModal } from './LiveEarningsModal';

interface HeaderProps {
  user?: User | null;
  onOpenDeposit: () => void;
  onOpenWithdrawal: () => void;
  onOpenAdmin: () => void;
  onOpenMasterPlan: () => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onOpenGmailModal: () => void;
  onOpenInternalTransfer?: () => void;
  onOpenAboutUs?: () => void;
  onOpenServices?: () => void;
  onOpenContact?: () => void;
  onOpenIBPartner?: () => void;
  onOpenLiveEarnings?: () => void;
  onLogout?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onReplayIntro?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenDeposit,
  onOpenWithdrawal,
  onOpenAdmin,
  onOpenMasterPlan,
  onOpenAuth,
  onOpenGmailModal,
  onOpenInternalTransfer,
  onOpenAboutUs,
  onOpenServices,
  onOpenContact,
  onOpenIBPartner,
  onOpenLiveEarnings,
  onLogout,
  activeTab,
  setActiveTab,
  theme = 'dark',
  onToggleTheme,
  onReplayIntro
}) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [showNotifPopover, setShowNotifPopover] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isLiveEarningsOpen, setIsLiveEarningsOpen] = useState<boolean>(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/user/notifications');
      if (res && res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch {
      // Ignore transient network/polling errors gracefully
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 4000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const handleMarkRead = async () => {
    try {
      await fetch('/api/user/notifications/read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <header className="sticky top-0 z-40 bg-[#07090E]/90 backdrop-blur-md border-b border-slate-800/90 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <button 
            onClick={() => setActiveTab('pro_dashboard')}
            className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity cursor-pointer text-left"
          >
            <Logo size={36} className="w-9 h-9 shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base tracking-wider uppercase whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-200 to-fuchsia-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                  DOLLAR CRAFT
                </span>
              </div>
              <p className="text-[9px] text-slate-400 hidden sm:block tracking-wide truncate max-w-[200px] md:max-w-none">
                Global Investment Platform
              </p>
            </div>
          </button>

          {/* Menu on right / center: Home | Customer Dashboard | Investment Plans | About Us | IB Program | Contact */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#0B0F17]/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold backdrop-blur-md">
            <button
              onClick={() => setActiveTab('pro_dashboard')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pro_dashboard' || activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-md shadow-blue-500/30 font-extrabold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('customer_dashboard')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'customer_dashboard'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-md shadow-blue-500/30 font-extrabold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Customer Dashboard</span>
            </button>

            <button
              onClick={onOpenMasterPlan}
              className="px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-100 border border-amber-500/40 font-bold whitespace-nowrap shadow-sm shadow-amber-500/10 active:scale-95"
              title="Open Investment Plans"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Investment Plans</span>
            </button>

            <button
              onClick={() => {
                if (onOpenAboutUs) onOpenAboutUs();
                else setActiveTab('about_us');
              }}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'about_us'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-md shadow-blue-500/30 font-extrabold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>About Us</span>
            </button>

            <button
              onClick={() => setActiveTab('ib_dashboard')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ib_dashboard' 
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-md shadow-blue-500/30 font-extrabold' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>IB Program</span>
            </button>

            <button
              onClick={() => {
                if (onOpenContact) onOpenContact();
                else setActiveTab('contact');
              }}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'contact'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-md shadow-blue-500/30 font-extrabold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap py-1 relative z-30">

            {/* Investment Plans Mobile/Quick Button */}
            <button
              onClick={onOpenMasterPlan}
              className="md:hidden h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-amber-100 font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-950/40 shrink-0"
              title="Open Investment Plans"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">PLANS</span>
            </button>

            {/* User Profile / Log In Area */}
            <div className="flex items-center gap-1.5 shrink-0 relative">
              {user ? (
                <>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-[#0B132B] hover:bg-[#121E42] border border-cyan-500/40 hover:border-cyan-300 text-cyan-400 hover:text-cyan-300 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-950/50 relative group shrink-0"
                    title="Click to view Account Details and Log Out option"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                      <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col text-left leading-tight max-w-[90px] xs:max-w-[120px] sm:max-w-[160px] truncate">
                      <span className="text-[11px] sm:text-xs font-black text-white truncate">
                        {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || user.email.split('@')[0]}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-cyan-300/80 truncate font-mono">
                        {user.email}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0B132B] animate-pulse" />
                  </button>

                  {/* Quick Direct Logout Button */}
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-rose-100 font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-950/50 shrink-0"
                    title="Log Out of Account"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="hidden xs:inline">LOGOUT</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onOpenAuth('login')}
                  className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm font-mono flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-cyan-200 ring-1 ring-cyan-300/50 whitespace-nowrap shrink-0"
                  title="Log In / Sign Up to Dollar Craft Account"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] text-slate-950 shrink-0" />
                  <span className="tracking-wide uppercase whitespace-nowrap">LOG IN</span>
                </button>
              )}

              {/* Account Popover Modal */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-80 sm:w-84 bg-[#0A1020] border border-cyan-500/30 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] p-5 z-50 text-white font-sans animate-in fade-in zoom-in-95 duration-200">
                  {/* Header Row */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                    <button
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-mono font-bold transition-all cursor-pointer hover:text-white"
                      title="Go Back / Close Menu"
                    >
                      <ArrowLeft className="w-4 h-4 text-cyan-400" />
                      <span>BACK</span>
                    </button>
                    <h3 className="text-base font-bold text-white tracking-tight">Account</h3>
                    <button
                      onClick={() => setShowProfileDropdown(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>

                  {/* Profile User Info Card */}
                  <div className="p-4 rounded-2xl bg-[#0D172E] border border-slate-800/90 space-y-3 mb-3 shadow-inner">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-teal-500/15 to-blue-600/25 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-md shadow-cyan-500/10">
                        <UserIcon className="w-6 h-6 text-cyan-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">
                          {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.username || (user?.email ? user.email.split('@')[0] : 'User'))}
                        </h4>
                        <p className="text-xs text-slate-300 truncate font-mono">
                          {user?.email || 'No email registered'}
                        </p>
                      </div>
                    </div>

                    {/* Account Tier & Role Badges */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Account Role:</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold uppercase">
                        {user?.role || 'USER'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Account Tier:</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold uppercase">
                        {user?.tier || 'SILVER'}
                      </span>
                    </div>
                  </div>

                  {/* ID Bar with Copy Icon */}
                  <div className="p-3.5 rounded-2xl bg-[#060B16] border border-slate-800/90 flex items-center justify-between mb-3 font-mono text-xs">
                    <div className="flex items-center gap-2 truncate text-slate-300">
                      <span className="text-slate-400 font-semibold">ID:</span>
                      <span className="truncate text-cyan-300 font-bold">
                        {user?.id || user?.referralCode || '6a708a01bebec1accd9089e0'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const idToCopy = user?.id || user?.referralCode || '6a708a01bebec1accd9089e0';
                        navigator.clipboard.writeText(idToCopy);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 2000);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer ml-2"
                      title="Copy User ID"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400 hover:text-cyan-300" />}
                    </button>
                  </div>

                  {/* Action Buttons: BACK & LOG OUT */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                      <span>BACK</span>
                    </button>
                    {user && (
                      <button
                        onClick={() => {
                          setShowLogoutConfirm(true);
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="whitespace-nowrap">LOG OUT</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Logout Confirmation Modal (YES / NO) */}
              {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                  <div className="bg-[#0B1220] border-2 border-rose-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-[0_0_50px_rgba(244,63,94,0.3)]">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                      <LogOut className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-sans">Confirm Log Out</h3>
                      <p className="text-xs text-slate-300 font-sans mt-1">
                        Are you sure you want to log out of your account?
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2 font-mono text-xs font-bold">
                      <button
                        onClick={async () => {
                          setShowLogoutConfirm(false);
                          setShowProfileDropdown(false);
                          if (onLogout) {
                            await onLogout();
                          } else {
                            window.location.reload();
                          }
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 text-white shadow-lg cursor-pointer transition-all active:scale-95"
                      >
                        YES
                      </button>
                      <button
                        onClick={() => {
                          setShowLogoutConfirm(false);
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all active:scale-95"
                      >
                        NO
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onOpenAdmin}
              className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/50 text-amber-300 hover:text-white transition-all cursor-pointer shadow-md shadow-amber-500/10 flex items-center gap-1.5 font-bold text-xs sm:text-sm whitespace-nowrap shrink-0"
              title="Open Admin Control Panel (Website & Client Account Management)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
              <span className="tracking-wide whitespace-nowrap">Admin Panel</span>
            </button>

            <button
              onClick={onOpenWithdrawal}
              className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer shadow-md flex items-center gap-1.5 font-bold text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="tracking-wide whitespace-nowrap">Withdraw</span>
            </button>

            {/* User Notifications Bell Button */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowNotifPopover(!showNotifPopover);
                  if (unreadCount > 0) handleMarkRead();
                }}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#0F1420] hover:bg-[#161D2F] border border-slate-800 text-slate-300 relative transition-all cursor-pointer flex items-center justify-center shrink-0"
                title="Notifications"
              >
                {unreadCount > 0 ? (
                  <BellRing className="w-4 h-4 text-emerald-400 animate-bounce" />
                ) : (
                  <Bell className="w-4 h-4 text-slate-400" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[9px] font-mono font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifPopover && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0D121F] border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3 font-mono text-xs text-white">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-cyan-400" />
                      Notifications
                    </span>
                    <button
                      onClick={() => setShowNotifPopover(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-[11px]">
                      No notifications received yet.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
                      {notifications.map((n) => (
                        <div key={n.id} className="pt-2 first:pt-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400 text-[11px]">{n.title}</span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug font-sans">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic User Profile Badge removed as requested */}

          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden py-2 border-t border-slate-800/60 overflow-x-auto no-scrollbar scrollbar-none">
          <div className="flex items-center gap-1.5 px-1 min-w-max">
            <button
              onClick={() => setActiveTab('pro_dashboard')}
              className={`px-3 py-1.5 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'pro_dashboard' || activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 font-extrabold'
                  : 'text-slate-400 bg-slate-900/90 border border-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('customer_dashboard')}
              className={`px-3 py-1.5 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'customer_dashboard'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 font-extrabold'
                  : 'text-slate-400 bg-slate-900/90 border border-slate-800'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Dashboard</span>
            </button>

            <button
              onClick={() => {
                if (onOpenAboutUs) onOpenAboutUs();
                else setActiveTab('about_us');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'about_us'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 font-extrabold'
                  : 'text-slate-400 bg-slate-900/90 border border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>About Us</span>
            </button>

            <button
              onClick={() => setActiveTab('ib_dashboard')}
              className={`px-3 py-1.5 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'ib_dashboard' 
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 font-extrabold'
                  : 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/30'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>IB Program</span>
            </button>

            <button
              onClick={() => {
                if (onOpenContact) onOpenContact();
                else setActiveTab('contact');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'contact'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 font-extrabold'
                  : 'text-slate-400 bg-slate-900/90 border border-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact</span>
            </button>
          </div>
        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B132B] border border-cyan-500/30 rounded-3xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.25)] text-center space-y-4 text-white font-sans">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto shadow-inner">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white tracking-tight">Confirm Logout</h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Are you sure you want to log out of your account?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-bold text-xs transition-all cursor-pointer border border-slate-700/80"
              >
                No
              </button>

              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  if (onLogout) {
                    await onLogout();
                  }
                  if (onOpenAuth) {
                    onOpenAuth();
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-black text-xs shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Earnings Modal Popup */}
      <LiveEarningsModal
        isOpen={isLiveEarningsOpen}
        onClose={() => setIsLiveEarningsOpen(false)}
        user={user}
      />
    </header>
  );
};

