import { useState, useEffect } from 'react';
import { UserPlus, User, Shield, Mail, Smartphone, Trash2, Power, PowerOff, Search, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', email: '', phone: '', password: '', role: 'agent' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/users', newForm);
      toast.success('User created successfully');
      setShowAddModal(false);
      setNewForm({ name: '', email: '', phone: '', password: '', role: 'agent' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user) => {
    try {
      await api.patch(`/auth/users/${user._id}/status`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-500 text-sm">Create and manage agent accounts</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Add New Agent
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              className="input pl-10 py-2 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/30">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-2" />
                    <span className="text-slate-500">Loading users...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user._id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold">
                          {user.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{user.name}</div>
                          <div className="text-xs text-slate-500">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-500" /> {user.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Smartphone className="w-3.5 h-3.5 text-slate-500" /> {user.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                        <span className={`text-xs font-medium ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {user.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => toggleStatus(user)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isActive 
                            ? 'text-yellow-500 hover:bg-yellow-500/10' 
                            : 'text-green-500 hover:bg-green-500/10'
                        }`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-scale-in">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-400" /> Create New Account
            </h2>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text" required
                  className="input"
                  placeholder="Agent Name"
                  value={newForm.name}
                  onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email" required
                  className="input"
                  placeholder="agent@insurance.com"
                  value={newForm.email}
                  onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Phone Number (10 digits)</label>
                <input
                  type="tel" required maxLength="10"
                  className="input"
                  placeholder="9876543210"
                  value={newForm.phone}
                  onChange={e => setNewForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                />
              </div>
              <div>
                <label className="label">Initial Password</label>
                <input
                  type="password" required minLength="6"
                  className="input"
                  placeholder="••••••••"
                  value={newForm.password}
                  onChange={e => setNewForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select 
                  className="input"
                  value={newForm.role}
                  onChange={e => setNewForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 justify-center"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
