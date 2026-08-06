'use client';

interface Props {
  qrDataUrl: string;
  upiUrl: string;
  upiId: string;
  amount: number;
}

const UPI_APPS = [
  { name: 'GPay', emoji: '🔵', color: '#4285F4' },
  { name: 'PhonePe', emoji: '🟣', color: '#5F259F' },
  { name: 'Paytm', emoji: '🔵', color: '#00B9F1' },
  { name: 'BHIM', emoji: '🟠', color: '#F57C00' },
];

export function QRDisplay({ qrDataUrl, upiUrl, upiId, amount }: Props) {
  const handleUpiApp = (appName: string) => {
    // Open UPI intent (mobile only)
    if (typeof window !== 'undefined') {
      window.location.href = upiUrl;
    }
  };

  return (
    <div className="card p-6 mb-4">
      {/* QR Code */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="p-3 rounded-2xl mb-4"
          style={{ background: '#FFFFFF', display: 'inline-block' }}
        >
          <img
            src={qrDataUrl}
            alt="UPI QR Code"
            width={200}
            height={200}
            className="block rounded-lg"
          />
        </div>
        <p className="text-sm" style={{ color: 'rgb(148 163 184)' }}>Scan with any UPI app</p>
        <p className="text-xs font-mono mt-1" style={{ color: 'rgb(71 85 105)' }}>{upiId}</p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: 'rgb(255 255 255 / 0.06)' }} />
        <span className="text-xs" style={{ color: 'rgb(71 85 105)' }}>OR PAY WITH</span>
        <div className="flex-1 h-px" style={{ background: 'rgb(255 255 255 / 0.06)' }} />
      </div>

      {/* UPI App Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {UPI_APPS.map((app) => (
          <button
            key={app.name}
            onClick={() => handleUpiApp(app.name)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:scale-105"
            style={{ background: 'rgb(255 255 255 / 0.04)', border: '1px solid rgb(255 255 255 / 0.08)' }}
          >
            <span className="text-2xl">{app.emoji}</span>
            <span className="text-xs" style={{ color: 'rgb(148 163 184)' }}>{app.name}</span>
          </button>
        ))}
      </div>

      {/* Amount note */}
      <div
        className="rounded-xl p-3 text-center text-sm"
        style={{ background: 'rgb(139 92 246 / 0.08)', border: '1px solid rgb(139 92 246 / 0.2)' }}
      >
        <span style={{ color: 'rgb(167 139 250)' }}>
          Pay exactly <strong className="font-mono">₹{amount.toFixed(2)}</strong> — the exact amount matters for auto-verification.
        </span>
      </div>
    </div>
  );
}
