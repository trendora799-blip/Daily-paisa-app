'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Tracks which transaction is currently being processed to prevent double-clicks
  const [processingId, setProcessingId] = useState(null); 

  useEffect(() => {
    if (!localStorage.getItem('dailypaisa_admin')) return router.push('/');
    fetchTransactions();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (error) { 
      toast.error('Failed to load transactions'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleStatusChange = async (id, status) => {
    // ✅ Block action if we are already processing a request
    if (processingId) return; 

    setProcessingId(id); // Lock the UI

    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      toast.success(`Transaction ${status} successfully!`);
      fetchTransactions();
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setProcessingId(null); // Unlock the UI
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div>
        <h1 className="text-3xl font-bold">Manage <span className="grad-text">Deposits</span> 💰</h1>
        <p className="text-slate-400 mt-1">{transactions.length} total deposit requests</p>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10 bg-slate-800/30">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">UTR / Note</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">No deposit requests yet</td></tr>
              ) : transactions.map(tx => {
                const isProcessing = processingId === tx.id;

                return (
                  <tr key={tx.id} className={`border-b border-white/5 hover:bg-white/[.02] transition ${
                    tx.status === 'rejected' ? 'bg-red-900/10' : 
                    tx.status === 'approved' ? 'bg-green-900/10' : ''
                  }`}>
                    <td className="py-3 px-4"><span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded">{tx.userId}</span></td>
                    <td className="py-3 px-4 font-bold text-white">₹{tx.amount}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 font-mono">{tx.description || tx.note || tx.utrId || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        tx.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        tx.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {tx.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleStatusChange(tx.id, 'approved')} 
                            disabled={isProcessing}
                            className="px-3 py-1 rounded bg-green-500/15 text-green-400 hover:bg-green-500/25 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition min-w-[70px]"
                          >
                            {isProcessing ? '...' : 'Approve'}
                          </button>
                          <button 
                            onClick={() => handleStatusChange(tx.id, 'rejected')} 
                            disabled={isProcessing}
                            className="px-3 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition min-w-[70px]"
                          >
                            {isProcessing ? '...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
        }
