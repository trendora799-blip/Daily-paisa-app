'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Set the splash screen duration (2500ms = 2.5 seconds)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); 

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 text-white overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-900 to-purple-900/20 animate-pulse"></div>

        {/* Logo Container */}
        <div className="relative mb-8 z-10">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl shadow-2xl shadow-indigo-500/50 animate-bounce">
            💰
          </div>
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 blur-2xl opacity-40 animate-pulse"></div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2 tracking-tight z-10">
          Daily Paisa
        </h1>
        <p className="text-slate-400 text-sm mb-10 z-10">Track earnings · Build your team · Grow daily</p>

        {/* Loading Animation */}
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-indigo-400 font-medium animate-pulse tracking-wide">Checking for updates...</p>
        </div>
      </div>
    );
  }

  // ✅ Fade in the main app content
  return <div className="animate-fade-in">{children}</div>;
        }
