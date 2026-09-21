import './globals.css';
import { Toaster } from 'react-hot-toast';
import BottomNav from '@/components/BottomNav';
import SplashScreen from '@/components/SplashScreen';

export const metadata = {
  title: 'Daily Paisa - Earn Daily',
  description: 'Track earnings, build your team, and grow daily',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen font-sans antialiased">

        {/* ✅ Splash Screen Wrapper */}
        <SplashScreen>
          {children}
          <BottomNav />
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            }} 
          />
        </SplashScreen>

      </body>
    </html>
  );
}
