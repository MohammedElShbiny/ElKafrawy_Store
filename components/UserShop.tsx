
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product, Language } from '../types';

interface UserShopProps {
  products: Product[];
  addToCart: (p: Product) => void;
  handleReserve: (p: Product) => void;
  lang: Language;
  t: any;
}

// Internal component for handling lazy loaded images with placeholders
const ProductImage: React.FC<{ src: string; alt: string; stock: number }> = ({ src, alt, stock }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-800">
      {/* Shimmering Skeleton Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
      )}
      <img 
        src={src} 
        alt={alt} 
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-700 
          ${isLoaded ? 'opacity-100' : 'opacity-0'} 
          ${stock <= 0 ? 'grayscale opacity-60' : ''}`}
      />
    </div>
  );
};

export const UserShop: React.FC<UserShopProps> = ({ products, addToCart, handleReserve, lang, t }) => {
  const [filter, setFilter] = useState<'all' | 'pc' | 'laptop' | 'accessories'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category Filter
      const matchesCategory = filter === 'all' || p.category === filter;
      if (!matchesCategory) return false;

      // In Stock Filter
      if (onlyInStock && p.stock <= 0) return false;

      // Price Filter
      if (minPrice !== '' && p.price < minPrice) return false;
      if (maxPrice !== '' && p.price > maxPrice) return false;

      // Search Term Filter (Name, Description, Specs)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(searchLower) || p.nameAr.includes(searchTerm);
        const descMatch = p.description.toLowerCase().includes(searchLower) || p.descriptionAr.includes(searchTerm);
        const specsMatch = p.specifications?.some(s => 
          s.label.toLowerCase().includes(searchLower) || 
          s.value.toLowerCase().includes(searchLower)
        );
        
        if (!(nameMatch || descMatch || specsMatch)) return false;
      }

      return true;
    });
  }, [products, filter, searchTerm, minPrice, maxPrice, onlyInStock]);

  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setOnlyInStock(false);
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
          {lang === 'en' ? 'Elkafrawy' : 'المتجر'} <span className="text-blue-600">Hardware</span> <span className="text-yellow-500">Shop</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto text-xl font-medium leading-relaxed">
          {lang === 'en' 
            ? 'Premium computers and accessories from Elkafrawy. High performance guaranteed for gamers and professionals.' 
            : 'أجهزة كمبيوتر وملحقات ممتازة من الكفراوي. أداء عالي مضمون للجيمرز والمحترفين.'}
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Main Control Bar */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder={lang === 'en' ? 'Search by name or specs (RTX, i9, 32GB)...' : 'ابحث بالاسم أو المواصفات (RTX, i9, 32GB)...'}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[28px] py-6 pl-16 pr-8 text-lg font-bold shadow-xl shadow-slate-200/50 dark:shadow-none focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-10 py-6 rounded-[28px] font-black transition-all flex items-center justify-center gap-3 border-2 shadow-xl ${
              showFilters || minPrice || maxPrice || onlyInStock
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/30'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            {lang === 'en' ? 'Filters' : 'تصفية'}
            {(minPrice || maxPrice || onlyInStock) && <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>}
          </button>
        </div>

        {/* Collapsible Filters Menu */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl animate-slideDown grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Price Range */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">
                {lang === 'en' ? 'Price Range' : 'نطاق السعر'}
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  placeholder={lang === 'en' ? 'Min' : 'أقل'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold outline-none focus:border-blue-500"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span className="text-slate-300 font-black">—</span>
                <input 
                  type="number" 
                  placeholder={lang === 'en' ? 'Max' : 'أكثر'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold outline-none focus:border-blue-500"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] block">
                {lang === 'en' ? 'Availability' : 'التوفر'}
              </label>
              <button 
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`w-full p-4 rounded-2xl font-black transition-all flex items-center justify-between border-2 ${
                  onlyInStock 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{lang === 'en' ? 'Show In Stock Only' : 'عرض المتاح فقط'}</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${onlyInStock ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                  {onlyInStock && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </div>
              </button>
            </div>

            {/* Clear Button */}
            <div className="flex items-end">
              <button 
                onClick={clearFilters}
                className="w-full p-4 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 dark:border-red-900/20"
              >
                {lang === 'en' ? 'Reset All Filters' : 'إعادة ضبط التصفية'}
              </button>
            </div>
          </div>
        )}

        {/* Categories Bar */}
        <div className="flex flex-wrap justify-center gap-3">
          {(['all', 'pc', 'laptop', 'accessories'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-8 py-4 rounded-[22px] font-black transition-all shadow-sm border-2 text-sm uppercase tracking-widest ${
                filter === cat 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-blue-300'
              }`}
            >
              {t[cat === 'all' ? 'all' : cat === 'pc' ? 'pcs' : cat === 'laptop' ? 'laptops' : 'accessories']}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-32 space-y-8 animate-pulse">
           <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto">
             <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
           </div>
           <div className="space-y-2">
             <p className="text-3xl font-black text-slate-400 uppercase tracking-tighter">
               {lang === 'en' ? 'No Hardware Found' : 'لم يتم العثور على أجهزة'}
             </p>
             <p className="text-slate-400/60 font-medium">
               {lang === 'en' ? 'Try adjusting your filters or search terms.' : 'حاول تعديل خيارات التصفية أو كلمات البحث.'}
             </p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group bg-white dark:bg-slate-900 rounded-[40px] shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
              <Link to={`/product/${product.id}`} className="relative h-64 overflow-hidden block">
                <ProductImage 
                  src={product.image} 
                  alt={product.name} 
                  stock={product.stock}
                />
                <div className="absolute top-5 left-5">
                  <div className="px-4 py-2 bg-white/95 dark:bg-black/70 backdrop-blur-md text-blue-600 dark:text-blue-400 text-[10px] rounded-full uppercase font-black tracking-widest shadow-sm border border-slate-200 dark:border-slate-800">
                    {t[product.category === 'pc' ? 'pcs' : product.category === 'laptop' ? 'laptops' : 'accessories']}
                  </div>
                </div>
                {product.stock <= 0 && !product.comingSoon && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <span className="bg-red-500 text-white px-6 py-2 rounded-2xl font-black uppercase text-sm shadow-2xl">
                      {t.outOfStock}
                    </span>
                  </div>
                )}
                {product.comingSoon && (
                  <div className="absolute inset-0 flex items-center justify-center bg-yellow-400/20 backdrop-blur-[1px]">
                    <span className="bg-yellow-400 text-slate-900 px-6 py-2 rounded-2xl font-black uppercase text-sm shadow-2xl ring-4 ring-white dark:ring-slate-900">
                      {lang === 'en' ? 'Coming Soon' : 'قريباً'}
                    </span>
                  </div>
                )}
              </Link>
              <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mb-3 group-hover:text-blue-600 transition-colors">
                    {lang === 'en' ? product.name : product.nameAr}
                  </h3>
                  
                  {/* Quick Specs Highlight (if searching) */}
                  <div className="flex flex-wrap gap-2 mb-4 h-12 overflow-hidden">
                    {product.specifications?.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-[9px] bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-lg font-black uppercase tracking-tighter border border-slate-100 dark:border-slate-800">
                        {s.value}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 w-fit px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/50">
                    <div className={`w-2 h-2 rounded-full ${product.comingSoon ? 'bg-blue-400 animate-pulse' : product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${product.comingSoon ? 'text-blue-500' : product.stock <= 10 && product.stock > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {product.comingSoon ? (lang === 'en' ? 'Coming Soon' : 'قريباً') : product.stock > 0 ? `${product.stock} ${t.stock}` : t.outOfStock}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60">{t.price}</p>
                    <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                      {product.comingSoon ? (lang === 'en' ? 'Coming Soon' : 'قريباً') : `${product.price} EGP`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {product.comingSoon ? (
                      <button 
                        onClick={() => handleReserve(product)}
                        className="p-4 rounded-2xl transition-all shadow-xl active:scale-90 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 font-black uppercase tracking-widest text-xs px-6"
                        title={t.reserve}
                      >
                        {t.reserve}
                      </button>
                    ) : (
                      <button 
                        disabled={product.stock <= 0}
                        onClick={() => addToCart(product)}
                        className={`p-4 rounded-2xl transition-all shadow-xl active:scale-90 ${
                          product.stock > 0
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                        }`}
                        title={t.addToCart}
                      >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
