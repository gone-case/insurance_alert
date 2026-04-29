import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Download, Edit2, Trash2, Phone,
  CheckCircle, PauseCircle, PlayCircle, XCircle, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/Modal';
import RenewalForm from '../components/RenewalForm';
import { fmtDate, fmtCurrency, STATUS_COLORS, RENEWAL_STATUSES, daysUntil, urgencyBadge } from '../utils/helpers';

export default function RenewalsPage() {
  const [searchParams] = useSearchParams();
  const [renewals, setRenewals] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, renewal: null });
  const [deleteId, setDeleteId] = useState(null);

  const fetchRenewals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (status !== 'All') params.set('status', status);
      const { data } = await api.get(`/renewals?${params}`);
      setRenewals(data.renewals);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load renewals');
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { fetchRenewals(); }, [fetchRenewals]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal.renewal) {
        await api.put(`/renewals/${modal.renewal._id}`, form);
        toast.success('Renewal updated');
      } else {
        await api.post('/renewals', form);
        toast.success('Renewal created');
      }
      setModal({ open: false, renewal: null });
      fetchRenewals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id, action, label) => {
    try {
      await api.patch(`/renewals/${id}/action`, { action });
      toast.success(`Marked as ${label}`);
      fetchRenewals();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/renewals/${deleteId}`);
      toast.success('Renewal deleted');
      setDeleteId(null);
      fetchRenewals();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ export: 'true' });
      if (status !== 'All') params.set('status', status);
      if (search) params.set('search', search);
      const response = await api.get(`/renewals?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a'); a.href = url; a.download = 'renewals.csv'; a.click();
      toast.success('CSV exported');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const pages = Math.ceil(total / 15);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9" placeholder="Search by name, phone, policy..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select className="input w-auto py-2" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            {RENEWAL_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download className="w-4 h-4" /> CSV
        </button>
        <button onClick={() => setModal({ open: true, renewal: null })} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Renewal
        </button>
      </div>

      <div className="text-xs text-slate-500">{total} renewal{total !== 1 ? 's' : ''} found</div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Customer','Policy No','Type','Due Date','Last Premium','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Loading...</td></tr>
              ) : renewals.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">No renewals found</td></tr>
              ) : renewals.map(renewal => {
                const days = daysUntil(renewal.renewalDueDate);
                return (
                  <tr key={renewal._id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{renewal.customerName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />{renewal.phoneNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-lg">{renewal.policyNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{renewal.policyType}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-slate-300">{fmtDate(renewal.renewalDueDate)}</div>
                      {days !== null && renewal.renewalStatus === 'Pending' && (
                        <span className={`badge mt-1 ${urgencyBadge(days)}`}>
                          {days > 0 ? `${days}d left` : days === 0 ? 'Today' : `${Math.abs(days)}d ago`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{fmtCurrency(renewal.lastPremiumPaid)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[renewal.renewalStatus] || ''}`}>{renewal.renewalStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {renewal.renewalStatus === 'Pending' && (
                          <>
                            <button onClick={() => handleAction(renewal._id, 'renew', 'Renewed')}
                              className="p-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-800/50 transition-colors" title="Mark Renewed">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleAction(renewal._id, 'pause', 'Paused')}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors" title="Pause 7 Days">
                              <PauseCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleAction(renewal._id, 'expire', 'Expired')}
                              className="p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-800/50 transition-colors" title="Mark Expired">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {renewal.renewalStatus === 'Paused' && (
                          <button onClick={() => handleAction(renewal._id, 'continue', 'Active')}
                            className="p-1.5 rounded-lg bg-brand-900/30 text-brand-400 hover:bg-brand-800/50 transition-colors" title="Continue">
                            <PlayCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setModal({ open: true, renewal })}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(renewal._id)}
                          className="p-1.5 rounded-lg bg-red-900/20 text-red-500 hover:bg-red-900/40 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-800">
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, renewal: null })}
        title={modal.renewal ? 'Edit Renewal' : 'Add New Renewal'} size="lg">
        <RenewalForm initial={modal.renewal} onSave={handleSave}
          onCancel={() => setModal({ open: false, renewal: null })} loading={saving} />
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-slate-300 text-sm">Are you sure you want to delete this renewal?</p>
          <div className="flex gap-3">
            <button onClick={handleDelete} className="btn-danger flex-1 justify-center">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
