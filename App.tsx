
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
  Language, Theme, Product, Order, OrderStatus, 
  UserInfo, CartItem, PromoCode, SupportSession, SupportMessage, SupportSender, AdminLoginHistory, UserProfile, Notification 
} from './types';
import { TRANSLATIONS } from './constants';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  subscribeToProducts, subscribeToOrders, subscribeToPromos,
  dbAddProduct, dbDeleteProduct, dbAddOrder, dbUpdateOrderStatus,
  dbAddPromo, dbDeletePromo, dbUpdatePromo, dbUpdateProductStock,
  dbAddSupportSession, dbAddSupportMessage, subscribeToSupportMessages,
  setGlobalErrorCallback, dbAddLoginHistory, subscribeToLoginHistory, dbDeleteLoginHistory, subscribeToSessionStatus,
  auth, dbLogout, signInWithGoogle, signOutUser, subscribeToNotifications, markNotificationRead
} from './services/db';

import { Header } from './components/Header';
import { UserShop } from './components/UserShop';
import { AdminPanel } from './components/AdminPanel';
import { OrderTracking } from './components/OrderTracking';
import { Login } from './components/Login';
import { ProductDetails } from './components/ProductDetails';

// ...

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'ar');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loginHistory, setLoginHistory] = useState<AdminLoginHistory[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'instapay'>('cod');
  const [isCheckout, setIsCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [reservationProduct, setReservationProduct] = useState<Product | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [reservationComplete, setReservationComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ...

  // Firebase Auth State Listener
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email === 'admin@elkafrawy' || user.email === 'admin@elkafrawy.com') {
          setIsAdmin(true);
          setCurrentUser(null);
        } else if (!user.isAnonymous) {
          setIsAdmin(false);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          });
        } else {
          setIsAdmin(false);
          setCurrentUser(null);
        }
      } else {
        setIsAdmin(false);
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to notifications
  useEffect(() => {
    if (currentUser) {
      const unsub = subscribeToNotifications(currentUser.uid, setNotifications);
      return () => unsub && unsub();
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      alert(lang === 'en' ? 'Login failed' : 'فشل تسجيل الدخول');
    }
  };

  const handleUserLogout = async () => {
    await signOutUser();
  };

  const handleNotificationClick = async (id: string) => {
    await markNotificationRead(id);
  };

  // ... existing code ...

  // Update handleConfirmOrder to include userId
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingOrder || cart.length === 0) return;
    setIsProcessingOrder(true);

    try {
      // ... existing stock check ...
      for (const item of cart) {
        const liveProduct = products.find(p => p.id === item.id);
        if (!liveProduct || liveProduct.stock < item.quantity) {
          throw new Error(lang === 'en' ? `Sorry, ${item.name} just went out of stock!` : `عذراً، ${item.nameAr} نفد للتو!`);
        }
      }

      await Promise.all(cart.map(item => {
        const product = products.find(p => p.id === item.id)!;
        return dbUpdateProductStock(product.id, product.stock - item.quantity);
      }));

      if (appliedPromo) {
         const promo = promoCodes.find(p => p.id === appliedPromo.id);
         if (promo) {
            const newCount = promo.usedCount + 1;
            await dbUpdatePromo({ ...promo, usedCount: newCount, active: newCount < promo.usageLimit });
         }
      }

      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        items: cart.map(item => ({
          productId: item.id,
          productName: lang === 'en' ? item.name : item.nameAr,
          price: item.price,
          quantity: item.quantity
        })),
        userInfo,
        userId: currentUser?.uid || null, // Add userId
        status: OrderStatus.PENDING,
        timestamp: Date.now(),
        subtotal,
        discount,
        total,
        promoCode: (appliedPromo && appliedPromo.code) ? appliedPromo.code : '',
        paymentMethod
      };

      await dbAddOrder(newOrder);
      setOrderComplete(true);
    } catch (err: any) {
      alert(err.message || 'Error placing order');
      setIsProcessingOrder(false);
    }
  };

  // ...



  // Support State
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportStep, setSupportStep] = useState<'login' | 'chat'>('login');
  const [supportLogin, setSupportLogin] = useState({ orderId: '', phone: '' });
  const [activeSession, setActiveSession] = useState<SupportSession | null>(() => {
    const saved = sessionStorage.getItem('active_support_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  // Security: Removed hardcoded URL token backdoor
  
  useEffect(() => {
    setGlobalErrorCallback((msg) => setDbError(msg));
    const unsubProducts = subscribeToProducts(setProducts);
    const unsubPromos = subscribeToPromos(setPromoCodes);
    return () => {
      if (typeof unsubProducts === 'function') unsubProducts();
      if (typeof unsubPromos === 'function') unsubPromos();
    };
  }, []);

  useEffect(() => {
    const userId = currentUser ? currentUser.uid : null;
    const unsubOrders = subscribeToOrders(isAdmin, userId, setOrders);
    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
    };
  }, [isAdmin, currentUser]);

  useEffect(() => {
    const unsubLoginHistory = subscribeToLoginHistory(isAdmin, setLoginHistory);
    return () => {
      if (typeof unsubLoginHistory === 'function') unsubLoginHistory();
    };
  }, [isAdmin]);

  // Support Realtime Messages
  useEffect(() => {
    if (activeSession) {
      const unsub = subscribeToSupportMessages(activeSession.id, setSupportMessages);
      setSupportStep('chat');
      return () => unsub && unsub();
    } else {
      setSupportStep('login');
      setSupportMessages([]);
    }
  }, [activeSession]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages, isSupportOpen]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-update if the user hasn't manually set a preference in this session
      // or if we want to follow system when no localStorage is set.
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Remote Logout Listener
  useEffect(() => {
    if (isAdmin && currentSessionId) {
      const unsub = subscribeToSessionStatus(currentSessionId, (exists) => {
        if (!exists) {
          handleFullLogout();
          alert(lang === 'en' ? 'Session terminated remotely.' : 'تم إنهاء الجلسة عن بعد.');
        }
      });
      return () => unsub && unsub();
    }
  }, [isAdmin, currentSessionId, lang]);

  const handleFullLogout = useCallback(async () => {
    await dbLogout();
    setIsAdmin(false);
    setCurrentSessionId(null);
    sessionStorage.removeItem('admin_session_id');
  }, []);

  const addProduct = (product: Product) => dbAddProduct(product);
  const deleteProduct = (productId: string) => dbDeleteProduct(productId);
  const addPromoCode = (promo: PromoCode) => dbAddPromo(promo);
  const deletePromoCode = (id: string) => dbDeletePromo(id);
  const deleteLoginHistory = (id: string) => dbDeleteLoginHistory(id);
  const togglePromoCode = (id: string) => {
    const promo = promoCodes.find(p => p.id === id);
    if (promo) dbUpdatePromo({ ...promo, active: !promo.active });
  };
  const updatePromoCode = (promo: PromoCode) => dbUpdatePromo(promo);
  const updateOrderStatus = (id: string, status: OrderStatus) => dbUpdateOrderStatus(id, status);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (quantity <= 0) setCart(prev => prev.filter(item => item.id !== productId));
    else if (quantity <= product.stock) {
      setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
    }
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const discount = useMemo(() => appliedPromo ? Math.floor(subtotal * appliedPromo.discountPercentage / 100) : 0, [subtotal, appliedPromo]);
  const total = subtotal - discount;

  const handleSupportLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find(o => 
      o.id.toUpperCase() === supportLogin.orderId.toUpperCase().trim() && 
      o.userInfo.phone === supportLogin.phone.trim()
    );

    if (order) {
      const newSession: Omit<SupportSession, 'id'> = {
        orderId: order.id,
        phone: order.userInfo.phone,
        userName: order.userInfo.name,
        status: 'OPEN',
        lastMessageTimestamp: Date.now()
      };
      const id = await dbAddSupportSession(newSession);
      const sessionWithId = { ...newSession, id };
      setActiveSession(sessionWithId);
      sessionStorage.setItem('active_support_session', JSON.stringify(sessionWithId));
      
      // Send initial automatic message
      await dbAddSupportMessage({
        sessionId: id,
        text: lang === 'en' ? `Support requested for Order ${order.id}.` : `تم طلب الدعم للطلب رقم ${order.id}.`,
        sender: SupportSender.USER,
        timestamp: Date.now()
      });
    } else {
      alert(t.invalidOrder);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSession) return;

    await dbAddSupportMessage({
      sessionId: activeSession.id,
      text: newMessage.trim(),
      sender: SupportSender.USER,
      timestamp: Date.now()
    });
    setNewMessage('');
  };

  // Fix: Added handleCopy to copy InstaPay info to clipboard and update UI feedback
  const handleCopy = () => {
    const text = t.instaPayInfo.split(':').pop()?.trim() || '01550025915';
    
    const copyToClipboard = (str: string) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(str);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = str;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          textArea.remove();
          return Promise.resolve();
        } catch (err) {
          textArea.remove();
          return Promise.reject(err);
        }
      }
    };

    copyToClipboard(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  // Fix: Added handleApplyPromo to validate and apply the entered promo code
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const promo = promoCodes.find(p => p.code.toUpperCase() === promoInput.toUpperCase().trim());
    if (promo && promo.active && promo.usedCount < promo.usageLimit) {
      setAppliedPromo(promo);
    } else {
      alert(lang === 'en' ? 'Invalid or expired promo code.' : 'كود الخصم غير صالح أو منتهي الصلاحية.');
    }
  };

  const handleReserve = (product: Product) => {
    setReservationProduct(product);
    setIsReservationOpen(true);
    setReservationComplete(false);
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationProduct || isProcessingOrder) return;
    setIsProcessingOrder(true);

    try {
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        items: [{
          productId: reservationProduct.id,
          productName: lang === 'en' ? reservationProduct.name : reservationProduct.nameAr,
          price: reservationProduct.price,
          quantity: 1
        }],
        userInfo,
        userId: currentUser?.uid || null,
        status: OrderStatus.RESERVED,
        timestamp: Date.now(),
        subtotal: reservationProduct.price,
        discount: 0,
        total: reservationProduct.price,
        paymentMethod: 'reservation' as any
      };

      await dbAddOrder(newOrder);
      setReservationComplete(true);
    } catch (err: any) {
      alert(err.message || 'Error placing reservation');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleFinishReservation = () => {
    setIsReservationOpen(false);
    setReservationComplete(false);
    setReservationProduct(null);
    setUserInfo({ name: '', phone: '', address: '' });
  };



  const handleFinishOrder = () => {
    setCart([]);
    setIsCheckout(false);
    setIsCartOpen(false);
    setOrderComplete(false);
    setIsProcessingOrder(false);
    setUserInfo({ name: '', phone: '', address: '' });
    setAppliedPromo(null);
    setPromoInput('');
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 flex flex-col">
      {dbError && (
        <div className="bg-red-600 text-white p-4 font-bold text-sm text-center animate-slideDown shadow-lg z-[200]">
          <div className="container mx-auto flex items-center justify-between gap-4">
             <span className="flex-1">⚠️ {dbError}</span>
             <button onClick={() => setDbError(null)} className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs uppercase tracking-widest">
               {lang === 'en' ? 'Dismiss' : 'إغلاق'}
             </button>
          </div>
        </div>
      )}

      <Header 
        lang={lang} setLang={setLang} 
        theme={theme} setTheme={setTheme} 
        isAdmin={isAdmin} setIsAdmin={setIsAdmin}
        onLogout={handleFullLogout}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        currentUser={currentUser}
        onGoogleLogin={handleGoogleLogin}
        onUserLogout={handleUserLogout}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        t={t}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Routes>
          <Route path="/" element={<UserShop products={products} addToCart={addToCart} handleReserve={handleReserve} lang={lang} t={t} />} />
          <Route path="/product/:id" element={<ProductDetails products={products} addToCart={addToCart} handleReserve={handleReserve} lang={lang} t={t} currentUser={currentUser} orders={orders} />} />
          <Route 
            path="/admin@elkafrawy" 
            element={
              isAdmin ? (
                <AdminPanel 
                  products={products} 
                  orders={orders} 
                  promoCodes={promoCodes} 
                  loginHistory={loginHistory} 
                  addProduct={addProduct} 
                  deleteProduct={deleteProduct} 
                  addPromoCode={addPromoCode} 
                  deletePromoCode={deletePromoCode} 
                  deleteLoginHistory={deleteLoginHistory}
                  togglePromoCode={togglePromoCode} 
                  updatePromoCode={updatePromoCode} 
                  updateOrderStatus={updateOrderStatus} 
                  lang={lang} 
                  t={t} 
                />
              ) : (
                <Login setIsAdmin={setIsAdmin} setCurrentSessionId={setCurrentSessionId} t={t} lang={lang} />
              )
            } 
          />
          <Route path="/tracking" element={<OrderTracking orders={orders} lang={lang} t={t} setIsSecretUnlocked={setIsAdmin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <p className="font-black text-2xl bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent mb-8">{t.storeName}</p>
          <div className="flex justify-center gap-6 mb-8">
            <a href="https://www.facebook.com/ELKFRAW" target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg></a>
            <a href="https://www.youtube.com/@%D8%A7%D9%84%D9%83%D9%81%D8%B1%D8%A7%D9%88%D9%8A%D9%84%D9%84%D9%83%D9%85%D8%A8%D9%8A%D9%88%D8%AA%D8%B1" target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg></a>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">© {new Date().getFullYear()} - Elkafrawy PC & Hardware Specialist.</p>
        </div>
      </footer>

      {/* Floating Buttons Group */}
      <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-4">
        {/* Support Bubble */}
        <button onClick={() => setIsSupportOpen(true)} className="bg-blue-600 text-white p-5 rounded-full shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 transition-all border-2 border-white dark:border-slate-800 group">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          {supportMessages.some(m => m.sender === SupportSender.ADMIN && !isSupportOpen) && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>}
        </button>

        {/* Cart Bubble */}
        <button onClick={() => setIsCartOpen(true)} className="bg-yellow-400 text-slate-900 p-6 rounded-[32px] shadow-[0_20px_50px_rgba(250,204,21,0.4)] flex items-center gap-4 active:scale-95 transition-all group border-2 border-white dark:border-slate-800">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span className="font-black text-xl pr-2">{cart.length > 0 ? `${subtotal} EGP` : t.cart}</span>
          {cart.length > 0 && <span className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-black w-8 h-8 flex items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-950 animate-bounce">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
        </button>
      </div>

      {/* Support Modal */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setIsSupportOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slideUp">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h2 className="text-2xl font-black">{t.support}</h2>
              <button onClick={() => setIsSupportOpen(false)} className="text-slate-400 hover:text-red-500 text-2xl font-black">&times;</button>
            </div>
            
            <div className="p-8 h-[500px] flex flex-col">
              {supportStep === 'login' ? (
                <form onSubmit={handleSupportLogin} className="space-y-6 flex-1 flex flex-col justify-center">
                  <p className="text-slate-500 dark:text-slate-400 text-center font-bold">{t.supportIntro}</p>
                  <div className="space-y-4">
                    <input required type="text" placeholder={t.orderId} className="w-full bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl font-black outline-none border-2 border-transparent focus:border-blue-500 uppercase tracking-widest" value={supportLogin.orderId} onChange={e => setSupportLogin({...supportLogin, orderId: e.target.value})} />
                    <input required type="tel" placeholder={t.phone} className="w-full bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl font-black outline-none border-2 border-transparent focus:border-blue-500" value={supportLogin.phone} onChange={e => setSupportLogin({...supportLogin, phone: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-blue-700 transition-all">{t.startSupport}</button>
                </form>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 pb-4">
                    {supportMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === SupportSender.USER ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-[24px] font-bold text-sm ${msg.sender === SupportSender.USER ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                    <input type="text" placeholder={t.typeMessage} className="flex-1 bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold" value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                    <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col animate-slideIn border-l border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div><h2 className="text-3xl font-black tracking-tight">{t.cart}</h2><p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">{cart.length} {t.itemsCount}</p></div>
              <button onClick={() => setIsCartOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm border border-slate-200 dark:border-slate-700 font-black">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6 opacity-40"><svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg><p className="text-2xl font-black uppercase tracking-widest">{t.emptyCart}</p></div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-5 p-5 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 group hover:border-blue-200 transition-all">
                    <img src={item.image} className="w-24 h-24 object-cover rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800" alt="" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start"><h4 className="font-black text-slate-800 dark:text-white line-clamp-1">{lang === 'en' ? item.name : item.nameAr}</h4><button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                      <div className="flex items-center justify-between"><span className="text-blue-600 dark:text-blue-400 font-black text-lg">{item.price} EGP</span><div className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700"><button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 font-black">-</button><span className="font-black text-sm w-4 text-center">{item.quantity}</span><button disabled={item.quantity >= item.stock} onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 font-black ${item.quantity >= item.stock ? 'opacity-20 cursor-not-allowed' : ''}`}>+</button></div></div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-400 font-black uppercase tracking-widest text-[10px]"><span>{t.subtotal}</span><span>{subtotal} EGP</span></div>
                  {appliedPromo && <div className="flex justify-between text-green-500 font-black uppercase tracking-widest text-[10px]"><span>{t.discount} ({appliedPromo.discountPercentage}%)</span><span>-{discount} EGP</span></div>}
                  <div className="flex justify-between items-end pt-3"><span className="font-black text-slate-800 dark:text-white text-xl uppercase tracking-widest">{t.total}</span><div className="text-right">{appliedPromo && <span className="block text-slate-300 dark:text-slate-600 text-sm line-through font-bold">{subtotal} EGP</span>}<span className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{total} EGP</span></div></div>
                </div>
                <button onClick={() => setIsCheckout(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[28px] shadow-2xl shadow-blue-500/40 transition-all active:scale-95 text-lg uppercase tracking-widest">{t.checkout}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {isReservationOpen && reservationProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => !reservationComplete && !isProcessingOrder && setIsReservationOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-slideUp border border-slate-200 dark:border-slate-800">
            {reservationComplete ? (
              <div className="p-16 text-center space-y-10">
                <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto ring-[16px] ring-blue-50/50 dark:ring-blue-900/10 animate-pulse">
                  <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{t.reserved}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-bold">{t.reservationSuccess}</p>
                </div>
                <button 
                  onClick={handleFinishReservation}
                  className="w-full py-6 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-[32px] text-xl uppercase tracking-[4px] shadow-2xl hover:bg-black transition-all active:scale-95"
                >
                  {t.done}
                </button>
              </div>
            ) : (
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-6">
                  <h2 className="text-3xl font-black tracking-tight">{t.reservation}</h2>
                  <button onClick={() => setIsReservationOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm font-black">&times;</button>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <img src={reservationProduct.image} className="w-20 h-20 object-cover rounded-2xl" alt="" />
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-white">{lang === 'en' ? reservationProduct.name : reservationProduct.nameAr}</h4>
                    <span className="text-blue-500 font-black text-xs uppercase tracking-widest">{t.comingSoon}</span>
                  </div>
                </div>

                <form onSubmit={handleConfirmReservation} className="space-y-6">
                  <div className="space-y-4">
                    <input required type="text" placeholder={t.name} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500/50 rounded-3xl p-6 font-black outline-none transition-all" value={userInfo.name} onChange={e => setUserInfo({...userInfo, name: e.target.value})} disabled={isProcessingOrder} />
                    <input required type="tel" placeholder={t.phone} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500/50 rounded-3xl p-6 font-black outline-none transition-all" value={userInfo.phone} onChange={e => setUserInfo({...userInfo, phone: e.target.value})} disabled={isProcessingOrder} />
                  </div>
                  <button type="submit" disabled={isProcessingOrder} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[32px] shadow-3xl shadow-blue-500/40 transition-all active:scale-95 text-xl uppercase tracking-widest flex items-center justify-center gap-4 ${isProcessingOrder ? 'opacity-70 cursor-wait' : ''}`}>
                    {isProcessingOrder ? <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : t.reserve}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckout && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => !orderComplete && !isProcessingOrder && setIsCheckout(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden animate-slideUp border border-slate-200 dark:border-slate-800">
            {orderComplete ? (
              <div className="p-16 text-center space-y-10">
                <div className="w-32 h-32 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto ring-[16px] ring-green-50/50 dark:ring-green-900/10 animate-pulse"><svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg></div>
                <div className="space-y-4"><h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{lang === 'en' ? 'Success!' : 'تم بنجاح!'}</h2><p className="text-slate-500 dark:text-slate-400 text-xl font-bold">{lang === 'en' ? 'Order placed. Admin will verify soon.' : 'تم تقديم الطلب. المسؤول سيقوم بالمراجعة قريباً.'}</p></div>
                {paymentMethod === 'instapay' && (
                  <div className="bg-yellow-400 text-slate-900 p-10 rounded-[40px] font-black text-2xl shadow-3xl shadow-yellow-500/20 relative group">
                    <p className="text-slate-700 text-[10px] uppercase font-black tracking-[4px] mb-3">InstaPay Address</p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-black text-2xl">{t.instaPayInfo.split(':').pop()?.trim()}</span>
                      <button onClick={handleCopy} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-90 ${copied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                        {copied ? t.copied : t.copy}
                      </button>
                    </div>
                  </div>
                )}
                <button 
                  onClick={handleFinishOrder}
                  className="w-full py-6 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-[32px] text-xl uppercase tracking-[4px] shadow-2xl hover:bg-black transition-all active:scale-95"
                >
                  {t.done}
                </button>
              </div>
            ) : (
              <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                  <h2 className="text-3xl font-black tracking-tight">{t.checkout}</h2>
                  <button disabled={isProcessingOrder} onClick={() => setIsCheckout(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm font-black">&times;</button>
                </div>
                <div className="p-10 space-y-10">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'en' ? 'Order Summary' : 'ملخص الطلب'}</p>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border-2 border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden bg-slate-50 dark:bg-slate-950/30">
                       {cart.map(item => (<div key={item.id} className="p-6 flex justify-between items-center"><div className="flex items-center gap-4"><span className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl text-[10px] font-black border border-slate-200 dark:border-slate-800 shadow-sm">{item.quantity}x</span><span className="font-black text-slate-700 dark:text-slate-200">{lang === 'en' ? item.name : item.nameAr}</span></div><span className="font-black text-slate-900 dark:text-white text-lg">{item.price * item.quantity} EGP</span></div>))}
                       <div className="p-8 bg-white dark:bg-slate-900 flex justify-between items-center border-t border-slate-200 dark:border-slate-800"><span className="font-black uppercase tracking-[4px] text-[10px] text-slate-400">{t.total}</span><div className="text-right">{appliedPromo && <span className="block text-slate-400 text-sm line-through font-bold mb-1">{subtotal} EGP</span>}<span className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{total} EGP</span></div></div>
                    </div>
                  </div>
                  <form onSubmit={handleApplyPromo} className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.promoPlaceholder}</p>
                    <div className="flex gap-4">
                      <input type="text" placeholder={t.promoPlaceholder} className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500/50 rounded-3xl p-6 font-black transition-all outline-none uppercase tracking-widest" value={promoInput} onChange={e => setPromoInput(e.target.value)} disabled={!!appliedPromo || isProcessingOrder} />
                      <button type="submit" disabled={!!appliedPromo || !promoInput || isProcessingOrder} className={`px-10 rounded-3xl font-black transition-all shadow-xl active:scale-95 ${appliedPromo ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-black'}`}>{appliedPromo ? '✓' : t.apply}</button>
                    </div>
                  </form>
                  <form onSubmit={handleConfirmOrder} className="space-y-8">
                    <div className="space-y-5">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.paymentMethod}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          type="button" 
                          onClick={() => setPaymentMethod('instapay')}
                          className={`p-5 rounded-3xl border-2 font-black text-sm uppercase tracking-widest transition-all ${paymentMethod === 'instapay' ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                        >
                          {t.instapay}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setPaymentMethod('cod')}
                          className={`p-5 rounded-3xl border-2 font-black text-sm uppercase tracking-widest transition-all ${paymentMethod === 'cod' ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                        >
                          {t.cod}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-5">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'en' ? 'Shipping Details' : 'بيانات الشحن'}</p>
                      <div className="space-y-5">
                        <input required type="text" placeholder={t.name} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500/50 rounded-3xl p-6 font-black outline-none transition-all" value={userInfo.name} onChange={e => setUserInfo({...userInfo, name: e.target.value})} disabled={isProcessingOrder} />
                        <input required type="tel" placeholder={t.phone} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500/50 rounded-3xl p-6 font-black outline-none transition-all" value={userInfo.phone} onChange={e => setUserInfo({...userInfo, phone: e.target.value})} disabled={isProcessingOrder} />
                        <textarea required rows={3} placeholder={t.address} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500/50 rounded-[32px] p-6 font-black outline-none transition-all resize-none" value={userInfo.address} onChange={e => setUserInfo({...userInfo, address: e.target.value})} disabled={isProcessingOrder} />
                      </div>
                    </div>
                    <button type="submit" disabled={isProcessingOrder} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-7 rounded-[32px] shadow-3xl shadow-blue-500/40 transition-all active:scale-95 text-xl uppercase tracking-widest flex items-center justify-center gap-4 ${isProcessingOrder ? 'opacity-70 cursor-wait' : ''}`}>
                      {isProcessingOrder ? <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : t.confirmOrder}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
