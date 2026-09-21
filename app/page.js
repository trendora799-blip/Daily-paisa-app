'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 'login', 'otp-login', 'register', 'otp-register', 'forgot-password', 'reset-password', 'support'
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', referralCode: '',
    otp: '', newPassword: '', confirmPassword: '',
    supportSubject: '', supportMessage: ''
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setForm((prev) => ({ ...prev, referralCode: refCode }));
      setView('register');
      toast.success(`Referral code ${refCode} applied!`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // ✅ Send OTP API
  const handleSendOtp = async (purpose) => {
    if (!form.email) return toast.error('Please enter your email first');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('OTP sent to your email!');
      setTimer(60);
      if (purpose === 'login') setView('otp-login');
      if (purpose === 'register') setView('otp-register');
      if (purpose === 'reset') setView('reset-password');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // ✅ Normal Login
  const handleNormalLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'login', email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('dailypaisa_user', JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name}!`);
      window.location.href = '/dashboard';
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // ✅ OTP Login
  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: form.otp, purpose: 'login' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('dailypaisa_user', JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name}!`);
      window.location.href = '/dashboard';
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // ✅ OTP Registration
  const handleOtpRegister = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          otp: form.otp, 
          purpose: 'register',
          userData: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            referralCode: form.referralCode
          }
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Account created successfully!');
      localStorage.setItem('dailypaisa_user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // ✅ Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.newPassword.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          otp: form.otp, 
          purpose: 'reset', 
          newPassword: form.newPassword 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Password reset successfully! Please login.');
      setView('login');
      setForm({ ...form, otp: '', newPassword: '', confirmPassword: '' });
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // ✅ Submit Support Ticket
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!form.supportSubject || !form.supportMessage) {
      return toast.error('Please fill in all fields');
    }

    setLoading(true);
    try {
      const storedUser = localStorage.getItem('dailypaisa_user');
      const userData = storedUser ? JSON.parse(storedUser) : null;

      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData?.id || 'anonymous',
          userName: userData?.name || 'Guest',
          userEmail: userData?.email || form.email,
          subject: form.supportSubject,
          message: form.supportMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Support ticket submitted successfully!');
      setForm({ ...form, supportSubject: '', supportMessage: '' });
      setView('login');
    } catch (err) {
      toast.error(err.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in bg-slate-900 text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl grad-bg items-center justify-center text-3xl mb-4 shadow-lg shadow-brand-500/30">💰</div>
          <h1 className="text-4xl font-extrabold grad-text">Daily Paisa</h1>
          <p className="text-slate-400 mt-1">Track earnings · Build your team · Grow daily</p>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8">
          {/* View Tabs (Only for login/register views) */}
          {(view === 'login' || view === 'register' || view === 'otp-login' || view === 'otp-register') && (
            <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6">
              <button onClick={() => setView('login')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${view === 'login' || view === 'otp-login' ? 'grad-bg text-white shadow' : 'text-slate-400'}`}>Login</button>
              <button onClick={() => setView('register')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${view === 'register' || view === 'otp-register' ? 'grad-bg text-white shadow' : 'text-slate-400'}`}>Register</button>
            </div>
          )}

          {/* Support Button (Always visible except on support page) */}
          {view !== 'support' && (
            <button 
              onClick={() => setView('support')} 
              className="w-full mb-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition text-sm font-semibold text-slate-300 flex items-center justify-center gap-2"
            >
              🎧 Need Help? Contact Support
            </button>
          )}

          {/* 1. Normal Login View */}
          {view === 'login' && (
            <form onSubmit={handleNormalLogin} className="space-y-4">
              <input type="email" placeholder="Email Address" value={form.email} onChange={set('email')} required className="input" />
              <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required className="input" />

              <div className="flex flex-col gap-2 text-sm">
                <button type="button" onClick={() => handleSendOtp('login')} className="text-brand-400 hover:underline text-left">
                   Login with OTP
                </button>
                <button type="button" onClick={() => { setForm({...form, email: ''}); setView('forgot-password'); }} className="text-slate-400 hover:text-white text-left">
                   Forgot Password?
                </button>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? '...' : 'Login'}</button>
            </form>
          )}

          {/* 2. OTP Login View */}
          {view === 'otp-login' && (
            <form onSubmit={handleOtpLogin} className="space-y-4">
              <button type="button" onClick={() => setView('login')} className="text-sm text-slate-400 hover:text-white mb-2">← Back to Password Login</button>
              <input type="email" placeholder="Email Address" value={form.email} onChange={set('email')} required className="input" disabled={timer > 0 && form.otp} />

              <div className="flex gap-2">
                <input type="text" placeholder="Enter 6-digit OTP" value={form.otp} onChange={set('otp')} maxLength={6} required className="input flex-1 font-mono text-center text-xl tracking-widest" />
                <button type="button" onClick={() => handleSendOtp('login')} disabled={otpLoading || timer > 0} className="px-4 py-3 rounded-xl bg-brand-500/20 text-brand-400 font-semibold hover:bg-brand-500/30 transition disabled:opacity-50 whitespace-nowrap">
                  {timer > 0 ? `${timer}s` : otpLoading ? '...' : 'Send OTP'}
                </button>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Verifying...' : 'Verify & Login'}</button>
            </form>
          )}

          {/* 3. OTP Registration View */}
          {view === 'otp-register' && (
            <form onSubmit={handleOtpRegister} className="space-y-3">
              <button type="button" onClick={() => setView('register')} className="text-sm text-slate-400 hover:text-white mb-2">← Back to Normal Register</button>
              <input type="email" placeholder="Email Address" value={form.email} onChange={set('email')} required className="input" disabled />

              <div className="flex gap-2">
                <input type="text" placeholder="Enter 6-digit OTP" value={form.otp} onChange={set('otp')} maxLength={6} required className="input flex-1 font-mono text-center text-xl tracking-widest" />
                <button type="button" onClick={() => handleSendOtp('register')} disabled={otpLoading || timer > 0} className="px-4 py-3 rounded-xl bg-brand-500/20 text-brand-400 font-semibold hover:bg-brand-500/30 transition disabled:opacity-50 whitespace-nowrap">
                  {timer > 0 ? `${timer}s` : otpLoading ? '...' : 'Send OTP'}
                </button>
              </div>

              <input type="text" placeholder="Full Name" value={form.name} onChange={set('name')} required className="input" />
              <input type="tel" placeholder="Phone Number" value={form.phone} onChange={set('phone')} required className="input" />
              <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={set('password')} required className="input" />
              <input type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} required className="input" />
              <input type="text" placeholder="Referral Code (Optional)" value={form.referralCode} onChange={set('referralCode')} className="input" />

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Creating Account...' : 'Create Account'}</button>
            </form>
          )}

          {/* 4. Normal Register View */}
          {view === 'register' && (
            <form onSubmit={(e) => { e.preventDefault(); handleSendOtp('register'); }} className="space-y-3">
              <input type="text" placeholder="Full Name" value={form.name} onChange={set('name')} required className="input" />
              <input type="email" placeholder="Email Address" value={form.email} onChange={set('email')} required className="input" />
              <input type="tel" placeholder="Phone Number" value={form.phone} onChange={set('phone')} required className="input" />
              <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={set('password')} required className="input" />
              <input type="text" placeholder="Referral Code (Optional)" value={form.referralCode} onChange={set('referralCode')} className="input" />

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? '...' : 'Register with OTP'}</button>
              <p className="text-xs text-center text-slate-400 mt-2">We'll send an OTP to verify your email</p>
            </form>
          )}

          {/* 5. Forgot Password (Request OTP) View */}
          {view === 'forgot-password' && (
            <div className="space-y-4">
              <button type="button" onClick={() => setView('login')} className="text-sm text-slate-400 hover:text-white mb-2">← Back to Login</button>
              <h3 className="text-lg font-bold text-center mb-2">Reset Password</h3>
              <p className="text-sm text-slate-400 text-center mb-4">Enter your email to receive a password reset OTP.</p>

              <input type="email" placeholder="Email Address" value={form.email} onChange={set('email')} required className="input" />

              <button type="button" onClick={() => handleSendOtp('reset')} disabled={otpLoading || timer > 0} className="btn-primary w-full disabled:opacity-50">
                {timer > 0 ? `Resend in ${timer}s` : otpLoading ? 'Sending...' : 'Send Reset OTP'}
              </button>
            </div>
          )}

          {/* 6. Reset Password (Verify OTP & New Password) View */}
          {view === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <button type="button" onClick={() => setView('forgot-password')} className="text-sm text-slate-400 hover:text-white mb-2">← Back</button>

              <div className="flex gap-2">
                <input type="text" placeholder="Enter 6-digit OTP" value={form.otp} onChange={set('otp')} maxLength={6} required className="input flex-1 font-mono text-center text-xl tracking-widest" />
                <button type="button" onClick={() => handleSendOtp('reset')} disabled={otpLoading || timer > 0} className="px-4 py-3 rounded-xl bg-brand-500/20 text-brand-400 font-semibold hover:bg-brand-500/30 transition disabled:opacity-50 whitespace-nowrap">
                  {timer > 0 ? `${timer}s` : otpLoading ? '...' : 'Resend'}
                </button>
              </div>

              <input type="password" placeholder="New Password (min 6 chars)" value={form.newPassword} onChange={set('newPassword')} required className="input" />
              <input type="password" placeholder="Confirm New Password" value={form.confirmPassword} onChange={set('confirmPassword')} required className="input" />

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Resetting...' : 'Reset Password'}</button>
            </form>
          )}

          {/* 7. Support System View */}
          {view === 'support' && (
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <button type="button" onClick={() => setView('login')} className="text-sm text-slate-400 hover:text-white mb-2">← Back to Login</button>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2"></div>
                <h3 className="text-lg font-bold">Support Center</h3>
                <p className="text-sm text-slate-400">We're here to help! Submit your query below.</p>
              </div>

              <input 
                type="email" 
                placeholder="Your Email (optional if logged in)" 
                value={form.email} 
                onChange={set('email')} 
                className="input" 
              />
              <input 
                type="text" 
                placeholder="Subject" 
                value={form.supportSubject} 
                onChange={set('supportSubject')} 
                required 
                className="input" 
              />
              <textarea 
                placeholder="Describe your issue in detail..." 
                value={form.supportMessage} 
                onChange={set('supportMessage')} 
                required 
                rows={5}
                className="input resize-none"
              />

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>

              <div className="text-center text-xs text-slate-400 mt-4">
                <p>Response time: Usually within 24 hours</p>
                <p>For urgent issues, email: support@dailypaisa.com</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
                                                             }
