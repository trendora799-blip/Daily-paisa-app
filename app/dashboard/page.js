'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('dailypaisa_user');

      if (!storedUser) {
        window.location.href = '/';
        return;
      }

      try {
        const localData = JSON.parse(storedUser);
        const res = await fetch(`/api/user?id=${localData.id}`);

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            if (data.user.isBanned) {
              localStorage.removeItem('dailypaisa_user');
              toast.error('Your account has been banned.');
              window.location.href = '/';
              return;
            }
            setUser(data.user);
            localStorage.setItem('dailypaisa_user', JSON.stringify(data.user));
          } else {
            setUser(localData);
          }
        } else {
          setUser(localData);
        }
      } catch (error) {
        console.error('Dashboard API error:', error);
        const localData = JSON.parse(localStorage.getItem('dailypaisa_user') || '{}');
        setUser(localData);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleClaimIncome = async () => {
    if (!user?.id) return toast.error('Please login again');

    setClaiming(true);
    try {
      const res = await fetch('/api/claim-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success(`🎉 ₹${data.amount} added to your balance!`);

      // Update user data with new balance
      setUser(prev => ({
        ...prev,
        balance: data.newBalance,
        earnings: (prev.earnings || 0) + data.amount,
        lastClaimDate: new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  const activeSubscriptions = (user.subscriptions || []).filter(
    sub => sub.active && new Date(sub.endDate) > new Date()
  );

  // Calculate total daily income from all active subscriptions
  const totalDailyIncome = activeSubscriptions.reduce((sum, sub) => sum + (sub.dailyIncome || 0), 0);

  // Check if user can claim today
  const today = new Date().toISOString().split('T')[0];
  const canClaim = user.lastClaimDate !== today && totalDailyIncome > 0;

  return (
    <div className="min-h-screen pb-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900 via-slate-900 to-black text-white">
      <div className="glass sticky top-0 z-40 px-4 py-3 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Dashboard</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-6">
        <div className="card text-center py-8 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
          <p className="text-slate-400 mb-2">Welcome back, {user.name}!</p>
          <p className="text-5xl font-bold grad-text mb-2">₹{user.balance || 0}</p>
          <p className="text-sm text-slate-400">Available Balance</p>
        </div>

        {/* ✅ CLAIM DAILY INCOME BUTTON */}
        {totalDailyIncome > 0 && (
          <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-bold text-lg">Daily Income</h3>
                <p className="text-emerald-100 text-sm">Total: ₹{totalDailyIncome}/day</p>
              </div>
              <span className="text-xs text-emerald-100 bg-white/20 px-3 py-1 rounded-full">
                {canClaim ? '🟢 Ready' : '✅ Claimed'}
              </span>
            </div>
            <button
              onClick={handleClaimIncome}
              disabled={!canClaim || claiming}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                canClaim 
                  ? 'bg-white text-emerald-700 hover:bg-emerald-50 active:scale-95 shadow-md' 
                  : 'bg-white/30 text-white/70 cursor-not-allowed'
              }`}
            >
              {claiming ? 'Processing...' : canClaim ? `💰 Claim ₹${totalDailyIncome}` : '✅ Claimed for Today'}
            </button>
            {!canClaim && user.lastClaimDate === today && (
              <p className="text-center text-emerald-100 text-xs mt-2">Come back tomorrow for more!</p>
            )}
          </div>
        )}

        {activeSubscriptions.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2 px-1">
              <span className="text-2xl">💎</span> Active Subscriptions ({activeSubscriptions.length})
            </h3>
            {activeSubscriptions.map((sub, index) => (
              <div key={sub.id || index} className="card bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💎</span>
                    <h4 className="font-bold text-white text-lg">{sub.packTitle}</h4>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">ACTIVE</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Purchase Amount</p>
                    <p className="text-sm font-bold text-white">₹{sub.price.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Daily Income</p>
                    <p className="text-sm font-bold text-emerald-400">₹{sub.dailyIncome}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-[10px] text-slate-400">Expires: {new Date(sub.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Link href="/subscription" className="card bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 p-5 flex items-center justify-between hover:scale-[1.02] transition">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="text-2xl">💎</span> No Active Plans
              </h3>
              <p className="text-xs text-slate-400 mt-1">Subscribe to start earning daily income!</p>
            </div>
            <span className="text-slate-400 text-xl">→</span>
          </Link>
        )}

        <div className="card">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span> Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">💰 Total Deposited</span>
              <span className="font-bold text-blue-400 text-lg">₹{user.totalDeposits || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">💵 Total Earnings (Profits Only)</span>
              <span className="font-bold text-emerald-400 text-lg">₹{user.earnings || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">⭐ VIP Level</span>
              <span className="font-bold text-brand-400 text-lg">VIP {user.vipLevel || 1}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">👥 Team Members</span>
              <span className="font-bold text-lg">{user.team?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  }
