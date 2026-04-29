import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, RefreshCw, Bell, TrendingUp, CheckCircle, XCircle,
  Clock, AlertTriangle, Activity, ArrowRight, Zap, RefreshCw as RefreshIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { fmtDateTime } from '../utils/helpers';

function StatCard({ icon: Icon, label, value, sub, color = 'brand', to }) {
  const colorMap = {
    brand:  { bg: 'bg-brand-600/15',  text: 'text-brand-400',  border: 'border-brand-600/20' },
    green:  { bg: 'bg-green-600/15',  text: 'text-green-400',  border: 'border-green-600/20' },
    yellow: { bg: 'bg-yellow-600/15', text: 'text-yellow-400', border: 'border-yellow-600/20' },
    red:    { bg: 'bg-red-600/15',    text: 'text-red-400',    border: 'border-red-600/20' },
    orange: { bg: 'bg-orange-600/15', text: 'text-orange-400', border: 'border-orange-600/20' },
  };
  const c = colorMap[color];

  const inner = (
    <div className={`card p-5 group hover:border-slate-700 transition-all duration-200 ${to ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {to && <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />}
      </div>
      <div className="text-2xl font-bold text-white">{value ?? <span className="text-slate-600">—</span>}</div>
      <div className="text-sm text-slate-400 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </div>
  );

  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const triggerReminders = async () => {
    setTriggering(true);
    try {
      await api.post('/alerts/trigger');
      toast.success('Reminder job triggered!');
      // Refresh after a small delay
      setTimeout(fetchDashboard, 2000);
    } catch (err) {
      toast.error('Failed to trigger reminders');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const d = data || {};

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Welcome back, {d.userName || 'Agent'}</h2>
          <p className="text-xs text-slate-500 mt-1">Here is what is happening across your portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDashboard} className="btn-secondary py-2" disabled={loading}>
            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={triggerReminders} 
            disabled={triggering} 
            className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shadow-lg shadow-brand-900/40"
          >
            <Zap className={`w-4 h-4 ${triggering ? 'animate-pulse' : ''}`} />
            {triggering ? 'Processing...' : 'Send All Reminders Now'}
          </button>
        </div>
      </div>

      {/* Today's Alerts banner */}
      {(d.totalAlerts > 0) && (
        <Link to="/alerts" className="block card p-4 border-brand-600/40 bg-brand-900/20 hover:border-brand-500/60 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600/30 flex items-center justify-center animate-pulse-soft">
              <Bell className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-brand-300">
                {d.totalAlerts} Alert{d.totalAlerts !== 1 ? 's' : ''} Due Today
              </div>
              <div className="text-xs text-slate-500">Click to view and take action</div>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-500 ml-auto" />
          </div>
        </Link>
      )}

      {/* Leads Section */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> Leads Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}       label="Total Leads"       value={d.leads?.total}     color="brand"  to="/leads" />
          <StatCard icon={Clock}       label="Pending Follow-up" value={d.leads?.pending}    color="yellow" to="/leads?status=Pending" />
          <StatCard icon={CheckCircle} label="Purchased"         value={d.leads?.purchased}  color="green"  to="/leads?status=Purchased" />
          <StatCard icon={XCircle}     label="Closed Leads"      value={d.leads?.closed}     color="red"    to="/leads?status=Not+Interested" />
        </div>
      </div>

      {/* Renewals Section */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Renewals Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={RefreshCw}    label="Total Renewals"  value={d.renewals?.total}    color="brand"  to="/renewals" />
          <StatCard icon={AlertTriangle} label="Pending Renewal" value={d.renewals?.pending}  color="orange" to="/renewals?status=Pending" />
          <StatCard icon={CheckCircle}  label="Renewed"          value={d.renewals?.renewed}  color="green"  to="/renewals?status=Renewed" />
          <StatCard icon={XCircle}      label="Expired"          value={d.renewals?.expired}  color="red"    to="/renewals?status=Expired" />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-white">Next 7 Days</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-slate-800">
              <span className="text-sm text-slate-400">Lead follow-ups due</span>
              <span className="text-sm font-bold text-yellow-400">{d.leads?.upcoming7Days ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-slate-400">Renewals due</span>
              <span className="text-sm font-bold text-orange-400">{d.renewals?.upcoming7Days ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-white">Recent Notifications</h3>
          </div>
          {d.recentActivity?.length ? (
            <div className="space-y-2">
              {d.recentActivity.slice(0, 4).map(log => (
                <div key={log._id} className="flex items-start gap-2.5 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${log.status === 'sent' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-300 truncate">{log.customerName} — {log.policyNumber}</div>
                    <div className="text-slate-600">{fmtDateTime(log.createdAt)} · {log.channel}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
