'use client';
import { QRCodeSVG } from 'qrcode.react';

export default function QRModal({ qr, amount, onClose, onConfirm }) {
  if (!qr) return null;
  const upiString = `upi://pay?pa=${qr.upiId}&pn=${encodeURIComponent(qr.name)}&am=${amount}&cu=INR`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-3xl p-6 sm:p-8 max-w-md w-full animate-slide-up" onClick={e=>e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl grad-bg items-center justify-center text-3xl mb-3 shadow-lg shadow-brand-500/30">💳</div>
          <h3 className="text-2xl font-bold">Scan & Pay</h3>
          <p className="text-slate-400 mt-1">Amount: <span className="text-brand-400 font-bold text-lg">₹{amount}</span></p>
        </div>

        <div className="bg-white rounded-2xl p-5 flex justify-center mb-5 shadow-inner">
          <QRCodeSVG value={upiString} size={200} level="H" includeMargin />
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-sm"><span className="text-slate-400">UPI ID</span><span className="font-mono font-semibold">{qr.upiId}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">Name</span><span className="font-semibold">{qr.name}</span></div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
          <p className="text-xs text-amber-200 leading-relaxed">⚠️ After completing the UPI payment, click <strong>"I've Paid"</strong> below. Your deposit will be credited once the admin confirms it.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 font-medium transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 btn-primary">I've Paid ✓</button>
        </div>
      </div>
    </div>
  );
}
