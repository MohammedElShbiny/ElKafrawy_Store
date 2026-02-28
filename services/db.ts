
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, 
  addDoc, doc, updateDoc, deleteDoc, 
  setDoc, query, orderBy, where, Timestamp 
} from 'firebase/firestore';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, 
  signOut, signInWithEmailAndPassword 
} from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig, isFirebaseConfigured } from '../firebaseConfig';
import { Product, Order, PromoCode, OrderStatus, SupportSession, SupportMessage, AdminLoginHistory, UserProfile, Notification, Review } from '../types';
import { INITIAL_PRODUCTS, INITIAL_PROMOS } from '../constants';

// ... existing code ...

export const dbAddReview = async (review: Omit<Review, 'id'>) => {
  if (db) {
    try {
      await addDoc(collection(db, 'reviews'), review);
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const subscribeToProductReviews = (productId: string, callback: (data: Review[]) => void) => {
  if (db) {
    const q = query(
      collection(db, 'reviews'), 
      where('productId', '==', productId), 
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Review)));
    }, (error) => handleDbError(error, () => {}));
  } else {
    callback([]);
  }
};

export const signInWithGoogle = async (): Promise<UserProfile | null> => {
  if (auth) {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
    } catch (error) {
      console.error("Google Sign In Error:", error);
      throw error;
    }
  }
  return null;
};

export const signOutUser = async () => {
  if (auth) {
    await signOut(auth);
  }
};

export const dbAddNotification = async (notification: Omit<Notification, 'id'>) => {
  if (db) {
    try {
      await addDoc(collection(db, 'notifications'), notification);
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const subscribeToNotifications = (userId: string, callback: (data: Notification[]) => void) => {
  if (db && userId) {
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Notification)));
    }, (error) => handleDbError(error, () => {}));
  } else {
    callback([]);
  }
};

export const markNotificationRead = async (id: string) => {
  if (db) {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch(e) { handleDbError(e, () => {}); }
  }
};

// Initialize Firebase only if configured
export let db: any = null;
export let auth: any = null;
export let analytics: any = null;

// Error Broadcasting for UI
let globalErrorCallback: (msg: string) => void = () => {};
export const setGlobalErrorCallback = (cb: (msg: string) => void) => { globalErrorCallback = cb; };

const initFirebase = async () => {
  if (isFirebaseConfigured() && !db) {
    try {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      analytics = getAnalytics(app);
      // Removed automatic anonymous sign-in to prevent overwriting existing sessions
      // await authModule.signInAnonymously(auth);
      console.log("Firebase initialized for:", firebaseConfig.projectId);
    } catch (error) {
      console.warn("Firebase Auth Warning:", error);
    }
  }
};

initFirebase();

const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

const handleDbError = (error: any, fallback: () => void) => {
  if (error && error.code === 'permission-denied') {
    globalErrorCallback("Database Access Denied: Please check Firestore Rules.");
  } else if (error && error.message && error.message.includes('requires an index')) {
    const indexUrl = error.message.split('here: ')[1] || 'Firebase Console';
    globalErrorCallback(`Firestore Error: Missing index for support chat. Please create it in the Firebase Console: ${indexUrl}`);
    console.error("Missing Firestore Index. Create it here:", indexUrl);
  } else {
    console.error("Firestore Error:", error);
  }
  fallback();
};

export const subscribeToProducts = (callback: (data: Product[]) => void) => {
  if (db) {
    const q = query(collection(db, 'products'));
    return onSnapshot(q, (snapshot) => {
      // Automatic seeding removed to prevent products from reappearing
      callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product)));
    }, (error) => handleDbError(error, () => callback(getLocal('products'))));
  } else {
    const saved = getLocal('products');
    if (saved.length === 0) {
      setLocal('products', INITIAL_PRODUCTS);
      callback(INITIAL_PRODUCTS);
    } else {
      callback(saved);
    }
    const interval = setInterval(() => callback(getLocal('products')), 2000);
    return () => clearInterval(interval);
  }
};

export const dbClearAllOrders = async () => {
  if (db) {
    try {
      const q = query(collection(db, 'orders'));
      const snapshot = await import('firebase/firestore').then(mod => mod.getDocs(q));
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const subscribeToOrders = (isAdmin: boolean, userId: string | null, callback: (data: Order[]) => void) => {
  if (db) {
    let q;
    if (isAdmin) {
      q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    } else if (userId) {
      q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
    } else {
      // Guest user - avoid DB query to prevent permission denied
      callback(getLocal('orders'));
      return () => {};
    }

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Order)));
    }, (error) => handleDbError(error, () => callback(getLocal('orders'))));
  } else {
    callback(getLocal('orders'));
    const interval = setInterval(() => callback(getLocal('orders')), 2000);
    return () => clearInterval(interval);
  }
};

export const subscribeToPromos = (callback: (data: PromoCode[]) => void) => {
  if (db) {
    const q = query(collection(db, 'promos'));
    return onSnapshot(q, (snapshot) => {
       if (snapshot.empty) {
        INITIAL_PROMOS.forEach(p => setDoc(doc(db, 'promos', p.id), p).catch(() => {}));
      } else {
        callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PromoCode)));
      }
    }, (error) => handleDbError(error, () => callback(getLocal('promoCodes'))));
  } else {
    const saved = getLocal('promoCodes');
    if (saved.length === 0) {
      setLocal('promoCodes', INITIAL_PROMOS);
      callback(INITIAL_PROMOS);
    } else {
      callback(saved);
    }
    const interval = setInterval(() => callback(getLocal('promoCodes')), 2000);
    return () => clearInterval(interval);
  }
};

// --- Support System Methods ---

export const subscribeToSupportSessions = (callback: (data: SupportSession[]) => void) => {
  if (db) {
    const q = query(collection(db, 'support_sessions'), orderBy('lastMessageTimestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as SupportSession)));
    }, (error) => handleDbError(error, () => {}));
  }
};

export const subscribeToSupportMessages = (sessionId: string, callback: (data: SupportMessage[]) => void) => {
  if (db) {
    const q = query(
      collection(db, 'support_messages'), 
      where('sessionId', '==', sessionId), 
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as SupportMessage)));
    }, (error) => handleDbError(error, () => {}));
  }
};

export const dbAddSupportSession = async (session: Omit<SupportSession, 'id'>) => {
  if (db) {
    const docRef = await addDoc(collection(db, 'support_sessions'), session);
    return docRef.id;
  }
  return 'local-session';
};

export const dbAddSupportMessage = async (message: Omit<SupportMessage, 'id'>) => {
  if (db) {
    await addDoc(collection(db, 'support_messages'), message);
    await updateDoc(doc(db, 'support_sessions', message.sessionId), {
      lastMessageTimestamp: message.timestamp
    });
  }
};

export const dbCloseSupportSession = async (id: string) => {
  if (db) {
    await updateDoc(doc(db, 'support_sessions', id), { status: 'CLOSED' });
  }
};

// --- Other Data Service Methods ---

export const dbAddProduct = async (product: Product) => {
  if (db) {
    try {
      await setDoc(doc(db, 'products', product.id), { ...product, specifications: product.specifications || [] });
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const dbDeleteProduct = async (id: string) => {
  if (db) {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const dbUpdateProductStock = async (id: string, newStock: number) => {
  if (db) {
    try {
      await updateDoc(doc(db, 'products', id), { stock: newStock });
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const dbAddOrder = async (order: Order) => {
  if (db) {
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const dbUpdateOrderStatus = async (id: string, status: OrderStatus) => {
  if (db) {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const dbAddPromo = async (promo: PromoCode) => {
  if (db) {
    try {
      await setDoc(doc(db, 'promos', promo.id), promo);
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const dbUpdatePromo = async (promo: PromoCode) => {
  if (db) {
    try {
      await setDoc(doc(db, 'promos', promo.id), promo);
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const dbDeletePromo = async (id: string) => {
  if (db) {
    try {
      await deleteDoc(doc(db, 'promos', id));
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const subscribeToLoginHistory = (isAdmin: boolean, callback: (data: AdminLoginHistory[]) => void) => {
  if (db && isAdmin) {
    const q = query(collection(db, 'admin_login_history'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as AdminLoginHistory)));
    }, (error) => handleDbError(error, () => {}));
  } else {
    callback([]);
    return () => {};
  }
};

export const dbAddLoginHistory = async (history: Omit<AdminLoginHistory, 'id'>) => {
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'admin_login_history'), history);
      return docRef.id;
    } catch(e) { handleDbError(e, () => {}); }
  }
  return null;
};

export const dbDeleteLoginHistory = async (id: string) => {
  if (db) {
    try {
      await deleteDoc(doc(db, 'admin_login_history', id));
    } catch(e) { handleDbError(e, () => {}); }
  }
};

export const dbLoginAdmin = async (email: string, password: string) => {
  if (auth) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }
  // Fallback for local development/no firebase
  if (email === 'admin@elkafrawy' && password === 'elkafrawy_admin') {
    return { uid: 'local-admin', email };
  }
  throw new Error("Auth not initialized");
};

export const dbLogout = async () => {
  if (auth) {
    await signOut(auth);
  }
};

export const subscribeToSessionStatus = (id: string, callback: (exists: boolean) => void) => {
  if (db && id) {
    return onSnapshot(doc(db, 'admin_login_history', id), (snapshot) => {
      callback(snapshot.exists());
    }, (error) => handleDbError(error, () => {}));
  }
};
