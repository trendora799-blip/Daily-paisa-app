'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SpinPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState({ totalDeposits: 0, teamDeposits: 0, referralCount: 0, canStandard: false, canExtra: false, canReferral: false });
  const [activeTier, setActiveTier] = useState('standard');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reward, setReward] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const getSegments = (tier) => {
    if (tier === 'standard') return [
      { amount: 5, color: '#6366f1' }, { amount: 10, color: '#ec4899' },
      { amount: 20, color: '#8b5cf6' }, { amount: 30, color: '#f43f5e' },
      { amount: 5, color: '#6366f1' }, { amount: 10, color: '#ec4899' },
      { amount: 20, color: '#8b5cf6' }, { amount: 30, color: '#f43f5e' }
    ];
    if (tier === 'extra') return [
      { amount: 30, color: '#3b82f6' }, { amount: 50, color: '#d946ef' },
      { amount: 50, color: '#3b82f6' }, { amount: 100, color: '#0ea5e9' },
      { amount: 100, color: '#3b82f6' }, { amount: 150, color: '#8b5cf6' },
      { amount: 150, color: '#3b82f6' }, { amount: 200, color: '#f43f5e' }
    ];
    return [
      { amount: 50, color: '#d946ef' }, { amount: 100, color: '#0ea5e9' },
      { amount: 100, color: '#d946ef' }, { amount: 150, color: '#8b5cf6' },
      { amount: 150, color: '#d946ef' }, { amount: 200, color: '#f43f5e' },
      { amount: 200, color: '#d946ef' }, { amount: 200, color: '#f43f5e' }
    ];
  };

  const segments = getSegments(activeTier);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('dailypaisa_user');
      if (!storedUser) return router.push('/');
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchStatus(userData.id);
    };
    checkAuth();
  }, [router]);

  const fetchStatus = async (userId) => {
    try {
      const res = await fetch(`/api/spin?userId=${userId}`);
      const data = await res.json();
      if (res.ok) setStatus(data);
    } catch (error) { console.error(error); }
  };

  const handleSpin = async () => {
    if (spinning || !user) return;

    if (activeTier === 'standard' && !status.canStandard) return toast.error('Daily spin already used or deposit < ₹500');
    if (activeTier === 'extra' && !status.canExtra) return toast.error('Extra spin already used or deposit < ₹1000');
    if (activeTier === 'referral' && !status.canReferral) return toast.error('Referral spin already used or conditions not met');

    setSpinning(true);
    setReward(null);
    setShowModal(false);

    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, spinType: activeTier }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSpinning(false);
        toast.error(data.error || 'Failed to spin');
        return;
      }

      const segmentIndex = segments.findIndex(s => s.amount === data.reward);
      const segmentAngle = 360 / segments.length;
      const segmentCenter = (segmentIndex * segmentAngle) + (segmentAngle / 2);
      const targetRotation = 360 - segmentCenter;
      const randomOffset = Math.floor(Math.random() * 30) - 15;
      const currentMod = rotation % 360;
      const distanceToTarget = (targetRotation + randomOffset - currentMod + 360) % 360;
      const extraSpins = 5 * 360;
      const newRotation = rotation + extraSpins + distanceToTarget;

      setRotation(newRotation);

      setTimeout(() => {
        setSpinning(false);
        setReward(data);
        setShowModal(true);
        fetchStatus(user.id);

        const updatedUser = { ...user, balance: data.newBalance };
        localStorage.setItem('dailypaisa_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }, 4100); 

    } catch (error) {
      setSpinning(false);
      toast.error('Network error. Try again.');
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen pb-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-black text-white overflow-x-hidden">
      <div className="glass sticky top-0 z-40 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition">← Back</button>
          <h1 className="text-lg font-bold">Spin & Win</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 flex flex-col items-center">
        <div className="w-full grid grid-cols-3 gap-2 mb-6">
          <button 
            onClick={() => status.canStandard && setActiveTier('standard')}
            disabled={!status.canStandard}
            className={`p-3 rounded-xl border text-center transition ${activeTier === 'standard' ? 'bg-indigo-600/30 border-indigo-500' : 'bg-slate-800/50 border-slate-700'} ${!status.canStandard ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
          >
            <div className="text-xs font-bold text-slate-300">Daily</div>
            <div className="text-sm font-black text-indigo-400">₹5-30</div>
            <div className="text-[10px] text-slate-500 mt-1">{status.canStandard ? 'Available' : 'Locked'}</div>
          </button>

          <button 
            onClick={() => status.canExtra && setActiveTier('extra')}
            disabled={!status.canExtra}
            className={`p-3 rounded-xl border text-center transition ${activeTier === 'extra' ? 'bg-blue-600/30 border-blue-500' : 'bg-slate-800/50 border-slate-700'} ${!status.canExtra ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
          >
            <div className="text-xs font-bold text-slate-300">Extra</div>
            <div className="text-sm font-black text-blue-400">30-200</div>
            <div className="text-[10px] text-slate-500 mt-1">{status.canExtra ? 'Available' : 'Locked'}</div>
          </button>

          <button 
            onClick={() => status.canReferral && setActiveTier('referral')}
            disabled={!status.canReferral}
            className={`p-3 rounded-xl border text-center transition ${activeTier === 'referral' ? 'bg-purple-600/30 border-purple-500' : 'bg-slate-800/50 border-slate-700'} ${!status.canReferral ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
          >
            <div className="text-xs font-bold text-slate-300">Referral</div>
            <div className="text-sm font-black text-purple-400">₹50-200</div>
            <div className="text-[10px] text-slate-500 mt-1">{status.canReferral ? 'Available' : 'Locked'}</div>
          </button>
        </div>

        <div className="w-full card mb-6 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
          <div className="flex justify-between items-center text-sm">
            <div>
              <p className="text-xs text-slate-400">Your Deposits</p>
              <p className="font-bold text-white">{status.totalDeposits || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Team (Refs / Dep)</p>
              <p className="font-bold text-white">{status.referralCount || 0} {'/'} ₹{status.teamDeposits || 0}</p>
            </div>
          </div>
        </div>

        <div className="relative w-[320px] h-[320px] mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>

          <div 
            className="w-full h-full rounded-full border-4 border-white/20 shadow-2xl relative overflow-hidden transition-transform duration-[4000ms] ease-[cubic-bezier(0.17,0.67,0.12,0.99)]"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(${segments.map((seg, i) => `${seg.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(', ')})`
            }}
          >
            {segments.map((seg, i) => {
              const angle = i * 45 + 22.5;
              return (
                <div key={i} className="absolute top-1/2 left-1/2 w-0 h-0 flex justify-center" style={{ transform: `rotate(${angle}deg)` }}>
                  <div className="flex flex-col items-center justify-center" style={{ transform: `translateY(-110px) rotate(-${angle}deg)` }}>
                    <svg className="w-6 h-6 mb-1 drop-shadow-lg text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.1 1.64-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/></svg>
                    <span className="text-white font-black text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">₹{seg.amount}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleSpin} 
            disabled={spinning || (activeTier === 'standard' && !status.canStandard) || (activeTier === 'extra' && !status.canExtra) || (activeTier === 'referral' && !status.canReferral)} 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.6)] z-10 transition-all border-4 border-white/20 ${spinning || (activeTier === 'standard' && !status.canStandard) || (activeTier === 'extra' && !status.canExtra) || (activeTier === 'referral' && !status.canReferral) ? 'bg-slate-700 text-slate-400 cursor-not-allowed border-slate-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105 active:scale-95'}`}
          >
            {spinning ? (
              <svg className="w-10 h-10 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            )}
          </button>
        </div>
      </div>

      {showModal && reward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-green-500"></div>
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-2xl font-bold text-white mb-2">Congratulations!</h3>
            <p className="text-slate-400 text-sm mb-6">{reward.message}</p>
            <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-white/5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">You Won</p>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">₹{reward.reward}</p>
            </div>
            <button onClick={() => { setShowModal(false); router.push('/dashboard'); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold shadow-lg hover:shadow-emerald-500/25 transition-all">Go to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
