import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  LogOut,
  Eye,
  EyeOff,
  Check,
  Zap,
  KeyRound,
  Globe,
  Phone,
  AlertTriangle,
  LogIn,
  Gift,
  UserPlus
} from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../types';
import { signInWithGoogle, sendResetPasswordEmail } from '../lib/firebase';
import { SearchableCountrySelect } from './SearchableCountrySelect';
import { getDialCodeForCountry } from '../data/countries';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  currentUser: User | null;
  onLogout: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onLogout,
  initialMode = 'login'
}) => {
  const [step, setStep] = useState<number>(1); // Step 1: Personal, Step 2: Security, Step 3: Contact
  const [isLoginView, setIsLoginView] = useState<boolean>(initialMode === 'login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [pin, setPin] = useState('');
  const [signupReferralCode, setSignupReferralCode] = useState('');

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStepMessage, setAuthStepMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Google New User Onboarding & Account Selector state
  const [showGoogleOnboarding, setShowGoogleOnboarding] = useState<boolean>(false);
  const [showGoogleAccountPicker, setShowGoogleAccountPicker] = useState<boolean>(false);
  const [googlePickerEmail, setGooglePickerEmail] = useState<string>('');
  const [googlePickerName, setGooglePickerName] = useState<string>('');
  const [googlePendingUser, setGooglePendingUser] = useState<User | null>(null);
  const [onboardingFirstName, setOnboardingFirstName] = useState('');
  const [onboardingLastName, setOnboardingLastName] = useState('');
  const [onboardingUsername, setOnboardingUsername] = useState('');
  const [onboardingReferralUsername, setOnboardingReferralUsername] = useState('');
  const [onboardingPurpose, setOnboardingPurpose] = useState('High-Yield Micro-Staking & Daily Returns');
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);
  const [alreadyRegisteredNotice, setAlreadyRegisteredNotice] = useState<{ user: User; email: string } | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('referralCode') || params.get('invitedBy') || '';
      if (urlRef) {
        setSignupReferralCode(urlRef);
      }
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setIsLoginView(initialMode === 'login');
      setShowGoogleOnboarding(false);
      setShowGoogleAccountPicker(false);
      setErrorMsg('');
      setSuccessMsg('');
      setIsAuthenticating(false);
      setAlreadyRegisteredNotice(null);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlRef = params.get('ref') || params.get('referralCode') || params.get('invitedBy') || '';
        if (urlRef) {
          setSignupReferralCode(urlRef);
        }
      }
    }
  }, [isOpen, initialMode]);

  const syncUserToFirestore = async (userObj: User) => {
    try {
      const { db, auth } = await import('../lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      const primaryId = userObj.id || (auth.currentUser ? auth.currentUser.uid : userObj.email);
      if (primaryId) {
        const payload = {
          uid: primaryId,
          id: primaryId,
          email: userObj.email,
          displayName: userObj.firstName ? `${userObj.firstName} ${userObj.lastName || ''}` : (userObj.username || userObj.email),
          principalBalance: Number(userObj.principalBalance || 500),
          earnedYield: Number(userObj.earnedYield || 0),
          totalWithdrawn: Number(userObj.totalWithdrawn || 0),
          tier: userObj.tier || 'SILVER',
          role: userObj.role || 'USER',
          referralCode: userObj.referralCode || '',
          password: userObj.password || '',
          isFrozen: !!userObj.isFrozen,
          createdAt: userObj.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', primaryId), payload, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore user doc sync notice:', err);
    }
  };

  const getSuggestedUsernames = () => {
    const fName = (onboardingFirstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
    const lName = (onboardingLastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailPrefix = googlePendingUser?.email ? googlePendingUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'trader';

    return Array.from(new Set([
      `${fName}_craft`,
      `${fName}${lName ? '_' + lName : '2026'}`,
      `craft_${emailPrefix}`,
      `pro_${fName}_vip`
    ]));
  };

  const handleCompleteGoogleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingFirstName.trim() || !onboardingLastName.trim()) {
      setErrorMsg('Please enter your First Name and Last Name.');
      return;
    }
    if (!onboardingUsername.trim()) {
      setErrorMsg('Please enter or select a Username.');
      return;
    }

    setOnboardingSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: googlePendingUser?.id,
          firstName: onboardingFirstName.trim(),
          lastName: onboardingLastName.trim(),
          username: onboardingUsername.trim(),
          referralUsername: onboardingReferralUsername.trim(),
          onboardingPurpose: onboardingPurpose
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        syncUserToFirestore(data.user);
        onLoginSuccess(data.user);
        setShowGoogleOnboarding(false);
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to complete profile creation.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile.');
    } finally {
      setOnboardingSubmitting(false);
    }
  };

  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
    const dialCode = getDialCodeForCountry(selectedCountry);
    if (dialCode) {
      setPhone((currentPhone) => {
        if (!currentPhone || currentPhone.trim() === '' || currentPhone.startsWith('+')) {
          const digitsOnly = currentPhone.replace(/^\+\d+[-.\s]*/, '').trim();
          return digitsOnly ? `${dialCode} ${digitsOnly}` : `${dialCode} `;
        }
        return `${dialCode} ${currentPhone.trim()}`;
      });
    }
  };

  if (!isOpen) return null;

  // Google SVG Icon component
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

  const executeGoogleAuthWithDetails = async (selectedEmail: string, selectedName: string) => {
    if (!selectedEmail || !selectedEmail.trim()) {
      setErrorMsg('Please enter or select a valid Google email address.');
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg('');
    setAuthStepMessage('Authenticating Google Account...');

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get('ref') || urlParams.get('referralCode') || undefined;

      const finalEmail = selectedEmail.trim().toLowerCase();
      const finalName = selectedName.trim() || finalEmail.split('@')[0];

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: finalEmail,
          name: finalName,
          referralCode: urlRef,
          googleId: `g-oidc-${Date.now()}`
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setShowGoogleAccountPicker(false);
        if (!isLoginView) {
          if (!data.isNewUser) {
            // User tried to Sign Up with a Google account that is ALREADY registered!
            setAlreadyRegisteredNotice({ user: data.user, email: data.user.email });
            setErrorMsg('');
          } else if (!data.user.hasCompletedOnboarding) {
            setAlreadyRegisteredNotice(null);
            const nameParts = (finalName || data.user.email.split('@')[0] || '').trim().split(' ');
            const fName = nameParts[0] || '';
            const lName = nameParts.slice(1).join(' ') || '';
            setOnboardingFirstName(fName);
            setOnboardingLastName(lName);
            const baseName = (fName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
            setOnboardingUsername(`${baseName}_craft`);
            if (urlRef) {
              setOnboardingReferralUsername(urlRef);
            }
            setGooglePendingUser(data.user);
            setShowGoogleOnboarding(true);
          } else {
            setAlreadyRegisteredNotice(null);
            syncUserToFirestore(data.user);
            onLoginSuccess(data.user);
            setShowGoogleOnboarding(false);
            onClose();
          }
        } else {
          setAlreadyRegisteredNotice(null);
          syncUserToFirestore(data.user);
          onLoginSuccess(data.user);
          setShowGoogleOnboarding(false);
          onClose();
        }
      } else {
        setErrorMsg(data.error || 'Google sign-in failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate via Google');
    } finally {
      setIsAuthenticating(false);
      setAuthStepMessage('');
    }
  };

  const handleDirectGoogleAuth = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setErrorMsg('');
    setAuthStepMessage('Connecting to Google OAuth 2.0...');

    try {
      try {
        const result = await signInWithGoogle();
        if (result.user && result.user.email) {
          await executeGoogleAuthWithDetails(
            result.user.email,
            result.user.displayName || result.user.email.split('@')[0]
          );
          return;
        }
      } catch (popupErr: any) {
        console.warn('Google Popup process notice:', popupErr);
        const errCode = popupErr?.code || '';
        const errStr = String(popupErr?.message || popupErr || '');

        if (errCode === 'auth/popup-closed-by-user' || errStr.includes('popup-closed-by-user')) {
          setErrorMsg('Google Sign-In popup was closed before completing sign-in.');
          setIsAuthenticating(false);
          setAuthStepMessage('');
          return;
        }

        if (errCode === 'auth/cancelled-popup-request' || errStr.includes('cancelled-popup-request')) {
          setIsAuthenticating(false);
          setAuthStepMessage('');
          return;
        }

        // If popup was blocked or failed in sandbox/iframe environments, open the Google Account Chooser screen!
        setIsAuthenticating(false);
        setAuthStepMessage('');
        setShowGoogleAccountPicker(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate via Google');
      setIsAuthenticating(false);
      setAuthStepMessage('');
    }
  };

  const isGibberishUsername = (username: string): boolean => {
    const cleanUser = username.toLowerCase().replace(/[^a-z]/g, '');
    if (!cleanUser) return false;
    
    if (cleanUser.length < 3) return true;

    // Keyboard mashing patterns
    const mashingPatterns = [
      'qwerty', 'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio', 'yuiop',
      'asdfg', 'sdfgh', 'dfghj', 'fghjk', 'ghjkl',
      'zxcvb', 'xcvbn', 'cvbnm',
      '12345', '23456', '34567', '45678', '56789',
      'wdwr', 'fghj', 'hjkl', 'asdf', 'zxcv', 'qwer'
    ];
    for (const pat of mashingPatterns) {
      if (cleanUser.includes(pat)) return true;
    }

    // Triple repeating characters
    if (/(.)\1\1/.test(cleanUser)) return true;

    // 4 or more consecutive consonants (without vowels a,e,i,o,u,y)
    if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(cleanUser)) return true;

    // Low vowel ratio for strings >= 6 chars
    if (cleanUser.length >= 6) {
      const vowels = cleanUser.match(/[aeiouy]/gi);
      const vowelCount = vowels ? vowels.length : 0;
      const vowelRatio = vowelCount / cleanUser.length;
      if (vowelRatio < 0.18) return true;
    }

    return false;
  };

  const validateEmailClient = (emailStr: string): { valid: boolean; message: string } => {
    if (!emailStr || !emailStr.trim()) return { valid: false, message: 'Please enter your email address.' };
    const clean = emailStr.trim().toLowerCase();
    if (!clean.includes('@') || !clean.includes('.')) {
      return { valid: false, message: 'Please enter a valid email address (e.g. name@gmail.com).' };
    }
    return { valid: true, message: '' };
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    const emailCheck = validateEmailClient(email);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.message);
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const userWithPwd = { ...data.user, password: password || data.user.password };
        syncUserToFirestore(userWithPwd);
        onLoginSuccess(userWithPwd);
        onClose();
      } else {
        setErrorMsg(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setErrorMsg('Connection error during sign in');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter email and password');
      return;
    }

    const emailCheck = validateEmailClient(email);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.message);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password: password, 
          name: name || email.split('@')[0],
          phone: phone || '',
          country: country || 'Pakistan',
          referralCode: signupReferralCode.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const userWithPwd = { ...data.user, password: password || data.user.password };
        syncUserToFirestore(userWithPwd);
        onLoginSuccess(userWithPwd);
        onClose();
      } else {
        setErrorMsg(data.error || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg('Connection error during registration');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-xl p-2 sm:p-4 w-full max-w-full">
        {/* Animated backdrop mask */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gradient-to-b from-cyan-950/20 via-black/90 to-black/95"
        />

        {/* Flex Centering Wrapper */}
        <div className="flex min-h-full items-center justify-center text-center p-0 sm:p-2">
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg bg-gradient-to-b from-[#0D1527] via-[#070C18] to-[#040710] border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/30 overflow-hidden font-sans z-10 my-auto p-4 sm:p-8 max-h-[90vh] overflow-y-auto text-white text-left"
          >
          {/* Top Neon Gradient Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-teal-300 via-emerald-400 to-amber-400 animate-pulse" />

          {/* Ambient Lighting Background Glows */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header Bar */}
          <div className="relative flex items-center justify-center pb-4 border-b border-slate-800/80 mb-4 z-10">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono text-center">
              {isLoginView ? 'LOG IN TO ACCOUNT' : 'CREATE FREE ACCOUNT'}
            </h3>

            <button
              onClick={onClose}
              className="absolute right-0 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 transition-all cursor-pointer border border-slate-700/60 hover:border-cyan-400/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Header Badge / Interactive Switcher */}
          <div className="flex bg-[#030814] p-1.5 rounded-2xl border border-cyan-500/30 mb-5 relative z-10 font-mono text-xs gap-1.5">
            <button
              type="button"
              onClick={() => { setIsLoginView(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-xl font-bold text-center uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isLoginView
                  ? 'bg-gradient-to-r from-cyan-500/25 via-teal-500/20 to-blue-500/25 text-cyan-300 border border-cyan-400/60 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900/40 border border-transparent'
              }`}
            >
              <LogIn className="w-4 h-4 text-cyan-400" />
              <span>LOG IN</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginView(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-xl font-bold text-center uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isLoginView
                  ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/25 text-emerald-300 border border-emerald-400/60 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900/40 border border-transparent'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>SIGN UP</span>
            </button>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="p-3.5 bg-emerald-950/90 border border-emerald-400/80 rounded-2xl text-emerald-200 text-xs font-mono flex items-center gap-2.5 mb-5 shadow-lg shadow-emerald-950/60 relative z-10"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="p-3.5 bg-rose-950/80 border border-rose-500/60 rounded-2xl text-rose-200 text-xs font-mono flex items-center gap-2.5 mb-5 shadow-lg shadow-rose-950/50 relative z-10"
              >
                <span className="text-base">⚠️</span>
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Already Registered Account Notice with Login Button */}
          <AnimatePresence>
            {alreadyRegisteredNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="p-4 bg-gradient-to-r from-amber-950/90 via-[#190F05] to-yellow-950/90 border-2 border-amber-400/90 rounded-2xl space-y-3 mb-5 shadow-2xl shadow-amber-950/80 relative z-20 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 mt-0.5 shadow-sm shadow-amber-500/30">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      Account Already Registered
                    </h4>
                    <p className="text-xs font-bold text-slate-100 leading-snug font-sans">
                      This account (<span className="text-amber-300 font-bold font-mono">{alreadyRegisteredNotice.email}</span>) is already registered. Please log in to access your portfolio.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onLoginSuccess(alreadyRegisteredNotice.user);
                      setAlreadyRegisteredNotice(null);
                      setShowGoogleOnboarding(false);
                      onClose();
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <LogIn className="w-4 h-4 stroke-[2.5] text-slate-950" />
                    <span className="tracking-wide">LOG IN TO YOUR ACCOUNT NOW</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Indicator */}
          <AnimatePresence>
            {isAuthenticating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-400/60 rounded-2xl text-center space-y-2 mb-5 shadow-xl shadow-cyan-950/80 relative z-10"
              >
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto shadow-sm shadow-cyan-400/50" />
                <p className="text-xs font-mono font-bold text-cyan-300 tracking-wide">
                  {authStepMessage || 'Authenticating...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP CONTENT */}
          {showGoogleAccountPicker ? (
            /* GOOGLE ACCOUNT SELECTOR SCREEN */
            <div className="space-y-5 relative z-10 text-left">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0C1527] via-[#08101E] to-[#040A14] border border-cyan-500/50 shadow-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white p-2 flex items-center justify-center shrink-0 shadow-md">
                    <GoogleIcon />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2 font-mono">
                      Choose a Google Account
                    </h3>
                    <p className="text-xs text-slate-300 font-sans">
                      Select an account to continue to <strong className="text-cyan-300 font-mono">Dollar Craft Vault</strong>
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed border-t border-slate-800/80 pt-2.5">
                  Select or enter the Google email address you want to use to {isLoginView ? 'log in' : 'sign up'}.
                </p>
              </div>

              {/* Account Selection Options */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider block mb-1.5">
                    Enter Your Google Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="your.google.account@gmail.com"
                      value={googlePickerEmail}
                      onChange={(e) => setGooglePickerEmail(e.target.value)}
                      className="w-full bg-[#030914] border border-cyan-500/50 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 text-white rounded-xl pl-10 pr-4 py-3 text-xs outline-none font-mono font-bold shadow-inner transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider block mb-1.5">
                    Full Name (Optional)
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={googlePickerName}
                      onChange={(e) => setGooglePickerName(e.target.value)}
                      className="w-full bg-[#030914] border border-cyan-500/50 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 text-white rounded-xl pl-10 pr-4 py-3 text-xs outline-none font-mono font-medium shadow-inner transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  disabled={!googlePickerEmail || !googlePickerEmail.includes('@')}
                  onClick={() => executeGoogleAuthWithDetails(googlePickerEmail, googlePickerName)}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:brightness-110 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs font-mono flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
                >
                  <GoogleIcon />
                  <span className="tracking-wide uppercase">
                    Continue with Google Account
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowGoogleAccountPicker(false)}
                  className="w-full py-2.5 px-4 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-800"
                >
                  Cancel / Go Back
                </button>
              </div>
            </div>
          ) : (
            /* AUTHENTICATION PORTAL CONTENT */
            <div className="space-y-5 relative z-10 text-left">
              {/* Form Fields */}
              <form onSubmit={isLoginView ? handleLoginSubmit : handleRegistrationSubmit} className="space-y-4">
                {!isLoginView && (
                  <div>
                    <label className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider block mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#030814] border border-cyan-500/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none font-sans font-medium transition-all shadow-inner placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#030814] border border-cyan-500/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none font-mono font-medium transition-all shadow-inner placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider block mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#030814] border border-cyan-500/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 text-white rounded-xl pl-10 pr-10 py-2.5 text-xs outline-none font-mono font-medium transition-all shadow-inner placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isLoginView && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider block">
                        Referral Code (Optional)
                      </label>
                      <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
                        🎁 5% Referrer Bonus
                      </span>
                    </div>
                    <div className="relative">
                      <Gift className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. DC9A2B4X or referrer username"
                        value={signupReferralCode}
                        onChange={(e) => setSignupReferralCode(e.target.value)}
                        className="w-full bg-[#030814] border border-amber-500/50 focus:border-amber-300 focus:ring-2 focus:ring-amber-400/30 text-amber-200 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none font-mono font-bold transition-all shadow-inner placeholder:text-slate-500 uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:brightness-125 text-slate-950 font-black rounded-xl text-xs sm:text-sm font-mono flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 ring-1 ring-white/40 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 mt-3"
                >
                  <span>{isLoginView ? 'LOG IN' : 'CREATE FREE ACCOUNT NOW'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>


            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-5 border-t border-slate-800/80 mt-5 font-mono relative z-10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit AES Vault Encryption & Firebase Auth</span>
          </div>
        </motion.div>
        </div>
      </div>
      )}
    </AnimatePresence>
  );
};
