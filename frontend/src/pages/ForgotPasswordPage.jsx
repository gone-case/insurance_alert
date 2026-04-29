import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Smartphone, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(phone);
      toast.success('Reset code sent to your phone!');
      navigate('/reset-password', { state: { phone } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 shadow-2xl shadow-brand-900/60 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Smart Insurance</h1>
          <p className="text-slate-400 mt-1 text-sm">Reset your password</p>
        </div>

        <div className="card p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-2">Forgot Password?</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your phone number and we'll send you a 6-digit code to reset your password.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel" required
                  className="input pl-10"
                  placeholder="9876543210"
                  maxLength="10"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Enter your 10-digit registered number</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send className="w-4 h-4" /> Send Code</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center">
            <Link to="/login" className="text-sm text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
