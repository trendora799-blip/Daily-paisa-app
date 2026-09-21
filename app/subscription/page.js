'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SubscriptionPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  const subscriptionPacks = [
    { id: 'tier_1', title: 'Starter', price: 500, dailyIncome: 25, incomeRate: '5.0%', totalReturn: 750, profit: 250, cooldownDays: 12, color: 'from-blue-400 to-cyan-400', borderColor: 'border-blue-500/30', bgColor: 'from-blue-500/10 to-cyan-500/10' },
    { id: 'tier_2', title: 'Basic', price: 1000, dailyIncome: 55, incomeRate: '5.5%', totalReturn: 1650, profit: 650, cooldownDays: 12, color: 'from-teal-400 to-emerald-400', borderColor: 'border-teal-500/30', bgColor: 'from-teal-500/10 to-emerald-500/10' },
    { id: 'tier_3', title: 'Standard', price: 2000, dailyIncome: 120, incomeRate: '6.0%', totalReturn: 3600, profit: 1600, cooldownDays: 12, color: 'from-green-400 to-lime-400', borderColor: 'border-green-500/30', bgColor: 'from-green-500/10 to-lime-500/10' },
    { id: 'tier_4', title: 'Premium', price: 3000, dailyIncome: 195, incomeRate: '6.5%', totalReturn: 5850, profit: 2850, cooldownDays: 1, color: 'from-emerald-400 to-green-500', borderColor: 'border-emerald-500/30', bgColor: 'from-emerald-500/10 to-green-500/10' },
    { id: 'tier_5', title: 'Advanced', price: 4000, dailyIncome: 280, incomeRate: '7.0%', totalReturn: 8400, profit: 4400, cooldownDays: 1, color: 'from-lime-400 to-green-500', borderColor: 'border-lime-500/30', bgColor: 'from-lime-500/10 to-green-500/10' },
    { id: 'tier_6', title: 'Elite', price: 5000, dailyIncome: 375, incomeRate: '7.5%', totalReturn: 11250, profit: 6250, cooldownDays: 1, color: 'from-purple-400 to-pink-400', borderColor: 'border-purple-500/30', bgColor: 'from-purple-500/10 to-pink-500/10' },
    { id: 'tier_7', title: 'Pro', price: 6000, dailyIncome: 480, incomeRate: '8.0%', totalReturn: 14400, profit: 8400, cooldownDays: 1, color: 'from-fuchsia-400 to-purple-400', borderColor: 'border-fuchsia-500/30', bgColor: 'from-fuchsia-500/10 to-purple-500/10' },
    { id: 'tier_8', title: 'Master', price: 8000, dailyIncome: 680, incomeRate: '8.5%', totalReturn: 20400, profit: 12400, cooldownDays: 1, color: 'from-pink-400 to-rose-400', borderColor: 'border-pink-500/30', bgColor: 'from-pink-500/10 to-rose-500/10' },
    { id: 'tier_9', title: 'Expert', price: 10000, dailyIncome: 900, incomeRate: '9.0%', totalReturn: 27000, profit: 17000, cooldownDays: 1, color: 'from-rose-400 to-red-400', borderColor: 'border-rose-500/30', bgColor: 'from-rose-500/10 to-red-500/10' },
    { id: 'tier_10', title: 'Guru', price: 12000, dailyIncome: 1140, incomeRate: '9.5%', totalReturn: 34200, profit: 22200, cooldownDays: 1, color: 'from-orange-400 to-red-400', borderColor: 'border-orange-500/30', bgColor: 'from-orange-500/10 to-red-500/10' },
    { id: 'tier_11', title: 'Platinum', price: 15000, dailyIncome: 1500, incomeRate: '10.0%', totalReturn: 45000, profit: 30000, cooldownDays: 1, color: 'from-yellow-400 to-orange-400', borderColor: 'border-yellow-500/30', bgColor: 'from-yellow-500/10 to-orange-500/10', popular: true },
    { id: 'tier_12', title: 'Gold', price: 18000, dailyIncome: 1890, incomeRate: '10.5%', totalReturn: 56700, profit: 38700, cooldownDays: 1, color: 'from-amber-400 to-yellow-400', borderColor: 'border-amber-500/30', bgColor: 'from-amber-500/10 to-yellow-500/10' },
    { id: 'tier_13', title: 'Diamond', price: 20000, dailyIncome: 2200, incomeRate: '11.0%', totalReturn: 66000, profit: 46000, cooldownDays: 1, color: 'from-cyan-400 to-blue-400', borderColor: 'border-cyan-500/30', bgColor: 'from-cyan-500/10 to-blue-500/10' },
    { id: 'tier_14', title: 'Ruby', price: 25000, dailyIncome: 2875, incomeRate: '11.5%', totalReturn: 86250, profit: 61250, cooldownDays: 1, color: 'from-red-500 to-rose-500', borderColor: 'border-red-500/30', bgColor: 'from-red-500/10 to-rose-500/10' },
    { id: 'tier_15', title: 'Emerald', price: 30000, dailyIncome: 3600, incomeRate: '12.0%', totalReturn: 108000, profit: 78000, cooldownDays: 1, color: 'from-green-500 to-emerald-500', borderColor: 'border-green-500/30', bgColor: 'from-green-500/10 to-emerald-500/10' },
    { id: 'tier_16', title: 'Sapphire', price: 35000, dailyIncome: 4375, incomeRate: '12.5%', totalReturn: 131250, profit: 96250, cooldownDays: 1, color: 'from-blue-500 to-indigo-500', borderColor: 'border-blue-500/30', bgColor: 'from-blue-500/10 to-indigo-500/10' },
    { id: 'tier_17', title: 'Amethyst', price: 40000, dailyIncome: 5200, incomeRate: '13.0%', totalReturn: 156000, profit: 116000, cooldownDays: 1, color: 'from-purple-500 to-violet-500', borderColor: 'border-purple-500/30', bgColor: 'from-purple-500/10 to-violet-500/10' },
    { id: 'tier_18', title: 'Topaz', price: 45000, dailyIncome: 6075, incomeRate: '13.5%', totalReturn: 182250, profit: 137250, cooldownDays: 1, color: 'from-yellow-500 to-amber-500', borderColor: 'border-yellow-500/30', bgColor: 'from-yellow-500/10 to-amber-500/10' },
    { id: 'tier_19', title: 'Pearl', price: 48000, dailyIncome: 6720, incomeRate: '14.0%', totalReturn: 201600, profit: 153600, cooldownDays: 1, color: 'from-slate-300 to-gray-400', borderColor: 'border-slate-400/30', bgColor: 'from-slate-400/10 to-gray-400/10' },
    { id: 'tier_20', title: 'Royal', price: 50000, dailyIncome: 7500, incomeRate: '15.0%', totalReturn: 225000, profit: 175000, cooldownDays: 1, color: 'from-amber-400 to-yellow-500', borderColor: 'border-amber-500/30', bgColor: 'from-amber-500/10 to-yellow-500/10', bestValue: true },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('dailypaisa_user');
      if (!storedUser) return router.push('/');
      try {
        const localData = JSON.parse(storedUser);
        const res = await fetch(`/api/user?id=${localData.id}`);
        const data = await res.json();
        if (res.ok && data.user) { setUser(data.user); localStorage.setItem('dailypaisa_user', JSON.stringify(data.user)); } 
        else { setUser(localData); }
      } catch (error) { setUser(JSON.parse(storedUser)); }
      finally { setLoading(false); }
    };
    checkAuth();
  }, [router]);

  const handlePurchase = async (pack) => {
    if (!user) return;
    if ((user.balance || 0) < pack.price) return toast.error(`Insufficient balance. Need ₹${pack.price - (user.balance || 0)} more.`);
    const hasPlan = user.subscriptions?.some(sub => sub.packId === pack.id && sub.active && new Date(sub.endDate) > new Date());
    if (hasPlan) return toast.error('You already have this specific plan active!');
    if (!confirm(`Purchase ${pack.title} for ₹${pack.price.toLocaleString()}?`)) return;

    setPurchasing(pack.id);
    try {
      const res = await fetch('/api/subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, packId: pack.id, amount: pack.price }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${pack.title} activated successfully!`);
      const updatedUser = { ...user, balance: user.balance - pack.price };
      localStorage.setItem('dailypaisa_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) { toast.error(error.message); }
    finally { setPurchasing(null); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return null;

  return (
    // ✅ NEW: Obsidian & Platinum (Black) Theme
    <div className="min-h-screen pb-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-black to-black text-white">
      <div className="glass sticky top-0 z-40 px-4 py-3 mb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white">← Back</button>
          <h1 className="text-lg font-bold">Investment Plans</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-6">
        <div className="card bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-center py-6">
          <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Available Balance</p>
          <p className="text-4xl font-bold grad-text mb-2">₹{user.balance || 0}</p>
        </div>

        <div className="space-y-4">
          {subscriptionPacks.map((pack) => {
            const isPurchasing = purchasing === pack.id;
            const canAfford = (user.balance || 0) >= pack.price;
            const isActive = user.subscriptions?.some(sub => sub.packId === pack.id && sub.active && new Date(sub.endDate) > new Date());
            const hasCooldownLimit = pack.cooldownDays > 1;

            return (
              <div key={pack.id} className={`card relative overflow-hidden border ${pack.borderColor} bg-gradient-to-br ${pack.bgColor}`}>
                {pack.popular && <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">⭐ MOST POPULAR</div>}
                {pack.bestValue && <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">👑 MAX RETURNS</div>}

                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{pack.title}</h3>
                      <p className="text-xs text-slate-400">30 Days Investment</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">₹{pack.price.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Investment</p>
                    </div>
                  </div>

                  {hasCooldownLimit && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mb-4 flex items-center gap-2">
                      <span className="text-yellow-400 text-lg">⏳</span>
                      <p className="text-[11px] text-yellow-400 font-semibold">Withdrawal Limit: Once every {pack.cooldownDays} days</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-slate-400 mb-1">Daily Income</p>
                      <p className={`text-sm font-bold bg-gradient-to-r ${pack.color} bg-clip-text text-transparent`}>₹{pack.dailyIncome}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-slate-400 mb-1">Daily Rate</p>
                      <p className={`text-sm font-bold bg-gradient-to-r ${pack.color} bg-clip-text text-transparent`}>{pack.incomeRate}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-slate-400 mb-1">Total Return</p>
                      <p className={`text-sm font-bold bg-gradient-to-r ${pack.color} bg-clip-text text-transparent`}>₹{pack.totalReturn.toLocaleString()}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(pack)}
                    disabled={isPurchasing || !canAfford || isActive}
                    className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                      isActive ? 'bg-slate-700 cursor-not-allowed' : !canAfford ? 'bg-slate-700 cursor-not-allowed opacity-50' : `bg-gradient-to-r ${pack.color} hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/20`
                    }`}
                  >
                    {isPurchasing ? 'Processing...' : isActive ? '✅ Active Plan' : !canAfford ? '💳 Insufficient Balance' : '💳 Buy Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
                               }
