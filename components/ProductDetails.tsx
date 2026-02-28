
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, Language, Order, UserProfile, OrderStatus, Review } from '../types';
import { dbAddReview, subscribeToProductReviews } from '../services/db';

interface ProductDetailsProps {
  products: Product[];
  addToCart: (p: Product) => void;
  handleReserve: (p: Product) => void;
  lang: Language;
  t: any;
  currentUser: UserProfile | null;
  orders: Order[];
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ products, addToCart, handleReserve, lang, t, currentUser, orders }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const unsub = subscribeToProductReviews(id, setReviews);
      return () => unsub && unsub();
    }
  }, [id]);

  const hasPurchased = useMemo(() => {
    if (!currentUser || !id) return false;
    return orders.some(o => 
      o.userId === currentUser.uid && 
      o.status === OrderStatus.ACCEPTED && 
      o.items.some(i => i.productId === id)
    );
  }, [currentUser, orders, id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !id || !newReview.trim()) return;
    
    setIsSubmitting(true);
    try {
      await dbAddReview({
        productId: id,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        rating,
        comment: newReview.trim(),
        timestamp: Date.now()
      });
      setNewReview('');
      setRating(5);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(lang === 'en' ? 'Failed to submit review' : 'فشل إرسال التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black">{lang === 'en' ? 'Product Not Found' : 'المنتج غير موجود'}</h2>
        <Link to="/" className="text-blue-600 mt-4 block font-bold hover:underline">{t.back}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn px-4 pb-20">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-black uppercase text-xs tracking-widest"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        {t.back}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20">
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
            
            {/* Rating Summary */}
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-5 h-5 ${star <= Number(averageRating) ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {averageRating} ({reviews.length} {lang === 'en' ? 'reviews' : 'تقييم'})
              </span>
            </div>

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

      {/* Reviews Section */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-16">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-10 tracking-tight">
          {lang === 'en' ? 'Customer Reviews' : 'تقييمات العملاء'}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Review Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 sticky top-8">
              <h3 className="text-xl font-black mb-6">{lang === 'en' ? 'Write a Review' : 'أكتب تقييم'}</h3>
              
              {!currentUser ? (
                <div className="text-center p-6 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-4">
                    {lang === 'en' ? 'Please login to leave a review.' : 'يرجى تسجيل الدخول لكتابة تقييم.'}
                  </p>
                </div>
              ) : !hasPurchased ? (
                <div className="text-center p-6 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400 font-bold">
                    {lang === 'en' ? 'You can only review products you have purchased.' : 'يمكنك تقييم المنتجات التي قمت بشرائها فقط.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                      {lang === 'en' ? 'Rating' : 'التقييم'}
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            rating >= star 
                              ? 'bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/30 scale-110' 
                              : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                      {lang === 'en' ? 'Your Review' : 'رأيك'}
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 font-bold outline-none focus:border-blue-500 transition-all resize-none"
                      placeholder={lang === 'en' ? 'Tell us what you think...' : 'أخبرنا برأيك...'}
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (lang === 'en' ? 'Submitting...' : 'جاري الإرسال...') : (lang === 'en' ? 'Submit Review' : 'إرسال التقييم')}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-slate-200 dark:border-slate-800 border-dashed">
                <p className="text-slate-400 font-bold text-lg">
                  {lang === 'en' ? 'No reviews yet. Be the first to review!' : 'لا توجد تقييمات بعد. كن أول من يقيم!'}
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg uppercase">
                        {review.userName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white">{review.userName}</h4>
                        <span className="text-xs text-slate-400 font-bold">
                          {new Date(review.timestamp).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 px-3 py-1 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700 opacity-30'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {review.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
