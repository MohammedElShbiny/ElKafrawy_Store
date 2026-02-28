
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, Language } from '../types';

interface OrderTrackingProps {
  orders: Order[];
  lang: Language;
  t: any;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ orders, lang, t }) => {
  const [searchPhone, setSearchPhone] = useState('');
  const [foundOrders, setFoundOrders] = useState<Order[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const results = orders.filter(o => o.userInfo.phone.trim() === searchPhone.trim());
    setFoundOrders(results);
    setHasSearched(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-fadeIn pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{t.orders}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-lg mx-auto leading-relaxed">
          {lang === 'en' ? 'Track your recent purchases from Elkafrawy Modern Tech.' : 'تتبع مشترياتك الأخيرة من الكفراوي للتكنولوجيا الحديثه.'}
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
             <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
             </div>
             <input 
              required
              type="text" 
              placeholder={t.phone}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl py-5 pl-14 pr-6 focus:border-blue-500 transition-all outline-none font-black text-lg shadow-xl shadow-slate-200/50 dark:shadow-none"
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
            />
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-3xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95 text-lg uppercase tracking-widest">
            {lang === 'en' ? 'Track' : 'تتبع'}
          </button>
        </form>

        <div className="space-y-6">
          {hasSearched && foundOrders.length === 0 && (
            <div className="text-center p-16 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-2xl animate-slideUp">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest">
                {lang === 'en' ? 'No orders found for this number.' : 'لم يتم العثور على طلبات لهذا الرقم.'}
              </p>
            </div>
          )}

          {foundOrders.map(order => (
            <div key={order.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 animate-slideUp group hover:border-blue-300 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-black text-2xl text-slate-800 dark:text-white leading-tight mb-2">
                    {order.items.map(item => item.productName).join(', ')}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg">ID: {order.id}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg">{order.total} EGP</span>
                  </div>
                </div>
                <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                  order.status === OrderStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                  order.status === OrderStatus.ACCEPTED ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {t[order.status.toLowerCase()]}
                </span>
              </div>
              
              <div className="p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                {order.status === OrderStatus.ACCEPTED ? (
                  <div className="flex items-center gap-4 text-green-600 dark:text-green-400">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <p className="font-black text-lg leading-tight">{t.doneMessage}</p>
                  </div>
                ) : order.status === OrderStatus.REFUSED ? (
                  <div className="flex items-center gap-4 text-red-600 dark:text-red-400">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    </div>
                    <p className="font-black text-lg leading-tight">{t.refusedMessage}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center animate-pulse">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="font-black text-lg leading-tight">
                      {lang === 'en' ? 'Your order is being reviewed by the team.' : 'طلبك قيد المراجعة من قبل الفريق.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Big Instruction Section */}
      <div className="max-w-3xl mx-auto pt-10">
        <div className="bg-yellow-400 text-slate-900 rounded-[56px] p-12 md:p-16 shadow-[0_30px_80px_rgba(250,204,21,0.3)] relative overflow-hidden group border-4 border-white dark:border-slate-800">
           {/* Background Graphic Decoration */}
           <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
           <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-black/5 rounded-full blur-2xl group-hover:bg-black/10 transition-all duration-700"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white/95 rounded-[36px] flex items-center justify-center shadow-2xl shrink-0 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <svg className="w-12 h-12 md:w-16 md:h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div className="space-y-6 text-center md:text-left rtl:md:text-right">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">
                  {t.howToGetOrderId}
                </h2>
                <p className="text-lg md:text-xl font-black text-slate-800/80 leading-relaxed">
                  {t.orderIdInstruction}
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
