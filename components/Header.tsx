
import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Language, Theme, UserProfile, Notification } from '../types';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  isAdmin: boolean;
  setIsAdmin: (a: boolean) => void;
  onLogout: () => void;
  cartCount: number;
  onCartClick: () => void;
  currentUser: UserProfile | null;
  onGoogleLogin: () => void;
  onUserLogout: () => void;
  notifications: Notification[];
  onNotificationClick: (id: string) => void;
  t: any;
}

export const Header: React.FC<HeaderProps> = ({ 
  lang, setLang, theme, setTheme, isAdmin, onLogout, cartCount, onCartClick, 
  currentUser, onGoogleLogin, onUserLogout, notifications, onNotificationClick, t 
}) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
          
          <Link to="/" className="text-2xl font-black bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform duration-300 p-1">
               <img 
                 src="images/logo.png" 
                 alt={t.storeName}
                 className="w-full h-full object-contain"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   const parent = e.currentTarget.parentElement;
                   if (parent) {
                     parent.innerText = 'E';
                     parent.classList.add('text-blue-600', 'font-black', 'text-2xl');
                   }
                 }}
               />
            </div>
            <span className="hidden sm:inline">{t.storeName}</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-1 rtl:space-x-reverse">
          <Link 
            to="/" 
            className={`px-4 py-2 rounded-xl transition-all ${location.pathname === '/' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-black' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'}`}
          >
            {t.home}
          </Link>
          <Link 
            to="/tracking" 
            className={`px-4 py-2 rounded-xl transition-all ${location.pathname === '/tracking' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-black' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'}`}
          >
            {t.orders}
          </Link>
          
          {isAdmin && (
            <Link 
              to="/admin@elkafrawy" 
              className={`px-4 py-2 rounded-xl transition-all animate-fadeIn ${location.pathname === '/admin@elkafrawy' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-black' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'}`}
            >
              {t.dashboard}
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {/* Notifications */}
          {currentUser && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-950 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {isNotificationsOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slideUp z-50">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-black text-sm uppercase tracking-widest text-slate-500">
                    {lang === 'en' ? 'Notifications' : 'الإشعارات'}
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm font-bold">
                        {lang === 'en' ? 'No notifications' : 'لا توجد إشعارات'}
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => onNotificationClick(n.id)}
                          className={`p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        >
                          <h4 className={`text-sm font-bold mb-1 ${!n.read ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{n.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block">{new Date(n.timestamp).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Login */}
          {currentUser ? (
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
              >
                <img src={currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + currentUser.displayName} className="w-8 h-8 rounded-full object-cover" alt="" />
                <span className="hidden md:block text-xs font-black text-slate-700 dark:text-slate-200 max-w-[100px] truncate">{currentUser.displayName}</span>
              </button>

              {isProfileOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slideUp z-50">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-black text-slate-800 dark:text-white truncate">{currentUser.displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                  <button 
                    onClick={onUserLogout}
                    className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    {lang === 'en' ? 'Logout' : 'تسجيل خروج'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onGoogleLogin}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
              {lang === 'en' ? 'Login' : 'دخول'}
            </button>
          )}

          <button 
            onClick={onCartClick}
            className="relative p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-slate-900 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-950">
                {cartCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          >
            {theme === 'light' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </button>

          <button 
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-black uppercase hover:bg-blue-50 dark:hover:bg-slate-700 transition-all px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          >
            {lang === 'en' ? 'AR' : 'EN'}
          </button>

          {isAdmin && (
            <button 
              onClick={onLogout}
              className="p-2.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-all border border-red-100 dark:border-red-900/30"
              title="Full Secure Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-slideDown bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl">
          <nav className="flex flex-col p-4 space-y-2">
            <Link 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-6 py-4 rounded-2xl transition-all flex items-center gap-4 ${location.pathname === '/' ? 'bg-blue-600 text-white font-black' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              {t.home}
            </Link>
            <Link 
              to="/tracking" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-6 py-4 rounded-2xl transition-all flex items-center gap-4 ${location.pathname === '/tracking' ? 'bg-blue-600 text-white font-black' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              {t.orders}
            </Link>
            {isAdmin && (
              <Link 
                to="/admin@elkafrawy" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-6 py-4 rounded-2xl transition-all flex items-center gap-4 ${location.pathname === '/admin@elkafrawy' ? 'bg-blue-600 text-white font-black' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {t.dashboard}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
