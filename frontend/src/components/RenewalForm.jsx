import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { POLICY_TYPES } from '../utils/helpers';

const INITIAL = {
  customerName: '', phoneNumber: '', policyNumber: '',
  policyType: 'Life', renewalDueDate: '',
  lastPremiumPaid: '', notes: '', renewalStatus: 'Pending',
};

export default function RenewalForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(INITIAL);

  useEffect(() => {
    if (initial) {
      setForm({
        ...INITIAL, ...initial,
        renewalDueDate: initial.renewalDueDate
          ? new Date(initial.renewalDueDate).toISOString().split('T')[0]
          : '',
        lastPremiumPaid: initial.lastPremiumPaid ?? '',
      });
    } else {
      setForm(INITIAL);
    }
  }, [initial]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Customer Name *</label>
          <input className="input" required value={form.customerName}
            onChange={e => set('customerName', e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label className="label">Phone Number *</label>
          <input className="input" required value={form.phoneNumber}
            onChange={e => set('phoneNumber', e.target.value)} placeholder="+91 9xxxxxxxxx" />
        </div>
        <div>
          <label className="label">Policy Number *</label>
          <input className="input" required value={form.policyNumber}
            onChange={e => set('policyNumber', e.target.value.toUpperCase())} placeholder="POL-001"
            disabled={!!initial} />
        </div>
        <div>
          <label className="label">Policy Type *</label>
          <select className="input" value={form.policyType}
            onChange={e => set('policyType', e.target.value)}>
            {POLICY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Renewal Due Date *</label>
          <input type="date" className="input" required value={form.renewalDueDate}
            onChange={e => set('renewalDueDate', e.target.value)} />
        </div>
        <div>
          <label className="label">Last Premium Paid (₹)</label>
          <input type="number" className="input" value={form.lastPremiumPaid} min="0"
            onChange={e => set('lastPremiumPaid', e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="label">Renewal Status</label>
          <select className="input" value={form.renewalStatus} onChange={e => set('renewalStatus', e.target.value)}>
            {['Pending','Renewed','Expired','Paused'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input resize-none" rows={3} value={form.notes}
          onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Renewal
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </form>
  );
}
