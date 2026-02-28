
export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export interface Specification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  category: 'pc' | 'laptop' | 'accessories';
  price: number;
  costPrice: number;
  image: string;
  description: string;
  descriptionAr: string;
  stock: number;
  specifications: Specification[];
  comingSoon?: boolean;
}

export interface UserInfo {
  name: string;
  phone: string;
  address: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REFUSED = 'REFUSED',
  RESERVED = 'RESERVED'
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  type: 'order_update' | 'promo' | 'system';
  link?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  userInfo: UserInfo;
  userId?: string;
  status: OrderStatus;
  timestamp: number;
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string;
  paymentMethod: 'instapay' | 'cod' | 'reservation';
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercentage: number;
  active: boolean;
  usageLimit: number;
  usedCount: number;
}

export interface CartItem extends Product {
  quantity: number;
}

// Support System Types
export enum SupportSender {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface SupportSession {
  id: string;
  orderId: string;
  phone: string;
  status: 'OPEN' | 'CLOSED';
  lastMessageTimestamp: number;
  userName?: string;
}

export interface SupportMessage {
  id: string;
  sessionId: string;
  text: string;
  sender: SupportSender;
  timestamp: number;
}

export interface AdminLoginHistory {
  id: string;
  timestamp: number;
  device: string;
  location: string;
  ip?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  timestamp: number;
}

export interface AppState {
  products: Product[];
  orders: Order[];
  promoCodes: PromoCode[];
  currentUser: 'admin' | 'user' | null;
  lang: Language;
  theme: Theme;
}
