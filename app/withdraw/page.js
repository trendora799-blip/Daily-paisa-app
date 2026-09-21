'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function WithdrawPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [vipData, setVipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('dailypaisa_user');
      if (!storedUser) return router.push('/');

      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);

        const res = await fetch(`/api/withdraw?userId=${userData.id}`);
        const data = await res.json();
        if (res.ok) setVipData(data);

        await fetchWithdrawHistory(userData.id);
      } catch (error) { 
        console.error('Auth Error:', error); 
      } finally { 
        setLoading(false); 
      }
    };
    checkAuth();
  }, [router]);

  const fetchWithdrawHistory = async (userId) => {
    if (!userId) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    try {
      // ✅ ADDED: &v=${Date.now()} to force the browser to bypass any cached 404 errors
      const res = await fetch(`/api/withdrawals?userId=${userId}&v=${Date.now()}`);

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API endpoint not found. Please check if /api/withdrawals/route.js exists in the User App.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch withdrawals');
      }

      const withdrawals = Array.isArray(data) ? data : [];
      setWithdrawHistory(withdrawals);
    } catch (error) { 
      console.error('Withdraw history error:', error);
      toast.error(error.message || 'Failed to load withdrawal history');
      setWithdrawHistory([]); 
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vipData || !user) return toast.error('Please wait for page to load');

    if (!user.accountHolderName || user.accountHolderName.trim().length < 3) {
      toast.error('Please save your Account Holder Name in your Profile first!');
      return router.push('/profile');
    }
    if (!user.bankAccount || user.bankAccount.trim().length < 9) {
      toast.error('Please save your Bank Account in your Profile first!');
      return router.push('/profile');
    }
    if (!user.ifscCode || user.ifscCode.trim().length < 11) {
      toast.error('Please save your IFSC Code in your Profile first!');
      return router.push('/profile');
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return toast.error('Enter a valid amount');

    if (numAmount < 150) {
      return toast.error(`Minimum withdrawal amount is ₹150`);
    }

    if (numAmount > vipData.limits.max) {
      return toast.error(`Maximum withdrawal is ₹${vipData.limits.max}`);
    }

    const withdrawableBalance = (user.earnings || 0) - (user.totalWithdrawn || 0);

    if (numAmount > withdrawableBalance) {
      return toast.error(`You can only withdraw earned profits. Max withdrawable: ₹${withdrawableBalance}`);
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, amount: numAmount, 
          accountHolderName: user.accountHolderName,
          bankAccount: user.bankAccount, ifscCode: user.ifscCode 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Withdrawal requested successfully!');
      const updatedUser = { 
        ...user, 
        balance: user.balance - numAmount, 
        totalWithdrawn: (user.totalWithdrawn || 0) + numAmount,
      };
      localStorage.setItem('dailypaisa_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setAmount('');

      setTimeout(() => {
        fetchWithdrawHistory(user.id);
      }, 1500);
    } catch (error) { 
      toast.error(error.message || 'Failed to submit request'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user || !vipData) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">Failed to load data</div>;

  const withdrawableBalance = (user.earnings || 0) - (user.totalWithdrawn || 0);

  return (
    <div className="min-h-screen pb-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900 via-slate-900 to-black text-white">
      <div className="glass sticky top-0 z-40 px-4 py-3 mb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition">← Back</button>
          <h1 className="text-lg font-bold">Withdraw Funds</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-6">
        <div className="card bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Current Status</p>
              <h2 className="text-2xl font-bold text-white">VIP {vipData.vipLevel}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Deposited</p>
              <p className="text-lg font-bold text-emerald-400">₹{vipData.totalDeposits || 0}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-3 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">Min Withdraw</p>
              <p className="font-bold text-white text-lg">150</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">Max Withdraw</p>
              <p className="font-bold text-white text-lg">₹{vipData.limits.max}</p>
            </div>
          </div>
        </div>

        <div className="card text-center py-6 bg-gradient-to-br from-emerald-600/10 to-green-600/10 border border-emerald-500/30">
          <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Withdrawable Balance (Profits Only)</p>
          <p className="text-4xl font-bold text-emerald-400 mb-2">₹{withdrawableBalance}</p>
          <p className="text-xs text-slate-500">Total Balance: ₹{user.balance || 0} • Total Earned: ₹{user.earnings || 0}</p>
          <p className="text-[10px] text-yellow-400 mt-1">⚠️ Minimum withdrawal: ₹150 • No cooldown - withdraw daily!</p>
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-3">Withdrawal Details</h3>
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4 flex flex-col gap-2 border border-emerald-500/20">
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-400">Account Holder</p>
              <p className="font-bold text-emerald-400">{user.accountHolderName}</p>
            </div>
            <div className="flex justify-between items-center border-t border-white/5 pt-2">
              <p className="text-xs text-slate-400">Bank Account</p>
              <p className="font-mono font-bold text-emerald-400">{user.bankAccount}</p>
            </div>
            <div className="flex justify-between items-center border-t border-white/5 pt-2">
              <p className="text-xs text-slate-400">IFSC Code</p>
              <p className="font-mono font-bold text-emerald-400">{user.ifscCode}</p>
            </div>
            <Link href="/profile" className="text-xs text-brand-400 underline hover:text-brand-300 mt-2 self-end">Change Details</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Amount (₹)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder={`Min: ₹150, Max: ₹${withdrawableBalance}`} 
                className="input text-xl font-bold" 
                min={150}
                max={withdrawableBalance}
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting || withdrawableBalance < 150} 
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : withdrawableBalance < 150 ? 'Need ₹150 to Withdraw' : 'Submit Request'}
            </button>
            {withdrawableBalance < 150 && (
              <p className="text-xs text-center text-yellow-400">You need at least ₹150 in earnings to withdraw. Keep earning from spins, referrals, and subscriptions!</p>
            )}
          </form>
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><span className="text-2xl">📜</span> Withdrawal History ({withdrawHistory.length})</h3>

          {historyLoading ? (
            <div className="text-center py-8 text-slate-400">
              <div className="animate-spin w-6 h-6 border-2 border-brand-500 rounded-full border-t-transparent mx-auto mb-2"></div>
              Loading history...
            </div>
          ) : !withdrawHistory || withdrawHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">No withdrawal history yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawHistory.map((wd) => (
                <div key={wd.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-xl">🏦</div>
                    <div>
                      <p className="font-bold text-white text-sm">₹{wd.amount}</p>
                      <p className="text-[10px] text-slate-500">{new Date(wd.createdAt).toLocaleDateString()} at {new Date(wd.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    wd.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    wd.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>{wd.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
    }
