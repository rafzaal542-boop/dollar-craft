import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  KeyRound, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react';
import { CinematicButton } from './ui/CinematicButton';
import { sendGmailAlert, getCachedAccessToken, signInWithGoogle } from '../lib/firebase';
import { User } from '../types';

interface GmailIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
}

export const GmailIntegrationModal: React.FC<GmailIntegrationModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'dispatcher' | 'guide' | 'env'>('dispatcher');
  
  // Dispatcher State
  const [recipientEmail, setRecipientEmail] = useState(currentUser?.email || 'dollarcraft3@gmail.com');
  const [emailSubject, setEmailSubject] = useState('Dollar Craft Pro: Real-Time Micro-Yield Payout Alert');
  const [emailBody, setEmailBody] = useState(
    `<div style="font-family: sans-serif; padding: 24px; background: #07090E; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
      <h2 style="color: #00D2FF; margin-top: 0;">⚡ Dollar Craft Yield Protocol Alert</h2>
      <p>Hello <strong>${currentUser?.email || 'Trader'}</strong>,</p>
      <p>Your micro-yield contract has generated new earnings. Real-time payouts are continuously accumulating into your wallet balance.</p>
      <div style="background: #0F172A; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin: 16px 0;">
        <span style="color: #94a3b8; font-size: 12px;">Earned Yield Total</span><br/>
        <strong style="color: #38bdf8; font-size: 24px;">+$${currentUser?.earnedYield || '0.00'} USD</strong>
      </div>
      <p style="font-size: 12px; color: #64748b;">Dispatched securely via Google Gmail API v1 & OAuth 2.0</p>
    </div>`
  );

  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setStatusMessage(null);

    try {
      let token = getCachedAccessToken();
      if (!token) {
        // Prompt Google auth if token missing
        try {
          const googleRes = await signInWithGoogle();
          token = googleRes.accessToken;
        } catch (popupErr: any) {
          const errCode = popupErr?.code || '';
          const errStr = String(popupErr?.message || popupErr || '');
          if (errCode === 'auth/popup-closed-by-user' || errStr.includes('popup-closed-by-user')) {
            setStatusMessage({
              type: 'error',
              text: 'Google Sign-In popup was closed before authorizing Gmail access.'
            });
            setIsSending(false);
            return;
          }
          if (errCode === 'auth/popup-blocked' || errStr.includes('popup-blocked')) {
            setStatusMessage({
              type: 'error',
              text: 'Google Sign-In popup was blocked by browser. Please allow popups.'
            });
            setIsSending(false);
            return;
          }
          throw popupErr;
        }
      }

      if (!token) {
        throw new Error('OAuth access token is missing. Please sign in with Google to grant Gmail send permissions.');
      }

      await sendGmailAlert(recipientEmail, emailSubject, emailBody, token);
      setStatusMessage({
        type: 'success',
        text: `Email successfully dispatched to ${recipientEmail} via Gmail API v1!`
      });
    } catch (err: any) {
      console.error('Gmail Dispatch Error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch email via Gmail API'
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const envExampleCode = `# .env.local Configuration for Next.js / Auth.js / Google OAuth

# Google Cloud Console OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="572988703385-corhi6ncekk1uj66rlhq8uj5nrhligt1.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-google-client-secret-here"

# Auth.js / NextAuth Secrets & App Base URL
NEXTAUTH_SECRET="a3f89021b8c2d9e1f4a5c6e7f8a9b0c1d2e3f4a5b6c7d8e9f0"
NEXTAUTH_URL="https://ais-dev-bhv3bgovxtgh4rlapy2ro5-75270219279.asia-east1.run.app"

# Database Connection String (PostgreSQL Prisma / Supabase / Cloud SQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/dollarcraft?schema=public"`;

  const nextAuthRouteCode = `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async session({ session, user }: any) {
      if (session?.user) {
        session.user.id = user?.id || session.user.id;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-md p-2 sm:p-4 w-full max-w-full flex items-center justify-center animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0B0F17] rounded-3xl border border-slate-800 shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-[#07090E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <span>Google Auth & Gmail API Integration</span>
                <span className="bg-cyan-950 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/30">
                  OAUTH 2.0 READY
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct Gmail email dispatcher and production NextAuth.js setup specification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-900 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#07090E]/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('dispatcher')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'dispatcher'
                ? 'bg-[#0B0F17] text-cyan-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Live Gmail Dispatcher</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-[#0B0F17] text-cyan-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Google Cloud Setup Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'env'
                ? 'bg-[#0B0F17] text-cyan-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>NextAuth.js & .env Code</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">

          {/* TAB 1: Live Gmail Dispatcher */}
          {activeTab === 'dispatcher' && (
            <form onSubmit={handleSendGmail} className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                <p className="text-xs text-slate-300">
                  Send real automated yield receipts and notifications directly using your connected Google OAuth 2.0 Gmail token.
                </p>
              </div>

              {statusMessage && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  className="w-full bg-[#07090E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  placeholder="recipient@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  required
                  className="w-full bg-[#07090E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Email Body (HTML Supported)
                </label>
                <textarea
                  rows={5}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  required
                  className="w-full bg-[#07090E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <CinematicButton
                  type="button"
                  onClick={onClose}
                  variant="utility"
                  size="md"
                >
                  Close
                </CinematicButton>
                <CinematicButton
                  type="submit"
                  isLoading={isSending}
                  variant="primary"
                  size="md"
                  icon={<Send className="w-4 h-4" />}
                >
                  Send Real Email via Gmail API
                </CinematicButton>
              </div>
            </form>
          )}

          {/* TAB 2: Setup Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-5 text-xs">
              <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-2xl space-y-2">
                <h3 className="font-extrabold text-cyan-300 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Google Cloud Console OAuth 2.0 Credentials Guide</span>
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  To configure Google OAuth 2.0 for Next.js, NextAuth.js, or Firebase in production, follow these steps:
                </p>
              </div>

              <ol className="space-y-3 list-decimal list-inside text-slate-300">
                <li className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <strong className="text-slate-100">Create a Google Cloud Project:</strong> Navigate to{' '}
                  <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                    Google Cloud Console
                  </a>{' '}
                  and create or select a project.
                </li>
                <li className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <strong className="text-slate-100">Configure OAuth Consent Screen:</strong> Select <em>External</em> or <em>Internal</em>, fill in brand details, and add requested scopes (`openid`, `email`, `profile`, `https://mail.google.com/`).
                </li>
                <li className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <strong className="text-slate-100">Set Authorized JavaScript Origins:</strong>
                  <ul className="mt-1 ml-5 list-disc text-slate-400 space-y-1 font-mono">
                    <li>`http://localhost:3000` (Local testing)</li>
                    <li>`https://ais-dev-bhv3bgovxtgh4rlapy2ro5-75270219279.asia-east1.run.app` (Preview)</li>
                  </ul>
                </li>
                <li className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <strong className="text-slate-100">Set Authorized Redirect URIs:</strong>
                  <ul className="mt-1 ml-5 list-disc text-slate-400 space-y-1 font-mono">
                    <li>`http://localhost:3000/api/auth/callback/google` (NextAuth local)</li>
                    <li>`https://ais-dev-bhv3bgovxtgh4rlapy2ro5-75270219279.asia-east1.run.app/__/auth/handler` (Firebase)</li>
                  </ul>
                </li>
              </ol>
            </div>
          )}

          {/* TAB 3: NextAuth & .env Code */}
          {activeTab === 'env' && (
            <div className="space-y-5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>.env.local Variable Declaration</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(envExampleCode, 'env')}
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCode === 'env' ? 'Copied!' : 'Copy .env.local'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-cyan-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {envExampleCode}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>app/api/auth/[...nextauth]/route.ts</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(nextAuthRouteCode, 'route')}
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCode === 'route' ? 'Copied!' : 'Copy Route Code'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {nextAuthRouteCode}
                </pre>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
