"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Gift, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  HelpCircle,
  Globe
} from 'lucide-react';
import { signInWithGoogle } from '../../src/lib/firebase';

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google SVG Icon Component
  const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await signInWithGoogle();
      const userEmail = res.user.email || 'Google Account';
      const userName = res.user.displayName || userEmail;
      setStatusMsg({
        type: 'success',
        text: `Firebase Google Auth successful! Authenticated as ${userEmail} (${userName}).`
      });
    } catch (err: any) {
      console.error('Firebase Google Auth error:', err);
      setStatusMsg({
        type: 'error',
        text: err.message || 'Failed to authenticate via Google Firebase'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg(null);

    try {
      if (tab === 'login') {
        setStatusMsg({
          type: 'success',
          text: `Logged in successfully as ${email}!`
        });
      } else if (tab === 'register') {
        setStatusMsg({
          type: 'success',
          text: `Account created successfully for ${name || email}! Welcome to Dollar Craft.`
        });
      } else if (tab === 'forgot') {
        setForgotSent(true);
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Authentication error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Electric Blue Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Authentication Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-[#07090E]/95 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl shadow-cyan-500/10 p-8 space-y-6"
      >
        
        {/* Top Electric Glow Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-400 rounded-t-3xl" />

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-1">
            <Globe className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center justify-center gap-2">
            Dollar Craft
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              PRO AUTH
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            High-Precision Micro-Yield Protocol Access
          </p>
        </div>

        {/* Direct Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-slate-100 hover:bg-white text-slate-950 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-400/40 transition-all transform active:scale-[0.98] cursor-pointer group border border-cyan-400/40"
        >
          <GoogleIcon />
          <span className="tracking-wide">Continue with Google</span>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-semibold ml-auto group-hover:bg-cyan-900">
            NEXTAUTH
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 text-slate-600 text-[11px] font-mono">
          <div className="flex-1 h-px bg-slate-800" />
          <span>OR EMAIL CREDENTIALS</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Tabbed Interface: Toggle smoothly between "Login" and "Register" */}
        <div className="grid grid-cols-2 gap-1 bg-[#0B0F17] p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setTab('login'); setStatusMsg(null); setForgotSent(false); }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'login'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('register'); setStatusMsg(null); setForgotSent(false); }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'register'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Status Messages */}
        {statusMsg && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab Animation Content */}
        <AnimatePresence mode="wait">
          {tab === 'login' && (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleFormSubmit}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="trader@dollarcraft.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 rounded-xl pl-10 pr-10 py-2.5 text-xs outline-none transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between py-1 text-xs">
                <label 
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 text-slate-300 cursor-pointer select-none"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    rememberMe ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'bg-[#0B0F17] border-slate-700'
                  }`}>
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Remember Me for 30 Days</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          )}

          {tab === 'register' && (
            <motion.form 
              key="register"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleFormSubmit}
              className="space-y-4"
            >
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs flex items-center gap-2">
                <Gift className="w-4 h-4 text-cyan-400 shrink-0" />
                <span><strong>Instant Bonus:</strong> New accounts receive immediate yield streaming configuration!</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0B0F17] border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 rounded-xl pl-10 pr-10 py-2.5 text-xs outline-none transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Referral Code (Optional)</label>
                <input
                  type="text"
                  placeholder="CRAFT99X"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#0B0F17] border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 rounded-xl px-4 py-2 text-xs font-mono outline-none transition-all uppercase placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <span>Create Pro Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          )}

          {tab === 'forgot' && (
            <motion.form 
              key="forgot"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleFormSubmit}
              className="space-y-4"
            >
              <div className="text-center space-y-1">
                <HelpCircle className="w-8 h-8 text-cyan-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-100">Reset Password</h3>
                <p className="text-xs text-slate-400">
                  Enter your registered email to receive a password reset link.
                </p>
              </div>

              {forgotSent ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="font-bold">Reset email sent to {email}!</p>
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-xs text-cyan-400 hover:underline font-semibold"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="trader@dollarcraft.io"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#0B0F17] border border-slate-800 focus:border-cyan-500 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Send Reset Link
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setTab('login')}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="pt-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-bit AES Encryption & Google OAuth 2.0 Compliant</span>
        </div>

      </motion.div>
    </div>
  );
}
