'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchMerchant();
  }, []);

  async function fetchMerchant() {
    try {
      const res = await fetch('/api/admin/merchant');
      const json = await res.json();
      if (json.success) {
        setMerchant(json.data);
      } else {
        setError(json.error?.message || 'Failed to fetch merchant');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/merchant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: merchant.name,
          upi_id: merchant.upi_id,
          bank_account: merchant.bank_account,
          bank_ifsc: merchant.bank_ifsc,
        }),
      });
      const json = await res.json();
      
      if (json.success) {
        setSuccess(true);
        setMerchant(json.data);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(json.error?.message || 'Failed to update merchant');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-slate-400">Loading settings...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Merchant Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your bank and UPI details used for generating payment QR codes.</p>
      </div>

      <div className="card p-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm font-medium border border-rose-500/20 bg-rose-500/10 text-rose-400">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 rounded-xl text-sm font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            Merchant details updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">Merchant Name</label>
            <input
              type="text"
              value={merchant?.name || ''}
              onChange={(e) => setMerchant({ ...merchant, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Ayurdhara"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">Primary UPI ID <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={merchant?.upi_id || ''}
              onChange={(e) => setMerchant({ ...merchant, upi_id: e.target.value })}
              className="input-field"
              placeholder="e.g. ayurdhara@upi"
              required
            />
            <p className="text-xs text-slate-500">This exact UPI ID will be encoded into all customer checkout QR codes.</p>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-slate-300">Bank Account Number (Optional)</label>
              <input
                type="text"
                value={merchant?.bank_account || ''}
                onChange={(e) => setMerchant({ ...merchant, bank_account: e.target.value })}
                className="input-field"
                placeholder="Account No"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-slate-300">Bank IFSC (Optional)</label>
              <input
                type="text"
                value={merchant?.bank_ifsc || ''}
                onChange={(e) => setMerchant({ ...merchant, bank_ifsc: e.target.value })}
                className="input-field"
                placeholder="IFSC Code"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
