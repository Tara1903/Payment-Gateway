'use client';

import { useState } from 'react';

interface Props {
  qrDataUrl: string;
  upiUrl: string;
  upiId: string;
  amount: number;
}

const UPI_APPS = [
  { name: 'GPay', emoji: '🟢', bg: '#0F52BA', label: 'Google Pay' },
  { name: 'PhonePe', emoji: '🟣', bg: '#5F259F', label: 'PhonePe' },
  { name: 'Paytm', emoji: '🔵', bg: '#00B9F1', label: 'Paytm' },
  { name: 'BHIM', emoji: '🟠', bg: '#F57C00', label: 'BHIM UPI' },
  { name: 'Cred', emoji: '⚪', bg: '#1A1A1A', label: 'Cred' },
];

export function QRDisplay({ qrDataUrl, upiUrl, upiId, amount }: Props) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [showQrOnMobile, setShowQrOnMobile] = useState(false);

  const handleOpenUpi = () => {
    if (typeof window !== 'undefined') {
      window.location.href = upiUrl;
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const copyAmountVal = () => {
    navigator.clipboard.writeText(amount.toFixed(2));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  return (
    <div className="card p-4 sm:p-6 mb-4">
      {/* =========================================================
          MOBILE-FIRST FAST PAY SECTION (Prominent on phones)
         ========================================================= */}
      <div className="sm:hidden mb-6">
        {/* Instant UPI Pay Button */}
        <button
          onClick={handleOpenUpi}
          className="w-full py-4 px-5 rounded-2xl font-bold text-base text-white shadow-lg flex items-center justify-center gap-3 transition active:scale-98"
          style={{
            background: 'linear-gradient(135deg, rgb(139 92 246), rgb(109 40 217))',
            boxShadow: '0 4px 20px -2px rgba(139, 92, 246, 0.5)',
          }}
        >
          <span className="text-xl">⚡</span>
          <span>Pay ₹{amount.toFixed(2)} via UPI App</span>
          <span className="text-lg">→</span>
        </button>

        <p className="text-center text-xs text-slate-400 mt-2">
          Tap above to open Google Pay, PhonePe, Paytm, etc.
        </p>

        {/* UPI App Icons Grid */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {UPI_APPS.map((app) => (
            <button
              key={app.name}
              onClick={handleOpenUpi}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-95 transition"
            >
              <span className="text-lg">{app.emoji}</span>
              <span className="text-[10px] text-slate-300 font-medium mt-1 truncate max-w-full">
                {app.name}
              </span>
            </button>
          ))}
        </div>

        {/* Toggle QR code for mobile users */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => setShowQrOnMobile(!showQrOnMobile)}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium"
          >
            {showQrOnMobile ? '▲ Hide QR Code' : '📷 Paying from another phone? Show QR Code'}
          </button>
        </div>
      </div>

      {/* =========================================================
          QR CODE SECTION (Visible on desktop or when toggled on mobile)
         ========================================================= */}
      <div className={`${showQrOnMobile ? 'block' : 'hidden sm:block'} text-center mb-6`}>
        <div
          className="p-3 sm:p-4 rounded-2xl mb-3 shadow-md inline-block bg-white transition hover:scale-[1.02]"
        >
          <img
            src={qrDataUrl}
            alt="UPI QR Code"
            width={200}
            height={200}
            className="block rounded-lg mx-auto w-44 h-44 sm:w-52 sm:h-52"
          />
        </div>
        <p className="text-xs sm:text-sm text-slate-300 font-medium">
          Scan with any UPI app on another phone
        </p>
      </div>

      {/* =========================================================
          1-TAP COPY UPI ID & EXACT AMOUNT (Essential for all devices)
         ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
        {/* UPI ID Copy Box */}
        <div className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="truncate mr-2">
            <span className="text-[10px] text-slate-500 uppercase block">UPI ID (VPA)</span>
            <span className="font-mono text-slate-200 select-all font-semibold truncate block">{upiId}</span>
          </div>
          <button
            onClick={copyUpiId}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0 ${
              copiedUpi
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {copiedUpi ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Exact Amount Copy Box */}
        <div className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Exact Amount</span>
            <span className="font-mono text-slate-200 font-semibold">₹{amount.toFixed(2)}</span>
          </div>
          <button
            onClick={copyAmountVal}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0 ${
              copiedAmount
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {copiedAmount ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Desktop UPI App Fast Buttons */}
      <div className="hidden sm:block">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[11px] text-slate-500 uppercase tracking-wider">Or click to pay on this device</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {UPI_APPS.slice(0, 4).map((app) => (
            <button
              key={app.name}
              onClick={handleOpenUpi}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/40 hover:bg-slate-800/80 transition-all hover:scale-105"
            >
              <span className="text-xl">{app.emoji}</span>
              <span className="text-xs text-slate-300">{app.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount Callout Note */}
      <div
        className="rounded-xl p-3 text-center text-xs leading-relaxed"
        style={{ background: 'rgb(139 92 246 / 0.08)', border: '1px solid rgb(139 92 246 / 0.2)' }}
      >
        <span style={{ color: 'rgb(167 139 250)' }}>
          ⚠️ Please pay exactly <strong className="font-mono text-white">₹{amount.toFixed(2)}</strong>. The exact paise amount is used for automatic verification.
        </span>
      </div>

      {/* Sticky Mobile Bottom Pay Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 safe-bottom">
        <button
          onClick={handleOpenUpi}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-between transition active:scale-98"
          style={{
            background: 'linear-gradient(135deg, rgb(139 92 246), rgb(109 40 217))',
          }}
        >
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>Pay via UPI App</span>
          </div>
          <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-xs">
            ₹{amount.toFixed(2)}
          </span>
        </button>
      </div>
    </div>
  );
}
