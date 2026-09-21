'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function DepositPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);
  const [selectedQR, setSelectedQR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [depositHistory, setDepositHistory] = useState([]);

  const [amount, setAmount] = useState('');
  const [utrId, setUtrId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('dailypaisa_user');
      if (!storedUser) {
        router.replace('/');
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        fetchQRCodes();
        await fetchDepositHistory(userData.id);
      } catch (error) { 
        console.error('Auth error:', error); 
      }
    };
    checkAuth();
  }, [router]);

  const fetchQRCodes = async () => {
    try {
      const res = await fetch('/api/qr-codes');
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length > 0) { 
        setQrCodes(data);
        // Pick a random QR code
        const randomIndex = Math.floor(Math.random() * data.length);
        setSelectedQR(data[randomIndex]);
      }
    } catch (error) { 
      console.error('Failed to load QR codes'); 
    }
  };

  const fetchDepositHistory = async (userId) => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/transactions?userId=${userId}`);
      const data = await res.json();

      let transactions = [];
      if (Array.isArray(data)) {
        transactions = data;
      } else if (data && Array.isArray(data.transactions)) {
        transactions = data.transactions;
      }

      const deposits = transactions.filter(t => t.type === 'deposit');
      setDepositHistory(deposits);

    } catch (error) { 
      console.error('History fetch error:', error);
      setDepositHistory([]); 
    }
  };

  const rotateQR = () => {
    // Automatically rotate to next QR code
    if (qrCodes.length > 1) {
      const currentIndex = qrCodes.findIndex(qr => qr.id === selectedQR?.id);
      const nextIndex = (currentIndex + 1) % qrCodes.length;
      setSelectedQR(qrCodes[nextIndex]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error('Image size must be less than 2MB');
      const reader = new FileReader();
      reader.onloadend = () => { 
        setScreenshot(reader.result); 
        setScreenshotPreview(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!utrId.trim() || !screenshot) return toast.error('UTR ID and Screenshot are required');

    setLoading(true);
    try {
      const res = await fetch('/api/deposit', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          userId: user.id, 
          amount: parseFloat(amount), 
          utrId: utrId.trim(), 
          screenshot 
        }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Deposit request submitted!');
      setStep(3);

      setTimeout(() => {
        fetchDepositHistory(user.id);
      }, 1000);

    } catch (error) { 
      toast.error(error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-900 text-white">
      <div className="glass sticky top-0 z-40 px-4 py-3 mb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white">← Back</button>
          <h1 className="text-lg font-bold">Deposit Funds</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-6">
        {step === 1 && (
          <>
            {qrCodes.length === 0 ? (
              <div className="card text-center py-12 text-slate-400">No payment methods available.</div>
            ) : (
              <div className="card text-center">
                <h2 className="text-lg font-bold mb-4">Scan QR Code to Pay</h2>

                {/* ✅ ONLY QR CODE - No banking details shown */}
                <div className="flex justify-center mb-6 p-5 bg-white rounded-2xl inline-block shadow-lg shadow-brand-500/10">
                  {selectedQR && (
                    <QRCodeSVG 
                      value={`upi://pay?pa=${selectedQR.upiId}&pn=${encodeURIComponent(selectedQR.name)}&am=${amount}`} 
                      size={220} 
                    />
                  )}
                </div>

                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => {
                    setAmount(e.target.value);
                    // ✅ Auto-rotate QR when amount changes
                    if (e.target.value && qrCodes.length > 1) {
                      rotateQR();
                    }
                  }} 
                  placeholder="Enter Amount Paid ()" 
                  className="input text-xl font-bold text-center mb-4" 
                />
                <button 
                  onClick={() => { if(!amount) return toast.error('Enter amount'); setStep(2); }} 
                  className="btn-primary w-full"
                >
                  I Have Paid - Next
                </button>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h3 className="font-bold text-lg">Submit Payment Proof</h3>
            <p className="text-xs text-slate-400">Amount: <span className="text-emerald-400 font-bold text-lg">₹{amount}</span></p>
            <div>
              <label className="block text-sm text-slate-400 mb-1">UTR / Transaction ID *</label>
              <input type="text" value={utrId} onChange={(e) => setUtrId(e.target.value)} placeholder="e.g., 304958392019" className="input font-mono" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Upload Screenshot *</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="input text-sm" required />
              {screenshotPreview && <div className="mt-3 relative"><img src={screenshotPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-white/10" /><button type="button" onClick={() => { setScreenshot(null); setScreenshotPreview(''); }} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs"></button></div>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition">Back</button>
              <button type="submit" disabled={loading || !screenshot} className="flex-1 btn-primary disabled:opacity-50">{loading ? 'Submitting...' : 'Submit Request'}</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="card text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-4xl mx-auto mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
            <p className="text-slate-400 mb-6">Your deposit of <span className="text-emerald-400 font-bold">₹{amount}</span> is pending admin approval.</p>
            <button 
              onClick={() => { 
                setStep(1); 
                setAmount(''); 
                setUtrId(''); 
                setScreenshot(null); 
                setScreenshotPreview('');
                // ✅ Auto-rotate QR for next deposit
                rotateQR();
              }} 
              className="btn-primary"
            >
              Make Another Deposit
            </button>
          </div>
        )}

        {/* Deposit History */}
        <div className="card">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><span className="text-2xl">📜</span> Deposit History ({depositHistory.length})</h3>

          {!depositHistory || depositHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">No deposit history yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {depositHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
                  <div>
                    <p className="font-bold text-emerald-400">+₹{tx.amount}</p>
                    <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    tx.status === 'approved' ? 'bg-green-500/20 text-green-400' : 
                    tx.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {tx.status ? tx.status.toUpperCase() : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
        }
