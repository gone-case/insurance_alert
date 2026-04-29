import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Download, Edit2, Trash2, Phone, FileText,
  ShoppingCart, PauseCircle, PlayCircle, XCircle, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/Modal';
import LeadForm from '../components/LeadForm';
import { fmtDate, fmtCurrency, STATUS_COLORS, LEAD_STATUSES, daysUntil, urgencyBadge } from '../utils/helpers';

export default function LeadsPage() {
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, lead: null });
  const [deleteId, setDeleteId] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (status !== 'All') params.set('status', status);
      const { data } = await api.get(`/leads?${params}`);
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal.lead) {
        await api.put(`/leads/${modal.lead._id}`, form);
        toast.success('Lead updated');
      } else {
        await api.post('/leads', form);
        toast.success('Lead created');
      }
      setModal({ open: false, lead: null });
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id, action, label) => {
    try {
      await api.patch(`/leads/${id}/action`, { action });
      toast.success(`Marked as ${label}`);
      fetchLeads();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/leads/${deleteId}`);
      toast.success('Lead deleted');
      setDeleteId(null);
      fetchLeads();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ export: 'true' });
      if (status !== 'All') params.set('status', status);
      if (search) params.set('search', search);
      const response = await api.get(`/leads?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
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
          <input
            className="input pl-9" placeholder="Search by name, phone, policy..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select className="input w-auto py-2" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <button onClick={handleExport} className="btn-secondary">
          <Download className="w-4 h-4" /> CSV
        </button>
        <button onClick={() => setModal({ open: true, lead: null })} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Count */}
      <div className="text-xs text-slate-500">{total} lead{total !== 1 ? 's' : ''} found</div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Customer','Policy No','Type','Purchase Date','Premium','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">No leads found</td></tr>
              ) : leads.map(lead => {
                const days = daysUntil(lead.tentativePurchaseDate);
                return (
                  <tr key={lead._id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{lead.customerName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />{lead.phoneNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-lg">{lead.policyNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{lead.interestedPolicyType}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-slate-300">{fmtDate(lead.tentativePurchaseDate)}</div>
                      {days !== null && (
                        <span className={`badge mt-1 ${urgencyBadge(days)}`}>
                          {days > 0 ? `${days}d left` : days === 0 ? 'Today' : `${Math.abs(days)}d ago`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{fmtCurrency(lead.premiumAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[lead.status] || ''}`}>{lead.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {(lead.status === 'Interested' || lead.status === 'Pending') && (
                          <>
                            <button onClick={() => handleAction(lead._id, 'purchase', 'Purchased')}
                              className="p-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-800/50 transition-colors" title="Mark Purchased">
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleAction(lead._id, 'pause', 'Paused')}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors" title="Pause 7 Days">
                              <PauseCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleAction(lead._id, 'close', 'Closed')}
                              className="p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-800/50 transition-colors" title="Close Lead">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {lead.status === 'Paused' && (
                          <button onClick={() => handleAction(lead._id, 'continue', 'Active')}
                            className="p-1.5 rounded-lg bg-brand-900/30 text-brand-400 hover:bg-brand-800/50 transition-colors" title="Continue">
                            <PlayCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setModal({ open: true, lead })}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(lead._id)}
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

        {/* Pagination */}
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

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, lead: null })}
        title={modal.lead ? 'Edit Lead' : 'Add New Lead'} size="lg">
        <LeadForm initial={modal.lead} onSave={handleSave}
          onCancel={() => setModal({ open: false, lead: null })} loading={saving} />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-slate-300 text-sm">Are you sure you want to delete this lead? This action cannot be undone.</p>
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
