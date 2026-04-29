import { useState } from 'react';
import { User, Mail, Smartphone, Lock, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updates = { ...form };
      if (!updates.password) delete updates.password;
      await updateProfile(updates);
      toast.success('Profile updated successfully!');
      setForm(f => ({ ...f, password: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-600/20 flex items-center justify-center">
          <User className="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          <p className="text-slate-500">Manage your account details and security</p>
        </div>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text" required
                  className="input pl-10"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email" required
                  className="input pl-10"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel" required
                  className="input pl-10"
                  placeholder="9876543210"
                  maxLength="10"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                />
              </div>
            </div>

            <div>
              <label className="label">Change Password (optional)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  className="input pl-10"
                  placeholder="Leave blank to keep current"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="bg-brand-900/10 border border-brand-800/30 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Your phone number is used for account recovery. If you change it, make sure you have access to the new number for future password resets.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={loading} className="btn-primary px-8">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
