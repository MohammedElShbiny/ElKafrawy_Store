
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, Language } from '../types';

interface ProductDetailsProps {
  products: Product[];
  addToCart: (p: Product) => void;
  handleReserve: (p: Product) => void;
  lang: Language;
  t: any;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ products, addToCart, handleReserve, lang, t }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black">{lang === 'en' ? 'Product Not Found' : 'المنتج غير موجود'}</h2>
        <Link to="/" className="text-blue-600 mt-4 block font-bold hover:underline">{t.back}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn px-4">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-black uppercase text-xs tracking-widest"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        {t.back}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div className="relative">
          <div className="aspect-square rounded-[48px] overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ring-1 ring-black/[0.05]">
            <img 
              src={product.image} 
              className="w-full h-full object-cover" 
              alt={product.name} 
            />
          </div>
          <div className="absolute top-8 left-8 flex gap-3">
            <span className="px-6 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border border-slate-200 dark:border-slate-800">
              {t[product.category === 'pc' ? 'pcs' : product.category === 'laptop' ? 'laptops' : 'accessories']}
            </span>
            {product.stock <= 0 && !product.comingSoon && (
              <span className="px-6 py-2.5 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                {t.outOfStock}
              </span>
            )}
            {product.comingSoon && (
              <span className="px-6 py-2.5 bg-yellow-400 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                {lang === 'en' ? 'Coming Soon' : 'قريباً'}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-12">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white leading-tight tracking-tighter">
              {lang === 'en' ? product.name : product.nameAr}
            </h1>
            <div className="flex items-center gap-6">
              <p className="text-4xl font-black text-blue-600 dark:text-blue-400">
                {product.comingSoon ? (lang === 'en' ? 'Coming Soon' : 'قريباً') : `${product.price} EGP`}
              </p>
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className={`w-3 h-3 rounded-full ${product.comingSoon ? 'bg-blue-400 animate-pulse' : product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-black uppercase tracking-widest ${product.comingSoon ? 'text-blue-500' : product.stock <= 10 && product.stock > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {product.comingSoon ? (lang === 'en' ? 'Coming Soon' : 'قريباً') : product.stock > 0 ? `${product.stock} ${t.stock}` : t.outOfStock}
                </span>
              </div>
            </div>
          </div>

          <div className="p-10 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium">
              {lang === 'en' ? product.description : product.descriptionAr}
            </p>
          </div>

          {product.specifications && product.specifications.length > 0 && (
            <div className="space-y-8">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                <span className="w-8 h-1 bg-yellow-400 rounded-full"></span>
                {t.specifications}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {product.specifications.map((spec, idx) => (
                  <div key={idx} className="flex flex-col p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 transition-all group">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-blue-600 transition-colors">{spec.label}</span>
                    <span className="font-black text-slate-800 dark:text-white text-lg">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-8">
            {product.comingSoon ? (
              <button 
                onClick={() => handleReserve(product)}
                className="w-full py-8 rounded-[36px] font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
              >
                {t.reserve}
              </button>
            ) : (
              <button 
                disabled={product.stock <= 0}
                onClick={() => addToCart(product)}
                className={`w-full py-8 rounded-[36px] font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${
                  product.stock > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                }`}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {t.addToCart}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
