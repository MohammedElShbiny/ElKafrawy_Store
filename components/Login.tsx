
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { Language } from '../types';
import { dbAddLoginHistory, dbLoginAdmin } from '../services/db';

interface LoginProps {
  setIsAdmin: (a: boolean) => void;
  setCurrentSessionId: (id: string) => void;
  t: any;
  lang: Language;
}

export const Login: React.FC<LoginProps> = ({ setIsAdmin, setCurrentSessionId, t, lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    try {
      const user = await dbLoginAdmin(email.trim(), password.trim());
      
      if (user) {
        const recordLogin = async () => {
          let location = 'Unknown';
          try {
            const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
            location = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          } catch (e) {}
          
          const sessionId = await dbAddLoginHistory({
            timestamp: Timestamp.now().toMillis(),
            device: navigator.userAgent,
            location: location
          });

          if (sessionId) {
            setCurrentSessionId(sessionId);
            sessionStorage.setItem('admin_session_id', sessionId);
          }
        };
        await recordLogin();

        setIsAdmin(true);
        sessionStorage.setItem('admin_unlocked', 'true');
        setError(false);
        navigate('/admin@elkafrawy');
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-10 bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl border border-slate-100 dark:border-slate-800 animate-slideUp">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-4xl font-black mb-3 tracking-tighter">{t.admin} {t.login}</h2>
        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
          {lang === 'en' ? 'Authorized personnel only.' : 'للموظفين المصرح لهم فقط.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">{lang === 'en' ? 'Email' : 'البريد الإلكتروني'}</label>
          <input 
            required
            type="text" 
            autoComplete="username"
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500/50 rounded-3xl p-5 font-black outline-none transition-all shadow-inner"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">{lang === 'en' ? 'Password' : 'كلمة المرور'}</label>
          <input 
            required
            type="password" 
            autoComplete="current-password"
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500/50 rounded-3xl p-5 font-black outline-none transition-all shadow-inner"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-4 rounded-2xl text-xs font-black text-center animate-shake border border-red-100 dark:border-red-900/30">
            {lang === 'en' ? 'Access Denied: Check credentials' : 'تم رفض الدخول: تأكد من البيانات'}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl shadow-blue-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : t.login}
        </button>
      </form>
    </div>
  );
};
