'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);

  const [editBankMode, setEditBankMode] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('dailypaisa_user');
        if (!storedUser) {
          console.log('No user in localStorage');
          return;
        }

        const localData = JSON.parse(storedUser);

        try {
          const res = await fetch(`/api/user?id=${localData.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              if (data.user.isBanned) {
                localStorage.removeItem('dailypaisa_user');
                toast.error('Your account has been banned.');
                router.push('/');
                return;
              }
              setUser(data.user);
              setAccountHolderName(data.user.accountHolderName || '');
              setBankAccount(data.user.bankAccount || '');
              setIfscCode(data.user.ifscCode || '');
              localStorage.setItem('dailypaisa_user', JSON.stringify(data.user));
            }
          } else {
            console.log('API fetch failed, using localStorage data');
            setUser(localData);
            setAccountHolderName(localData.accountHolderName || '');
            setBankAccount(localData.bankAccount || '');
            setIfscCode(localData.ifscCode || '');
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          setUser(localData);
          setAccountHolderName(localData.accountHolderName || '');
          setBankAccount(localData.bankAccount || '');
          setIfscCode(localData.ifscCode || '');
        }
      } catch (error) {
        console.error('Profile load error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast.success('User ID copied!');
    }
  };

  const handleSaveBankDetails = async () => {
    if (!accountHolderName || accountHolderName.trim().length < 3) {
      return toast.error('Please enter a valid Account Holder Name');
    }
    if (!bankAccount || bankAccount.trim().length < 9) {
      return toast.error('Please enter a valid Bank Account Number');
    }
    if (!ifscCode || ifscCode.trim().length < 11) {
      return toast.error('Please enter a valid IFSC Code');
    }

    setSavingBank(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: user.id, 
          accountHolderName: accountHolderName.trim(), 
          bankAccount: bankAccount.trim(), 
          ifscCode: ifscCode.trim().toUpperCase() 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save bank details');
      }

      toast.success('Bank details saved!');
      setEditBankMode(false);

      const updatedUser = { 
        ...user, 
        accountHolderName: accountHolderName.trim(), 
        bankAccount: bankAccount.trim(), 
        ifscCode: ifscCode.trim().toUpperCase() 
      };
      setUser(updatedUser);
      localStorage.setItem('dailypaisa_user', JSON.stringify(updatedUser));
    } catch (err) { 
      toast.error(err.message || 'Failed to save bank details'); 
    } finally { 
      setSavingBank(false); 
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/transactions?userId=${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('dailypaisa_user');
      document.cookie = 'dailypaisa_auth=; Max-Age=0; path=/;';
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Loading profile...</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-900 text-white">
      <div className="glass sticky top-0 z-40 px-4 py-3 mb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white">← Back</button>
          <h1 className="text-lg font-bold">My Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-6">
        {/* Profile Header */}
        <div className="card text-center">
          <div className="w-24 h-24 rounded-full grad-bg flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-brand-500/30">👤</div>
          <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
          <p className="text-slate-400 text-sm mb-4">{user.email}</p>
          <div className="flex justify-center gap-2">
            <span className="badge badge-blue">Active</span>
            <span className="badge badge-purple">VIP {user.vipLevel || 1}</span>
          </div>
        </div>

        {/* Balance Card */}
        <div className="card text-center py-6 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20">
          <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Available Balance</p>
          <p className="text-4xl font-bold grad-text mb-6">{user.balance || 0}</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/deposit" className="py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/30 transition flex items-center justify-center gap-2">
              💰 Deposit
            </Link>
            <Link href="/withdraw" className="py-3 rounded-xl bg-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/30 transition flex items-center justify-center gap-2">
              💸 Withdraw
            </Link>
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">🏦 Bank Details</h3>
            {!editBankMode && (
              <button 
                onClick={() => setEditBankMode(true)} 
                className="text-xs text-brand-400 font-semibold hover:text-brand-300"
              >
                ✏️ Edit
              </button>
            )}
          </div>

          {editBankMode ? (
            <div className="space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400 mb-2">
                ⚠️ Bank details are required for withdrawals.
              </div>
              <input 
                type="text" 
                value={accountHolderName} 
                onChange={(e) => setAccountHolderName(e.target.value)} 
                placeholder="Enter Account Holder Name" 
                className="input" 
              />
              <input 
                type="text" 
                value={bankAccount} 
                onChange={(e) => setBankAccount(e.target.value)} 
                placeholder="Enter Bank Account Number" 
                className="input font-mono" 
              />
              <input 
                type="text" 
                value={ifscCode} 
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())} 
                placeholder="Enter IFSC Code (e.g., SBIN0001234)" 
                className="input font-mono uppercase" 
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => { 
                    setEditBankMode(false); 
                    setAccountHolderName(user.accountHolderName || ''); 
                    setBankAccount(user.bankAccount || ''); 
                    setIfscCode(user.ifscCode || ''); 
                  }} 
                  className="flex-1 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveBankDetails} 
                  disabled={savingBank} 
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 transition text-sm font-semibold disabled:opacity-50"
                >
                  {savingBank ? 'Saving...' : '💾 Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-xl p-4 flex flex-col gap-2 border border-emerald-500/20">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">Account Holder</p>
                <p className="font-bold text-emerald-400">{user.accountHolderName || 'Not set'}</p>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <p className="text-xs text-slate-400">Account Number</p>
                <p className="font-mono font-bold text-emerald-400">{user.bankAccount || 'Not set'}</p>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <p className="text-xs text-slate-400">IFSC Code</p>
                <p className="font-mono font-bold text-emerald-400">{user.ifscCode || 'Not set'}</p>
              </div>
              {(!user.accountHolderName || !user.bankAccount || !user.ifscCode) && (
                <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded mt-2 self-start">
                  ⚠️ Required for withdrawals
                </span>
              )}
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="card">
          <h3 className="font-bold text-lg mb-3">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">User ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-slate-900 px-2 py-1 rounded text-slate-300">{user.id}</span>
                <button onClick={copyUserId} className="text-brand-400 hover:text-brand-300 text-sm">📋</button>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Phone</span>
              <span className="font-mono">{user.phone || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Referral Code</span>
              <span className="font-mono text-brand-400 font-bold">{user.referralCode}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Total Earnings</span>
              <span className="font-bold text-emerald-400">₹{user.earnings || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Referral Earnings</span>
              <span className="font-bold text-blue-400">₹{user.referralEarnings || 0}</span>
            </div>
          </div>
        </div>

        {/* Transaction History Button */}
        <button
          onClick={() => {
            fetchTransactions();
            setShowTransactions(true);
          }}
          className="w-full py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition text-white font-semibold flex items-center justify-center gap-2"
        >
          📜 View Transaction History
        </button>

        {/* ✅ NEW: Contact Support Button */}
        <Link 
          href="/support" 
          className="w-full py-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 font-semibold transition-all flex items-center justify-center gap-2"
        >
          🎧 Contact Support
        </Link>

        {/* Logout Button */}
        <button 
          onClick={handleLogout} 
          className="w-full py-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold transition-all flex items-center justify-center gap-2"
        >
          <span>🚪</span> Logout
        </button>
      </div>

      {/* Transaction History Modal */}
      {showTransactions && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold">Transaction History</h2>
              <button 
                onClick={() => setShowTransactions(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Deposits</p>
                    <p className="text-lg font-bold text-blue-400">
                      ₹{transactions.filter(t => t.type === 'deposit' && t.status === 'approved').reduce((sum, t) => sum + t.amount, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Earnings</p>
                    <p className="text-lg font-bold text-purple-400">
                      ₹{transactions.filter(t => ['referral_commission', 'spin_win', 'daily_income'].includes(t.type) && t.status === 'approved').reduce((sum, t) => sum + t.amount, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Withdrawals</p>
                    <p className="text-lg font-bold text-red-400">
                      ₹{transactions.filter(t => t.type === 'withdrawal' && t.status === 'approved').reduce((sum, t) => sum + Math.abs(t.amount), 0)}
                    </p>
                  </div>
                </div>
              </div>

              {transactions.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'deposit' ? 'bg-blue-500/20 text-blue-400' :
                          tx.type === 'withdrawal' ? 'bg-red-500/20 text-red-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {tx.type === 'deposit' ? '↓' : tx.type === 'withdrawal' ? '↑' : '💰'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {tx.type === 'deposit' ? 'Deposit' : 
                             tx.type === 'withdrawal' ? 'Withdrawal' : 
                             tx.type?.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}₹{tx.amount}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                          tx.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tx.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
                           }
