'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ClientApp {
  id: string;
  name: string;
  slug: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  apiKey: string;
  webhookUrl?: string | null;
  returnUrl?: string | null;
  description?: string | null;
  upiId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  bankIfsc: string;
  usePlatformBank: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AppStats {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
}

export default function MerchantPortalPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [apps, setApps] = useState<ClientApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<ClientApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingBank, setEditingBank] = useState(false);
  const [creatingApp, setCreatingApp] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [stats, setStats] = useState<AppStats>({ totalOrders: 0, paidOrders: 0, totalRevenue: 0 });

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    upiId: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    bankIfsc: '',
    usePlatformBank: true,
  });

  // New App Form State
  const [newAppForm, setNewAppForm] = useState({
    name: '',
    description: '',
    ownerName: '',
    ownerEmail: '',
    webhookUrl: '',
    returnUrl: '',
    upiId: '9630937033@sbi',
    accountHolderName: 'Hari Singh',
    bankName: 'State Bank of India',
    accountNumber: '2441',
    bankIfsc: 'SBIN0002441',
    usePlatformBank: true,
  });

  // Test Order State
  const [testOrderLoading, setTestOrderLoading] = useState(false);
  const [testOrderResult, setTestOrderResult] = useState<{ checkoutUrl: string; orderRef: string; amount: number } | null>(null);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const fetchApps = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || null;
      if (email) setUserEmail(email);

      const res = await fetch('/api/apps');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setApps(json.data);
        
        // Pick app: if currently selected, keep it; else if user owns an app, pick that; else first app
        let current = json.data[0];
        if (selectedApp) {
          const found = json.data.find((a: ClientApp) => a.id === selectedApp.id);
          if (found) current = found;
        } else if (email) {
          const owned = json.data.find((a: ClientApp) => a.ownerEmail?.toLowerCase() === email.toLowerCase());
          if (owned) current = owned;
        }

        setSelectedApp(current);
        setBankForm({
          upiId: current.upiId,
          accountHolderName: current.accountHolderName,
          bankName: current.bankName,
          accountNumber: current.accountNumber,
          bankIfsc: current.bankIfsc,
          usePlatformBank: current.usePlatformBank,
        });
      }
    } catch (err) {
      console.error('Failed to load apps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectApp = (app: ClientApp) => {
    setSelectedApp(app);
    setBankForm({
      upiId: app.upiId,
      accountHolderName: app.accountHolderName,
      bankName: app.bankName,
      accountNumber: app.accountNumber,
      bankIfsc: app.bankIfsc,
      usePlatformBank: app.usePlatformBank,
    });
    setTestOrderResult(null);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setSaveLoading(true);
      const res = await fetch(`/api/apps/${selectedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      });
      const json = await res.json();
      if (json.success) {
        setEditingBank(false);
        fetchApps();
      } else {
        alert(json.error?.message || 'Failed to update bank details');
      }
    } catch (err) {
      alert('Error updating bank details: ' + String(err));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppForm),
      });
      const json = await res.json();
      if (json.success) {
        setCreatingApp(false);
        setNewAppForm({
          name: '',
          description: '',
          ownerName: '',
          ownerEmail: '',
          webhookUrl: '',
          returnUrl: '',
          upiId: '9630937033@sbi',
          accountHolderName: 'Hari Singh',
          bankName: 'State Bank of India',
          accountNumber: '2441',
          bankIfsc: 'SBIN0002441',
          usePlatformBank: true,
        });
        fetchApps();
      } else {
        alert(json.error?.message || 'Failed to create app');
      }
    } catch (err) {
      alert('Error creating app: ' + String(err));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCreateTestOrder = async () => {
    if (!selectedApp) return;
    try {
      setTestOrderLoading(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': selectedApp.apiKey,
        },
        body: JSON.stringify({
          amount: 199.00,
          businessName: selectedApp.name,
          description: `Test payment for ${selectedApp.name}`,
          customerName: 'Test Customer',
          customerEmail: 'customer@example.com',
          customerPhone: '9876543210',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTestOrderResult({
          checkoutUrl: json.data.checkoutUrl,
          orderRef: json.data.orderRef,
          amount: json.data.reservedAmount,
        });
      } else {
        alert(json.error?.message || 'Failed to generate test order');
      }
    } catch (err) {
      alert('Error creating test order: ' + String(err));
    } finally {
      setTestOrderLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(''), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Merchant Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3.5 sm:p-6 md:p-10 font-sans pb-24 md:pb-12">
      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 sm:mb-8 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="text-xl sm:text-2xl">⚡</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Merchant & App Portal</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Multi-App Gateway
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure per-app bank accounts, retrieve integration API keys, and monitor payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {userEmail && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="text-violet-400">👤</span>
              <span className="font-mono text-[11px] truncate max-w-[140px]">{userEmail}</span>
            </div>
          )}
          <button
            onClick={() => setCreatingApp(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs sm:text-sm font-medium transition shadow-sm active:scale-95"
          >
            + Register New App
          </button>
          <Link
            href="/admin/apps"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs sm:text-sm font-medium transition"
          >
            Admin Dashboard →
          </Link>
          <button
            onClick={handleSignOut}
            className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition"
            title="Sign Out"
          >
            Sign Out ⎋
          </button>
        </div>
      </div>

      {/* Mobile Horizontal App Carousel (<lg screens) */}
      <div className="lg:hidden max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Apps ({apps.length})</span>
          <button
            onClick={() => setCreatingApp(true)}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium"
          >
            + New App
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {apps.map((app) => {
            const isSelected = selectedApp?.id === app.id;
            return (
              <button
                key={app.id}
                onClick={() => handleSelectApp(app)}
                className={`flex-shrink-0 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-violet-600/20 border-violet-500 text-white ring-1 ring-violet-500/40 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${app.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className="font-semibold">{app.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">••••{app.accountNumber.slice(-4)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: App Selector (Desktop only) */}
        <div className="hidden lg:block lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Your Apps</h2>
          {apps.map((app) => {
            const isSelected = selectedApp?.id === app.id;
            return (
              <div
                key={app.id}
                onClick={() => handleSelectApp(app)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-slate-900 border-violet-500 shadow-md ring-1 ring-violet-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white text-sm truncate">{app.name}</div>
                  <span className={`w-2 h-2 rounded-full ${app.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono truncate">{app.upiId}</div>
                <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                  <span>{app.bankName}</span>
                  <span>••••{app.accountNumber.slice(-4)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Columns: Active App Detail & Bank Setup */}
        {selectedApp && (
          <div className="lg:col-span-3 space-y-6">
            {/* Header Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">{selectedApp.name}</h2>
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedApp.description || 'Custom client application'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateTestOrder}
                    disabled={testOrderLoading}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-lg text-slate-200 transition"
                  >
                    {testOrderLoading ? 'Generating...' : '⚡ Test Checkout Link'}
                  </button>
                  <button
                    onClick={() => setEditingBank(true)}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-xs font-medium rounded-lg text-white transition"
                  >
                    ⚙️ Edit Bank Account
                  </button>
                </div>
              </div>

              {testOrderResult && (
                <div className="mt-4 p-4 bg-violet-950/40 border border-violet-800/50 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-violet-300">Test Order Created: {testOrderResult.orderRef}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Amount: ₹{testOrderResult.amount}</div>
                  </div>
                  <a
                    href={testOrderResult.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-xs font-medium transition"
                  >
                    Open Live Checkout →
                  </a>
                </div>
              )}
            </div>

            {/* Grid: Bank Account Card + Integration Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Per-App Bank Account Setup */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏦</span>
                    <h3 className="font-semibold text-white text-sm">Settlement Bank Account</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-medium">
                    Verified
                  </span>
                </div>

                <div className="space-y-3.5 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">Account Beneficiary Name</div>
                    <div className="font-semibold text-slate-100">{selectedApp.accountHolderName}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">UPI ID (VPA) for Customer QR</div>
                    <div className="font-mono text-violet-400 font-semibold">{selectedApp.upiId}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-400">Bank Name</div>
                      <div className="text-slate-200">{selectedApp.bankName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Account Ending</div>
                      <div className="font-mono text-slate-200">••••{selectedApp.accountNumber.slice(-4)}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Bank IFSC Code</div>
                    <div className="font-mono text-slate-300">{selectedApp.bankIfsc}</div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setEditingBank(true)}
                    className="text-xs text-violet-400 hover:text-violet-300 font-medium transition"
                  >
                    Modify Bank Details →
                  </button>
                </div>
              </div>

              {/* Card 2: Integration & API Key */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔑</span>
                    <h3 className="font-semibold text-white text-sm">Integration Credentials</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                    Live Key
                  </span>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">App API Key</div>
                    <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="font-mono text-xs text-slate-300 truncate select-all">{selectedApp.apiKey}</span>
                      <button
                        onClick={() => copyToClipboard(selectedApp.apiKey, 'key')}
                        className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded shrink-0 transition"
                      >
                        {copySuccess === 'key' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">Webhook URL</div>
                    <div className="font-mono text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 truncate">
                      {selectedApp.webhookUrl || 'Not configured'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">Return URL (Redirect)</div>
                    <div className="font-mono text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 truncate">
                      {selectedApp.returnUrl || 'Not configured'}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 text-xs text-slate-500">
                  Pass <code className="text-violet-400">X-API-Key: {selectedApp.apiKey.slice(0, 16)}...</code> when creating orders.
                </div>
              </div>
            </div>

            {/* Code Integration Example */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">How to Create an Order from {selectedApp.name}</h3>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `curl -X POST https://payment-gateway-web-kappa.vercel.app/api/orders \\\n  -H "X-API-Key: ${selectedApp.apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"amount": 250.00, "businessName": "${selectedApp.name}", "customerName": "Rohan", "customerEmail": "rohan@example.com"}'`,
                      'curl'
                    )
                  }
                  className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
                >
                  {copySuccess === 'curl' ? 'Copied snippet!' : 'Copy cURL'}
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto">
{`curl -X POST https://payment-gateway-web-kappa.vercel.app/api/orders \\
  -H "X-API-Key: ${selectedApp.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 250.00,
    "businessName": "${selectedApp.name}",
    "description": "Order #1024",
    "customerName": "Rohan Sharma",
    "customerEmail": "rohan@example.com"
  }'`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Edit Bank Details */}
      {editingBank && selectedApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl safe-bottom">
            {/* Mobile Drag Indicator */}
            <div className="sm:hidden w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h3 className="font-bold text-white text-base">Configure Settlement Bank Account</h3>
                <p className="text-xs text-slate-400 mt-0.5">App: {selectedApp.name}</p>
              </div>
              <button
                onClick={() => setEditingBank(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Beneficiary Name *</label>
                <input
                  type="text"
                  required
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  placeholder="e.g. Hari Singh or Business Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">UPI ID (VPA) *</label>
                <input
                  type="text"
                  required
                  value={bankForm.upiId}
                  onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-violet-500"
                  placeholder="e.g. 9630937033@sbi"
                />
                <p className="text-xs text-slate-500 mt-1">This UPI ID is embedded directly in payment QR codes for this app.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="e.g. State Bank of India"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number / Ending *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-violet-500"
                    placeholder="e.g. 2441"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bank IFSC Code *</label>
                <input
                  type="text"
                  required
                  value={bankForm.bankIfsc}
                  onChange={(e) => setBankForm({ ...bankForm, bankIfsc: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-violet-500"
                  placeholder="e.g. SBIN0002441"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBank(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium transition"
                >
                  {saveLoading ? 'Saving...' : 'Save Bank Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register New App */}
      {creatingApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl safe-bottom">
            {/* Mobile Drag Indicator */}
            <div className="sm:hidden w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h3 className="font-bold text-white text-base">Register New Client Application</h3>
                <p className="text-xs text-slate-400 mt-0.5">Setup per-app bank account and credentials</p>
              </div>
              <button
                onClick={() => setCreatingApp(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Application Name *</label>
                <input
                  type="text"
                  required
                  value={newAppForm.name}
                  onChange={(e) => setNewAppForm({ ...newAppForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  placeholder="e.g. My New Store"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={newAppForm.description}
                  onChange={(e) => setNewAppForm({ ...newAppForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  placeholder="e.g. Online retail storefront"
                />
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
                <div className="text-xs font-bold text-violet-400 uppercase tracking-wider">Settlement Bank Details</div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    required
                    value={newAppForm.accountHolderName}
                    onChange={(e) => setNewAppForm({ ...newAppForm, accountHolderName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">UPI ID (VPA)</label>
                  <input
                    type="text"
                    required
                    value={newAppForm.upiId}
                    onChange={(e) => setNewAppForm({ ...newAppForm, upiId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={newAppForm.bankName}
                      onChange={(e) => setNewAppForm({ ...newAppForm, bankName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Account Ending</label>
                    <input
                      type="text"
                      required
                      value={newAppForm.accountNumber}
                      onChange={(e) => setNewAppForm({ ...newAppForm, accountNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={newAppForm.bankIfsc}
                    onChange={(e) => setNewAppForm({ ...newAppForm, bankIfsc: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Webhook URL</label>
                  <input
                    type="url"
                    value={newAppForm.webhookUrl}
                    onChange={(e) => setNewAppForm({ ...newAppForm, webhookUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Return URL</label>
                  <input
                    type="url"
                    value={newAppForm.returnUrl}
                    onChange={(e) => setNewAppForm({ ...newAppForm, returnUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreatingApp(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium transition"
                >
                  {saveLoading ? 'Registering...' : 'Register App'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
