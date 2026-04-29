import { useState, useEffect } from 'react';
import { Bell, Phone, RefreshCw, ShoppingCart, PauseCircle, PlayCircle, XCircle, CheckCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { fmtDate, fmtCurrency, urgencyBadge, urgencyColor } from '../utils/helpers';

function UrgencyLabel({ days }) {
  if (days < 0) return <span className="text-red-400 font-semibold">OVERDUE ({Math.abs(days)}d)</span>;
  if (days === 0) return <span className="text-red-400 font-semibold animate-pulse">DUE TODAY</span>;
  if (days <= 3) return <span className="text-red-400 font-semibold">{days} days left</span>;
  if (days <= 7) return <span className="text-orange-400 font-semibold">{days} days left</span>;
  if (days <= 15) return <span className="text-yellow-400 font-medium">{days} days left</span>;
  return <span className="text-green-400">{days} days left</span>;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/alerts');
      setAlerts(data);
    } catch (err) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleAction = async (alert, action, label) => {
    const url = alert.type === 'lead'
      ? `/leads/${alert._id}/action`
      : `/renewals/${alert._id}/action`;
    try {
      await api.patch(url, { action });
      toast.success(`${label} — reminders stopped`);
      fetchAlerts();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const triggerReminders = async () => {
    setTriggering(true);
    try {
      await api.post('/alerts/trigger');
      toast.success('Reminder job triggered! Notifications will be sent shortly.');
    } catch (err) {
      toast.error('Failed to trigger reminders');
    } finally {
      setTriggering(false);
    }
  };

  const filtered = alerts.filter(a => filter === 'all' || a.type === filter);
  const critical = alerts.filter(a => a.daysUntilDue <= 3).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {['all','lead','renewal'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}>
              {f === 'all' ? `All (${alerts.length})` : f === 'lead' ? `Leads (${alerts.filter(a=>a.type==='lead').length})` : `Renewals (${alerts.filter(a=>a.type==='renewal').length})`}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <button onClick={fetchAlerts} className="btn-secondary" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={triggerReminders} disabled={triggering} className="btn-primary">
            <Zap className="w-4 h-4" />
            {triggering ? 'Sending...' : 'Send Reminders'}
          </button>
        </div>
      </div>

      {/* Critical banner */}
      {critical > 0 && (
        <div className="card p-3 border-red-800/50 bg-red-900/10 flex items-center gap-3">
          <Bell className="w-4 h-4 text-red-400 animate-pulse-soft flex-shrink-0" />
          <span className="text-sm text-red-300">
            <span className="font-bold">{critical} critical alert{critical > 1 ? 's' : ''}</span> — due within 3 days or overdue
          </span>
        </div>
      )}

      {/* Alert cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No active alerts</p>
          <p className="text-slate-700 text-sm mt-1">All leads and renewals are up to date</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <div key={`${alert.type}-${alert._id}`} className={`card p-4 border transition-all ${
              alert.daysUntilDue <= 0 ? 'border-red-800/60 bg-red-950/10' :
              alert.daysUntilDue <= 3 ? 'border-red-800/40' :
              alert.daysUntilDue <= 7 ? 'border-orange-800/40' : ''
            }`}>
              <div className="flex flex-wrap items-start gap-4">
                {/* Type badge */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  alert.type === 'lead' ? 'bg-blue-900/30 border border-blue-800/40' : 'bg-purple-900/30 border border-purple-800/40'
                }`}>
                  {alert.type === 'lead'
                    ? <ShoppingCart className="w-5 h-5 text-blue-400" />
                    : <RefreshCw className="w-5 h-5 text-purple-400" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{alert.customerName}</span>
                    <span className={`badge text-xs ${alert.type === 'lead' ? 'bg-blue-900/40 text-blue-400 border border-blue-800/40' : 'bg-purple-900/40 text-purple-400 border border-purple-800/40'}`}>
                      {alert.type === 'lead' ? 'Lead' : 'Renewal'}
                    </span>
                    <span className="font-mono text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg">{alert.policyNumber}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{alert.phoneNumber}</span>
                    <span>{alert.policyType}</span>
                    <span>Due: {fmtDate(alert.dueDate)}</span>
                    {alert.premiumAmount && <span>₹{Number(alert.premiumAmount).toLocaleString('en-IN')}</span>}
                  </div>
                  <div className="mt-1">
                    <UrgencyLabel days={alert.daysUntilDue} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {alert.type === 'lead' ? (
                    <>
                      <button onClick={() => handleAction(alert, 'purchase', 'Purchased')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-800/50 text-xs font-medium transition-colors border border-green-800/40">
                        <ShoppingCart className="w-3.5 h-3.5" /> Purchased
                      </button>
                      <button onClick={() => handleAction(alert, 'pause', 'Paused 7d')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs font-medium transition-colors border border-slate-700">
                        <PauseCircle className="w-3.5 h-3.5" /> Pause 7d
                      </button>
                      <button onClick={() => handleAction(alert, 'close', 'Closed')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-800/50 text-xs font-medium transition-colors border border-red-800/40">
                        <XCircle className="w-3.5 h-3.5" /> Close
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleAction(alert, 'renew', 'Renewed')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-800/50 text-xs font-medium transition-colors border border-green-800/40">
                        <CheckCircle className="w-3.5 h-3.5" /> Renewed
                      </button>
                      <button onClick={() => handleAction(alert, 'pause', 'Paused 7d')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs font-medium transition-colors border border-slate-700">
                        <PauseCircle className="w-3.5 h-3.5" /> Pause 7d
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
