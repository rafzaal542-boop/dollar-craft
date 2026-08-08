import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, MapPin, MessageCircle, ExternalLink } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md p-2 sm:p-4 w-full max-w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0B0F17] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/20 p-6 md:p-8 text-white overflow-hidden space-y-6 text-left"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono">
                Contact Dollar Craft
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                24/7 Global Institutional Support Desk
              </p>
            </div>
          </div>

          {/* Direct Contact Details */}
          <div className="space-y-4">
            <div className="p-5 bg-[#07090E] border border-slate-800 rounded-2xl space-y-4 shadow-inner">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Support Email</h4>
                  <p className="text-sm text-cyan-300 font-mono font-bold select-all mt-0.5">dollarcraft3@gmail.com</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-800/80 pt-3 gap-3">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Live Support Channel</h4>
                    <span className="text-sm text-emerald-300 font-mono font-bold mt-0.5 block">
                      24/7 WhatsApp Desk
                    </span>
                  </div>
                </div>

                {/* Professional WhatsApp Button with 24/7 Live Animation */}
                <div className="flex flex-col sm:items-end items-start gap-1">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-mono font-black uppercase shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>24/7 LIVE</span>
                  </div>

                  <a
                    href="/api/whatsapp-support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs font-mono flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-slate-950 stroke-[2.5]" />
                    <span className="uppercase tracking-wide">WhatsApp Live</span>
                    <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-800/80 pt-3">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Registered HQ</h4>
                  <p className="text-sm text-white font-mono font-bold mt-0.5">Dollar Craft Pte Ltd</p>
                  <p className="text-xs text-slate-300 font-mono">c/o Company Name</p>
                  <p className="text-xs text-slate-300 font-mono">70 Bendemeer Road, #03-02</p>
                  <p className="text-xs text-slate-300 font-mono">Luzerne, Singapore 339940</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

