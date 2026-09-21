'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    const fetchSocial = async () => {
      try {
        const res = await fetch('/api/social');
        if (res.ok) {
          const data = await res.json();
          const activeLinks = Array.isArray(data) 
            ? data.filter(link => link.active !== false).sort((a, b) => a.order - b.order)
            : [];
          setSocialLinks(activeLinks);
        }
      } catch (error) {
        console.error('Error loading social links:', error);
      }
    };
    fetchSocial();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('dailypaisa_user');
      if (!storedUser) {
        router.push('/');
        return;
      }

      try {
        const localData = JSON.parse(storedUser);
        const res = await fetch(`/api/user?id=${localData.id}`);
        const data = await res.json();

        if (!res.ok || !data.user) {
          localStorage.removeItem('dailypaisa_user');
          router.push('/');
          return;
        }

        const freshUser = data.user;

        if (freshUser.isBanned) {
          localStorage.removeItem('dailypaisa_user');
          document.cookie = 'dailypaisa_auth=; Max-Age=0; path=/;';
          toast.error('Your account has been banned.');
          router.push('/');
          return;
        }

        setUser(freshUser);
        localStorage.setItem('dailypaisa_user', JSON.stringify(freshUser));

        if (freshUser.team && freshUser.team.length > 0) {
          const teamDetails = await Promise.all(
            freshUser.team.map(async (memberId) => {
              try {
                const memberRes = await fetch(`/api/user?id=${memberId}`);
                const memberData = await memberRes.json();
                return memberData.user || { id: memberId, name: 'Unknown', email: 'Unknown' };
              } catch (error) {
                return { id: memberId, name: 'Unknown', email: 'Unknown' };
              }
            })
          );
          setTeamMembers(teamDetails);
        } else {
          setTeamMembers([]);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('dailypaisa_user');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  // ✅ FIXED: Hardcoded Production URL
  const referralLink = `https://dailypaisa.vercel.app/?ref=${user.referralCode}`;

  return (
    <div className="min-h-screen pb-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900 via-slate-900 to-black text-white">
      <div className="glass sticky top-0 z-40 px-4 py-3 mb-6 backdrop-blur-md bg-slate-900/80 border-b border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white">← Back</button>
          <h1 className="text-lg font-bold">My Team</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-6">
        {/* Commission Rules */}
        <div className="card bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-2xl p-5">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
            <span className="text-2xl">💰</span> Commission Rules
          </h3>
          <p className="text-sm text-slate-300 mb-3">
            Earn <span className="text-emerald-400 font-bold">5% Lifetime Commission</span> on every successful deposit made by your referrals!
          </p>
          <div className="text-xs text-slate-400 bg-black/20 p-3 rounded-lg border border-white/5">
            💡 <strong>Example:</strong> If your friend deposits ₹1,000, you instantly earn <span className="text-emerald-400 font-bold">₹50</span> directly into your wallet.
          </div>
        </div>

        {/* Referral Code */}
        <div className="card bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-center rounded-2xl p-5">
          <h2 className="text-xl font-bold mb-2">Your Referral Code</h2>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4 tracking-wider">
            {user.referralCode}
          </div>
          <button 
            onClick={() => copyToClipboard(user.referralCode, 'Referral Code')} 
            className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm font-semibold"
          >
            📋 Copy Code
          </button>
        </div>

        {/* Referral Link */}
        <div className="card rounded-2xl p-5 bg-slate-800/50 border border-slate-700">
          <h3 className="font-bold text-lg mb-3">Referral Link</h3>
          <div className="bg-slate-900/80 rounded-xl p-3 mb-3 break-all text-xs text-slate-300 font-mono border border-slate-700">
            {referralLink}
          </div>
          <button 
            onClick={() => copyToClipboard(referralLink, 'Referral Link')} 
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 transition text-sm font-semibold font-bold"
          >
            🔗 Copy Link
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card rounded-2xl p-4 text-center bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Total Referrals</p>
            <p className="text-2xl font-bold text-brand-400">{user.team?.length || 0}</p>
          </div>
          <div className="card rounded-2xl p-4 text-center bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Commission Earned</p>
            <p className="text-2xl font-bold text-emerald-400">₹{user.referralEarnings || 0}</p>
          </div>
        </div>

        {/* Team Members List */}
        <div className="card rounded-2xl p-5 bg-slate-800/50 border border-slate-700">
          <h3 className="font-bold text-lg mb-3">Referred Users ({user.team?.length || 0})</h3>
          {(!user.team || user.team.length === 0) ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm">No referrals yet. Share your link to start earning 5% commission!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{member.name || 'Unknown User'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{member.id}</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DYNAMIC Social Media Links */}
        {socialLinks.length > 0 && (
          <div className="card rounded-2xl p-5 bg-slate-800/50 border border-slate-700">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">🌐</span> Connect With Us
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {socialLinks.map((link) => (
                <a 
                  key={link.id}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 rounded-xl border border-slate-700 hover:border-purple-500/50 transition group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{link.icon || '🔗'}</span>
                  <span className="font-semibold text-sm text-slate-200 group-hover:text-white">{link.platform}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
            }
