
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Product, Order, OrderStatus, Language, PromoCode, Specification, SupportSession, SupportMessage, SupportSender, AdminLoginHistory } from '../types';
import { subscribeToSupportSessions, subscribeToSupportMessages, dbAddSupportMessage, dbCloseSupportSession, dbClearAllOrders, dbAddNotification } from '../services/db';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Users, Package, Activity, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  promoCodes: PromoCode[];
  loginHistory: AdminLoginHistory[];
  addProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  addPromoCode: (p: PromoCode) => void;
  deletePromoCode: (id: string) => void;
  deleteLoginHistory: (id: string) => void;
  togglePromoCode: (id: string) => void;
  updatePromoCode: (p: PromoCode) => void;
  updateOrderStatus: (id: string, s: OrderStatus) => void;
  lang: Language;
  t: any;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, orders, promoCodes, loginHistory, addProduct, deleteProduct, addPromoCode, deletePromoCode, deleteLoginHistory, togglePromoCode, updatePromoCode, updateOrderStatus, lang, t 
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'promos' | 'support' | 'history' | 'analytics'>('analytics');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [showMobileQR, setShowMobileQR] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Support Admin State
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SupportSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<SupportMessage[]>([]);
  const [adminReply, setAdminReply] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleClearAllData = async () => {
    await dbClearAllOrders();
    setShowClearConfirm(false);
    alert(t.dataCleared);
  };

  useEffect(() => {
    if (activeTab === 'support') {
      const unsub = subscribeToSupportSessions(setSessions);
      return () => unsub && unsub();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedSession) {
      const unsub = subscribeToSupportMessages(selectedSession.id, setSessionMessages);
      return () => unsub && unsub();
    }
  }, [selectedSession]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages]);

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReply.trim() || !selectedSession) return;
    await dbAddSupportMessage({
      sessionId: selectedSession.id,
      text: adminReply.trim(),
      sender: SupportSender.ADMIN,
      timestamp: Date.now()
    });
    setAdminReply('');
  };

  const closeSession = async (id: string) => {
    await dbCloseSupportSession(id);
    setSelectedSession(null);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: 'pc',
    price: 0,
    costPrice: 0,
    stock: 1,
    specifications: [],
    comingSoon: false
  });

  const [newPromo, setNewPromo] = useState<Partial<PromoCode>>({
    code: '',
    discountPercentage: 0,
    active: true,
    usageLimit: 100,
    usedCount: 0
  });

  const mobileAccessUrl = useMemo(() => {
    const baseUrl = window.location.origin + window.location.pathname;
    const hash = window.location.hash.split('?')[0] || '#/admin';
    return `${baseUrl}${hash}?admin_access=ELKAFRAWY_MOBILE_TOKEN_2025`;
  }, []);

  const qrImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mobileAccessUrl)}`;
  }, [mobileAccessUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addSpecField = () => {
    setNewProduct(prev => ({
      ...prev,
      specifications: [...(prev.specifications || []), { label: '', value: '' }]
    }));
  };

  const updateSpecField = (index: number, field: keyof Specification, value: string) => {
    const newSpecs = [...(newProduct.specifications || [])];
    (newSpecs[index] as any)[field] = value;
    setNewProduct({ ...newProduct, specifications: newSpecs });
  };

  const removeSpecField = (index: number) => {
    const newSpecs = (newProduct.specifications || []).filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, specifications: newSpecs });
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      ...newProduct as Product,
      id: editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9),
      image: newProduct.image || 'https://picsum.photos/600/400',
      specifications: newProduct.specifications || [],
      price: newProduct.price || 0,
      costPrice: newProduct.costPrice || 0,
      stock: newProduct.stock || 0,
      comingSoon: !!newProduct.comingSoon
    };
    addProduct(product);
    setIsAddingProduct(false);
    setEditingProduct(null);
    setNewProduct({ category: 'pc', price: 0, costPrice: 0, stock: 1, specifications: [], comingSoon: false });
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setIsAddingProduct(true);
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const promo: PromoCode = {
      ...newPromo as PromoCode,
      id: Math.random().toString(36).substr(2, 9),
      usedCount: 0
    };
    addPromoCode(promo);
    setIsAddingPromo(false);
    setNewPromo({ code: '', discountPercentage: 0, active: true, usageLimit: 100, usedCount: 0 });
  };

  const analyticsData = useMemo(() => {
    const acceptedOrders = orders.filter(o => o.status === OrderStatus.ACCEPTED);
    const totalRevenue = Math.round(acceptedOrders.reduce((sum, o) => sum + o.total, 0));
    const totalOrders = orders.length;
    const avgOrderValue = acceptedOrders.length > 0 ? Math.round(totalRevenue / acceptedOrders.length) : 0;

    // Sales over time (grouped by day)
    const salesByDay: Record<string, number> = {};
    acceptedOrders.forEach(o => {
      const date = new Date(o.timestamp).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', { month: 'short', day: 'numeric' });
      salesByDay[date] = (salesByDay[date] || 0) + o.total;
    });
    const salesOverTime = Object.entries(salesByDay).map(([name, revenue]) => ({ name, revenue })).reverse().slice(0, 7);

    // Best sellers
    const productSales: Record<string, { name: string, count: number }> = {};
    acceptedOrders.forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, count: 0 };
        }
        productSales[item.productId].count += item.quantity;
      });
    });
    const bestSellers = Object.values(productSales).sort((a, b) => b.count - a.count).slice(0, 5);

    // Order status distribution
    const statusCounts = [
      { name: t.pending, value: orders.filter(o => o.status === OrderStatus.PENDING).length, color: '#f59e0b' },
      { name: t.accepted, value: orders.filter(o => o.status === OrderStatus.ACCEPTED).length, color: '#10b981' },
      { name: t.refused, value: orders.filter(o => o.status === OrderStatus.REFUSED).length, color: '#ef4444' },
      { name: t.reserved, value: orders.filter(o => o.status === OrderStatus.RESERVED).length, color: '#3b82f6' },
    ];

    // Total Profit calculation
    let totalCost = 0;
    acceptedOrders.forEach(o => {
      o.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cost = product ? product.costPrice : 0;
        totalCost += cost * item.quantity;
      });
    });
    const totalProfit = Math.round(totalRevenue - totalCost);
    const profitRatio = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    return { totalRevenue, totalOrders, avgOrderValue, totalProfit, profitRatio, salesOverTime, bestSellers, statusCounts };
  }, [orders, products, lang, t]);

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    const order = orders.find(o => o.id === id);
    if (order && order.status === OrderStatus.RESERVED && status === OrderStatus.ACCEPTED && order.userId) {
      await dbAddNotification({
        userId: order.userId,
        title: lang === 'en' ? 'Order Available!' : 'طلبك متوفر الآن!',
        message: lang === 'en' 
          ? `Your reserved order #${order.id} is now available. We will contact you shortly.` 
          : `طلبك المحجوز رقم #${order.id} متوفر الآن. سنتواصل معك قريباً.`,
        read: false,
        timestamp: Date.now(),
        type: 'order_update',
        link: '/tracking'
      });
    }
    updateOrderStatus(id, status);
  };

  return (
    <div className="space-y-10 animate-fadeIn px-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{t.dashboard}</h1>
        
        <div className="flex flex-wrap gap-4 items-center">
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-600 transition-all active:scale-95 border-2 border-white dark:border-slate-800"
          >
            <Trash2 size={18} />
            {t.clearAllData}
          </button>
          <button 
            onClick={() => setShowMobileQR(true)}
            className="flex items-center gap-2 bg-yellow-400 text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-yellow-500 transition-all active:scale-95 border-2 border-white dark:border-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            Mobile Access
          </button>

          <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-[24px] shadow-inner overflow-x-auto whitespace-nowrap scrollbar-hide">
            {(['analytics', 'orders', 'products', 'promos', 'support', 'history'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3.5 rounded-[20px] font-black text-[10px] uppercase tracking-[2px] transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-xl text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                {t[tab === 'promos' ? 'promoCodes' : tab]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <div className="space-y-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                <DollarSign size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.totalRevenue}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{analyticsData.totalRevenue} EGP</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-5">
              <div className="w-14 h-14 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center text-yellow-600 shrink-0">
                <ShoppingBag size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.totalOrders}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{analyticsData.totalOrders}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-5">
              <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
                <TrendingUp size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.profit}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{analyticsData.totalProfit} EGP</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-5">
              <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
                <Activity size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.profitRatio}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{analyticsData.profitRatio}%</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Sales Chart */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-3">
                  <TrendingUp className="text-blue-600" /> {t.salesOverTime}
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.salesOverTime}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 900 }}
                      cursor={{ stroke: '#2563eb', strokeWidth: 2 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Best Sellers */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-3">
                <Package className="text-yellow-500" /> {t.bestSellers}
              </h3>
              <div className="space-y-6">
                {analyticsData.bestSellers.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {i + 1}
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-32 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${analyticsData.bestSellers[0].count > 0 ? (item.count / analyticsData.bestSellers[0].count) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="font-black text-blue-600">{item.count}</span>
                    </div>
                  </div>
                ))}
                {analyticsData.bestSellers.length === 0 && (
                  <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest opacity-30">No Sales Data</div>
                )}
              </div>
            </div>

            {/* Order Status Pie */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-3">
                <Activity className="text-green-500" /> {t.orderStatus}
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="h-[250px] w-full max-w-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.statusCounts}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {analyticsData.statusCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 900 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4 w-full sm:w-auto">
                  {analyticsData.statusCounts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">{s.name}</span>
                      </div>
                      <span className="font-black text-slate-800 dark:text-white">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'support' ? (
        <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl border border-slate-200 dark:border-slate-800 h-[700px] flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-slate-100 dark:border-slate-800 flex flex-col">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t.activeSessions}</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {sessions.filter(s => s.status === 'OPEN').map(session => (
                <button 
                  key={session.id} 
                  onClick={() => setSelectedSession(session)}
                  className={`w-full p-8 text-left border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all ${selectedSession?.id === session.id ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-600' : ''}`}
                >
                  <p className="font-black text-slate-800 dark:text-white mb-1">{session.userName}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order: {session.orderId}</p>
                </button>
              ))}
              {sessions.filter(s => s.status === 'OPEN').length === 0 && (
                <div className="p-12 text-center opacity-30 font-black uppercase text-[10px] tracking-widest">No Active Chats</div>
              )}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/20">
            {selectedSession ? (
              <>
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                  <div>
                    <h3 className="text-xl font-black">{selectedSession.userName}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {selectedSession.orderId} • {selectedSession.phone}</p>
                  </div>
                  <button 
                    onClick={() => closeSession(selectedSession.id)}
                    className="px-6 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all"
                  >
                    {t.resolved}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                  {sessionMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === SupportSender.ADMIN ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-4 rounded-[28px] font-bold text-sm ${msg.sender === SupportSender.ADMIN ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleAdminReply} className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                  <input 
                    type="text" 
                    placeholder={t.typeMessage} 
                    className="flex-1 bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold" 
                    value={adminReply} 
                    onChange={e => setAdminReply(e.target.value)} 
                  />
                  <button type="submit" className="bg-blue-600 text-white px-8 rounded-2xl font-black active:scale-95 transition-all">
                    {t.send}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 opacity-40 font-black uppercase tracking-widest">
                Select a conversation to start
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'products' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest border-l-4 border-yellow-400 pl-4">{t.products}</h2>
            <button 
              onClick={() => setIsAddingProduct(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[24px] font-black shadow-2xl shadow-blue-500/40 flex items-center gap-3 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              {t.addProducts}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-10 py-8">{t.products}</th>
                    <th className="px-10 py-8">{t.category}</th>
                    <th className="px-10 py-8">{t.price}</th>
                    <th className="px-10 py-8">{t.profitRatio}</th>
                    <th className="px-10 py-8">{t.stock}</th>
                    <th className="px-10 py-8 text-right rtl:text-left">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {products.map(p => {
                    const profit = Math.round(p.price - p.costPrice);
                    const ratio = p.costPrice > 0 ? Math.round((profit / p.costPrice) * 100) : 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                        <td className="px-10 py-8 flex items-center gap-6">
                          <div className="relative">
                            <img src={p.image} className="w-20 h-20 rounded-[28px] object-cover ring-4 ring-slate-100 dark:ring-slate-800 shadow-md group-hover:scale-110 transition-transform" alt="" />
                            {p.comingSoon && (
                              <span className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 text-[8px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-tighter ring-2 ring-white dark:ring-slate-900">Soon</span>
                            )}
                          </div>
                          <div>
                             <p className="font-black text-slate-800 dark:text-white text-lg">{lang === 'en' ? p.name : p.nameAr}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">ID: {p.id}</p>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                           <span className="px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                             {t[p.category === 'pc' ? 'pcs' : p.category === 'laptop' ? 'laptops' : 'accessories']}
                           </span>
                        </td>
                        <td className="px-10 py-8 font-black text-blue-600 dark:text-blue-400 text-xl">{p.price} EGP</td>
                        <td className="px-10 py-8">
                           <div className="flex flex-col">
                             <span className={`font-black text-sm ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                               {profit > 0 ? '+' : ''}{profit} EGP
                             </span>
                             <span className="text-[10px] font-bold text-slate-400">
                               {ratio}%
                             </span>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`font-black text-lg ${p.stock <= 5 ? 'text-yellow-500' : p.stock <= 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right rtl:text-left">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => startEditProduct(p)}
                              className="p-4 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-blue-100"
                              title={t.edit}
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button 
                              onClick={() => deleteProduct(p.id)}
                              className="p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-red-100"
                              title={t.delete}
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'promos' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest border-l-4 border-yellow-400 pl-4">{t.promoCodes}</h2>
            <button 
              onClick={() => setIsAddingPromo(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[24px] font-black shadow-2xl shadow-blue-500/40 transition-all active:scale-95"
            >
              {t.addPromo}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {promoCodes.map(promo => (
              <div key={promo.id} className={`p-10 rounded-[40px] border-2 transition-all relative overflow-hidden group ${promo.active && promo.usedCount < promo.usageLimit ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-slate-100 dark:bg-slate-800/20 border-transparent grayscale'}`}>
                <div className="flex justify-between items-start mb-8">
                  <span className="px-6 py-3 bg-yellow-400 text-slate-900 rounded-2xl text-2xl font-black tracking-widest shadow-xl ring-2 ring-white dark:ring-slate-800">{promo.code}</span>
                  <div className="flex gap-2">
                    <button onClick={() => togglePromoCode(promo.id)} className={`p-3 rounded-xl transition-all shadow-sm ${promo.active ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </button>
                    <button onClick={() => deletePromoCode(promo.id)} className="p-3 bg-red-50 text-red-500 rounded-xl shadow-sm hover:bg-red-100 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.discount}</p>
                     <p className="text-4xl font-black text-slate-800 dark:text-white">{promo.discountPercentage}% <span className="text-sm font-bold uppercase tracking-widest opacity-40">OFF</span></p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       <span>{t.used} ({promo.usedCount})</span>
                       <span>{t.remaining} ({Math.max(0, promo.usageLimit - promo.usedCount)})</span>
                    </div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${promo.usedCount >= promo.usageLimit ? 'bg-red-500' : 'bg-blue-600'}`}
                         style={{ width: `${Math.min(100, (promo.usedCount / promo.usageLimit) * 100)}%` }}
                       />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'history' ? (
        <div className="space-y-8">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest border-l-4 border-yellow-400 pl-4">{t.history}</h2>
          <div className="bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-10 py-8">{t.time}</th>
                    <th className="px-10 py-8">{t.device}</th>
                    <th className="px-10 py-8">{t.location}</th>
                    <th className="px-10 py-8 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loginHistory.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                      <td className="px-10 py-8 font-black text-slate-700 dark:text-slate-300">{new Date(h.timestamp).toLocaleString()}</td>
                      <td className="px-10 py-8">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 max-w-xs truncate" title={h.device}>{h.device}</p>
                      </td>
                      <td className="px-10 py-8">
                        <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
                          {h.location}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button 
                          onClick={() => deleteLoginHistory(h.id)}
                          className="p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-red-100"
                          title="Remote Logout"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {loginHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-10 py-20 text-center text-slate-400 font-black uppercase tracking-widest opacity-30">No Login History</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest border-l-4 border-yellow-400 pl-4">{t.orders}</h2>
          <div className="grid gap-8">
            {orders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-32 text-center rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 shadow-2xl">
                <p className="font-black text-2xl uppercase tracking-[10px] opacity-20">{lang === 'en' ? 'Empty Orders' : 'لا توجد طلبات'}</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-2xl border border-slate-200 dark:border-slate-800 space-y-10 group hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-6">
                      <div className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[3px] shadow-sm ${
                        order.status === OrderStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                        order.status === OrderStatus.ACCEPTED ? 'bg-green-100 text-green-700' :
                        order.status === OrderStatus.RESERVED ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {t[order.status.toLowerCase()]}
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[2px]">Order #{order.id}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-inner">{new Date(order.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-l-4 border-blue-600 pl-3">Ordered Items</p>
                      <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800/50 shadow-inner">
                         {order.items.map((item, idx) => (
                           <div key={idx} className="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-white dark:hover:bg-slate-800 transition-all">
                             <div className="font-black text-slate-700 dark:text-slate-300 text-lg">
                               <span className="text-blue-500 mr-3 text-sm">{item.quantity}x</span> {item.productName}
                             </div>
                             <span className="font-black text-slate-400 text-lg">{Math.round(item.price * item.quantity)} EGP</span>
                           </div>
                         ))}
                         <div className="p-8 bg-slate-100 dark:bg-slate-800/80 flex justify-between items-center border-t-2 border-white dark:border-slate-700">
                           <div className="space-y-2">
                             {order.promoCode && (
                               <span className="block px-3 py-1 bg-yellow-400 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md w-fit">Promo: {order.promoCode} (-{Math.round(order.discount)} EGP)</span>
                             )}
                             <span className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest">TOTAL</span>
                           </div>
                           <span className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{Math.round(order.total)} EGP</span>
                         </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-l-4 border-blue-600 pl-3">Customer Details</p>
                      <div className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800/50 shadow-inner grid grid-cols-1 gap-8">
                        <div>
                           <p className="text-[10px] text-slate-400 uppercase font-black mb-2 tracking-widest">{t.name}</p>
                           <p className="font-black text-slate-800 dark:text-white text-2xl">{order.userInfo.name}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                             <p className="text-[10px] text-slate-400 uppercase font-black mb-2 tracking-widest">{t.phone}</p>
                             <p className="font-black text-slate-800 dark:text-white text-lg">{order.userInfo.phone}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-slate-400 uppercase font-black mb-2 tracking-widest">{t.address}</p>
                             <p className="font-black text-slate-800 dark:text-white text-sm leading-relaxed">{order.userInfo.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                      <div className="flex justify-end gap-4 pt-6">
                        <button 
                          onClick={() => setPrintingOrder(order)}
                          className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          {t.printReceipt}
                        </button>
                        {(order.status === OrderStatus.PENDING || order.status === OrderStatus.RESERVED) && (
                          <div className="flex gap-4 flex-1">
                            <button 
                              onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.ACCEPTED)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-[28px] font-black shadow-2xl shadow-blue-500/30 transition-all flex-1 active:scale-95 uppercase tracking-[4px] text-lg"
                            >
                              {t.accept}
                            </button>
                            <button 
                              onClick={() => handleUpdateOrderStatus(order.id, OrderStatus.REFUSED)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-12 py-6 rounded-[28px] font-black transition-all flex-1 uppercase tracking-[4px] border border-red-100 dark:border-red-900/30"
                            >
                              {t.refuse}
                            </button>
                          </div>
                        )}
                      </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowClearConfirm(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slideUp p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <Trash2 size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">{t.clearAllData}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {t.clearDataConfirm}
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-2xl active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearAllData}
                className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-red-500/30"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile QR Modal */}
      {showMobileQR && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowMobileQR(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-md rounded-[48px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slideUp p-10 space-y-8 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight">Access on Phone</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                Scan this code to access admin tools on mobile.
              </p>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-inner border border-slate-100 inline-block mx-auto">
              <img src={qrImageUrl} alt="QR Code" className="w-64 h-64" />
            </div>
            <button 
              onClick={() => setShowMobileQR(false)}
              className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-3xl active:scale-95 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => { setIsAddingProduct(false); setEditingProduct(null); setNewProduct({ category: 'pc', price: 0, costPrice: 0, stock: 1, specifications: [], comingSoon: false }); }} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[48px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slideUp">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h2 className="text-3xl font-black tracking-tight">{editingProduct ? t.edit : t.addProducts}</h2>
              <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); setNewProduct({ category: 'pc', price: 0, costPrice: 0, stock: 1, specifications: [], comingSoon: false }); }} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm transition-all border border-slate-200 dark:border-slate-700 font-black">&times;</button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 sm:p-10 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Name (EN)</label>
                <input required type="text" className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-slate-200 dark:border-slate-700/50 font-black shadow-inner focus:border-blue-500 outline-none" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Name (AR)</label>
                <input required type="text" className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-slate-200 dark:border-slate-700/50 font-black shadow-inner focus:border-blue-500 outline-none" value={newProduct.nameAr || ''} onChange={e => setNewProduct({...newProduct, nameAr: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Category</label>
                <select className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-slate-200 dark:border-slate-700/50 appearance-none font-black shadow-inner focus:border-blue-500 outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}>
                  <option value="pc">PC</option>
                  <option value="laptop">Laptop</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Price (EGP)</label>
                <input 
                  required={!newProduct.comingSoon} 
                  type="number" 
                  className={`w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-slate-200 dark:border-slate-700/50 font-black shadow-inner focus:border-blue-500 outline-none transition-all ${newProduct.comingSoon ? 'opacity-50 cursor-not-allowed grayscale' : ''}`} 
                  value={newProduct.price || ''} 
                  onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                  disabled={newProduct.comingSoon}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Cost Price (EGP)</label>
                <input 
                  required={!newProduct.comingSoon} 
                  type="number" 
                  className={`w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-slate-200 dark:border-slate-700/50 font-black shadow-inner focus:border-blue-500 outline-none transition-all ${newProduct.comingSoon ? 'opacity-50 cursor-not-allowed grayscale' : ''}`} 
                  value={newProduct.costPrice || ''} 
                  onChange={e => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                  disabled={newProduct.comingSoon}
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Stock Amount</label>
                <input 
                  required={!newProduct.comingSoon} 
                  type="number" 
                  min="0" 
                  className={`w-full bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-slate-200 dark:border-slate-700/50 font-black shadow-inner focus:border-blue-500 outline-none transition-all ${newProduct.comingSoon ? 'opacity-50 cursor-not-allowed grayscale' : ''}`} 
                  value={newProduct.stock || (newProduct.comingSoon ? 0 : 1)} 
                  onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                  disabled={newProduct.comingSoon}
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-200 dark:border-slate-700/50">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Coming Soon</label>
                  <p className="text-xs font-bold text-slate-400 mt-1">Show "Coming Soon" badge on this product</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setNewProduct({...newProduct, comingSoon: !newProduct.comingSoon})}
                  className={`w-16 h-8 rounded-full transition-all relative ${newProduct.comingSoon ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${newProduct.comingSoon ? 'left-9' : 'left-1'}`} />
                </button>
              </div>

              <div className="sm:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">{t.specifications}</label>
                   <button type="button" onClick={addSpecField} className="px-4 py-2 bg-yellow-400 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-md">+ Add Spec</button>
                </div>
                <div className="space-y-4">
                  {(newProduct.specifications || []).map((spec, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-7 gap-4 items-end animate-fadeIn bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl sm:bg-transparent sm:p-0">
                       <div className="sm:col-span-3 space-y-1">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{t.label}</span>
                          <input type="text" className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 font-bold text-sm" value={spec.label} onChange={e => updateSpecField(idx, 'label', e.target.value)} />
                       </div>
                       <div className="sm:col-span-3 space-y-1">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{t.value}</span>
                          <input type="text" className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 font-bold text-sm" value={spec.value} onChange={e => updateSpecField(idx, 'value', e.target.value)} />
                       </div>
                       <button type="button" onClick={() => removeSpecField(idx)} className="sm:col-span-1 p-3 text-red-300 hover:text-red-500 transition-colors flex justify-center">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Image</label>
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[40px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group shadow-inner">
                  {newProduct.image ? (
                    <>
                      <img src={newProduct.image} className="absolute inset-0 w-full h-full object-cover opacity-50 transition-all group-hover:opacity-70" alt="" />
                      <span className="relative font-black text-slate-800 text-sm bg-yellow-400 px-6 py-2 rounded-full shadow-lg">Change Image</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-12 h-12 text-slate-300 group-hover:text-blue-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[2px]">Upload Image</span>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Description (EN)</label>
                <textarea className="w-full bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200 dark:border-slate-700 font-medium shadow-inner resize-none focus:border-blue-500 outline-none" rows={4} value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Description (AR)</label>
                <textarea className="w-full bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200 dark:border-slate-700 font-medium shadow-inner resize-none focus:border-blue-500 outline-none" rows={4} value={newProduct.descriptionAr || ''} onChange={e => setNewProduct({...newProduct, descriptionAr: e.target.value})} />
              </div>

              <div className="sm:col-span-2 pt-6 pb-4">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 sm:py-7 rounded-[32px] shadow-3xl shadow-blue-500/40 transition-all uppercase tracking-[4px] active:scale-95 text-lg">
                  {editingProduct ? t.edit : t.addProducts}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingPromo && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsAddingPromo(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slideUp">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h2 className="text-2xl font-black tracking-tight">{t.addPromo}</h2>
              <button onClick={() => setIsAddingPromo(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm border border-slate-200 dark:border-slate-700 font-black transition-all">&times;</button>
            </div>
            <form onSubmit={handleAddPromo} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Code</label>
                <input required type="text" className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-6 border border-slate-200 dark:border-slate-700/50 font-black uppercase tracking-[4px] shadow-inner focus:border-blue-500 outline-none" value={newPromo.code || ''} onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">Discount %</label>
                <input required type="number" className="w-full bg-white dark:bg-slate-800 rounded-[20px] p-6 border border-slate-200 dark:border-slate-700/50 font-black shadow-inner focus:border-blue-500 outline-none" value={newPromo.discountPercentage || ''} onChange={e => setNewPromo({...newPromo, discountPercentage: Number(e.target.value)})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[28px] shadow-2xl shadow-blue-500/30 transition-all active:scale-95 uppercase tracking-[4px]">Create Promo Code</button>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {printingOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm print:bg-white print:p-0">
          <div className="absolute inset-0 print:hidden" onClick={() => setPrintingOrder(null)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slideUp flex flex-col print:rounded-none print:shadow-none print:border-none print:max-w-none print:h-auto">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 print:hidden">
              <h2 className="text-xl font-black">{t.receipt}</h2>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
                >
                  {t.printReceipt}
                </button>
                <button onClick={() => setPrintingOrder(null)} className="text-slate-400 hover:text-red-500 text-xl font-black">&times;</button>
              </div>
            </div>

            <div className="p-8 space-y-8 flex-1 overflow-y-auto print:overflow-visible print:p-6 print:text-black">
              {/* Receipt Header */}
              <div className="text-center space-y-3 border-b-2 border-slate-900 pb-8">
                <h1 className="text-3xl font-black tracking-tighter uppercase">{t.storeName}</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t.receipt}</p>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest pt-3">
                  <span>{t.orderId}: {printingOrder.id}</span>
                  <span>{t.orderDate}: {new Date(printingOrder.timestamp).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 print:bg-white print:border-slate-200">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t.customerName}</p>
                  <p className="font-black text-lg">{printingOrder.userInfo.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t.customerPhone}</p>
                  <p className="font-black text-lg">{printingOrder.userInfo.phone}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t.paymentMethod}</p>
                  <p className="font-black text-lg">
                    {printingOrder.paymentMethod === 'instapay' ? t.instapay : 
                     printingOrder.paymentMethod === 'reservation' ? t.reservation : t.cod}
                  </p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t.customerAddress}</p>
                  <p className="font-bold text-sm">{printingOrder.userInfo.address}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest border-l-4 border-blue-600 pl-3">{t.itemsList}</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-[24px] overflow-hidden">
                  {printingOrder.items.map((item, i) => (
                    <div key={i} className="p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg font-black text-[10px] border border-slate-200 dark:border-slate-800">{item.quantity}x</span>
                        <span className="font-black text-sm">{item.productName}</span>
                      </div>
                      <span className="font-black text-lg">{item.price * item.quantity} EGP</span>
                    </div>
                  ))}
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                    <span className="text-lg font-black uppercase tracking-widest">{t.total}</span>
                    <span className="text-3xl font-black tracking-tighter">{printingOrder.total} EGP</span>
                  </div>
                </div>
              </div>

              {/* Warranty Notice */}
              <div className="bg-yellow-400 text-slate-900 p-6 rounded-[24px] text-center shadow-lg rotate-1">
                <p className="text-xl font-black uppercase tracking-tighter">{t.warrantyNotice}</p>
              </div>

              {/* Footer */}
              <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Thank you for shopping with Elkafrawy Modern Tech</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
