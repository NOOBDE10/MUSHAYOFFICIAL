import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection, doc, onSnapshot, setDoc, addDoc, updateDoc,
  deleteDoc, writeBatch, getDoc, runTransaction, query, where,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail,
  reauthenticateWithCredential, EmailAuthProvider, updateEmail, updatePassword,
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { runSeedIfEmpty } from '../lib/seed';
import { getTrackingKey } from '../lib/orderTracking';
import {
  Product, CartItem, Order, OrderStatus, Coupon, StoreSettings,
  UserAccount, AdminCredentials, MonthlyArchive, SecurityLog,
  StoreCategory, ColorOption, NewsletterSubscriber,
} from '../types';
import { INITIAL_SETTINGS, INITIAL_CATEGORIES, INITIAL_COLORS } from '../data/initialData';
import { WHATSAPP_CONTACTS, WhatsAppContact } from '../data/whatsappContacts';

export type AppView =
  | 'home' | 'shop' | 'product-detail' | 'cart' | 'checkout'
  | 'order-confirmation' | 'track-order' | 'wishlist' | 'admin'
  | 'account' | 'about' | 'contact' | 'faq' | 'size-guide';

type AdminTab = 'dashboard' | 'orders' | 'products' | 'categories' | 'customers'
  | 'inventory' | 'analytics' | 'marketing' | 'archives' | 'settings'
  | 'social' | 'contacts';

const DEFAULT_ADMIN_CREDS: AdminCredentials = {
  name: 'Store Owner',
  email: '',
};

interface ShopContextType {
  isLoading: boolean;
  products: Product[];
  orders: Order[];
  myOrders: Order[];
  cart: CartItem[];
  wishlist: string[];
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  settings: StoreSettings;
  monthlyArchives: MonthlyArchive[];
  categories: StoreCategory[];
  addCategory: (category: StoreCategory) => void;
  deleteCategory: (categoryId: string) => void;
  updateCategory: (category: StoreCategory) => void;
  colors: ColorOption[];
  addColor: (color: ColorOption) => { success: boolean; message: string };
  deleteColor: (colorName: string) => { success: boolean; message: string };
  resetColorsToDefault: () => void;
  selectedShopDepartment: 'all' | 'women' | 'men' | 'child';
  setSelectedShopDepartment: (dept: 'all' | 'women' | 'men' | 'child') => void;
  selectedShopCategory: string;
  setSelectedShopCategory: (cat: string) => void;
  subscribers: NewsletterSubscriber[];
  addSubscriber: (email: string) => Promise<{ success: boolean; message: string }>;
  deleteSubscriber: (idOrEmail: string) => void;
  currentUser: UserAccount | null;
  isAdminLoggedIn: boolean;
  adminCredentials: AdminCredentials;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'signup' | 'admin';
  setAuthModalMode: (mode: 'login' | 'signup' | 'admin') => void;
  adminFailedAttempts: number;
  adminLockoutUntil: number | null;
  securityLogs: SecurityLog[];
  adminLogin: (email: string, password: string) => Promise<{
    success: boolean; message: string;
    remainingAttempts?: number; locked?: boolean; remainingSeconds?: number;
    role?: 'admin' | 'customer';
  }>;
  resetAdminLockout: () => void;
  sendAdminPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  clearSecurityLogs: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isWhatsAppModalOpen: boolean;
  setIsWhatsAppModalOpen: (open: boolean) => void;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  lastPlacedOrder: Order | null;
  setLastPlacedOrder: (order: Order | null) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  activeAdminTab: AdminTab;
  setActiveAdminTab: (tab: AdminTab) => void;
  adminSelectedOrderId: string | null;
  setAdminSelectedOrderId: (id: string | null) => void;
  whatsappContacts: WhatsAppContact[];
  updateWhatsAppContacts: (contacts: WhatsAppContact[]) => void;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  freeShippingProgress: number;
  amountUntilFreeShipping: number;
  deliveryDistanceKm: number;
  setDeliveryDistanceKm: (km: number) => void;
  calculateDeliveryFee: (distanceKm: number, subtotalAmount?: number) => number;
  users: UserAccount[];
  deleteCustomer: (emailOrPhone: string) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: 'admin' | 'customer'; message: string }>;
  signup: (userData: { name: string; email: string; password: string; phone: string; city: string; address: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateAdminCredentials: (
    currentPassword: string, newEmail: string, newPassword: string, newName?: string
  ) => Promise<{ success: boolean; message: string }>;
  addToCart: (product: Product, size: string, color: string, quantity: number) => { success: boolean; message: string };
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  placeOrder: (customerInfo: {
    name: string; email: string; phone: string; address: string;
    city: string; area: string; postalCode?: string; notes?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  deleteOrder: (orderId: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateVariantStock: (productId: string, variantKey: string, newStock: number) => void;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (couponId: string) => void;
  archiveCurrentMonth: (monthLabel?: string) => { success: boolean; archive: MonthlyArchive };
  deleteArchive: (archiveId: string) => void;
  restoreArchive: (archiveId: string) => void;
  navigateTo: (view: AppView, productId?: string, department?: 'all' | 'women' | 'men' | 'child', category?: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// localStorage helpers (cart + wishlist + security lockout only)
const ls = {
  get: (key: string) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set: (key: string, val: string) => {
    try { localStorage.setItem(key, val); } catch {}
  },
  del: (key: string) => {
    try { localStorage.removeItem(key); } catch {}
  },
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ─── Loading ───────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);

  // ─── Firestore-synced state ────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>(INITIAL_CATEGORIES);
  const [colors, setColors] = useState<ColorOption[]>(INITIAL_COLORS);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [monthlyArchives, setMonthlyArchives] = useState<MonthlyArchive[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(DEFAULT_ADMIN_CREDS);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>(WHATSAPP_CONTACTS);

  // ─── Auth state ────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // ─── Local-only UI + session state ────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { const s = ls.get('ms_cart'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try { const s = ls.get('ms_wishlist'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [adminFailedAttempts, setAdminFailedAttempts] = useState<number>(() => {
    const s = ls.get('ms_admin_failed_attempts');
    return s ? parseInt(s, 10) : 0;
  });
  const [adminLockoutUntil, setAdminLockoutUntil] = useState<number | null>(() => {
    const s = ls.get('ms_admin_lockout_until');
    if (!s) return null;
    const until = parseInt(s, 10);
    if (Date.now() < until) return until;
    ls.del('ms_admin_lockout_until');
    ls.del('ms_admin_failed_attempts');
    return null;
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');
  const [adminSelectedOrderId, setAdminSelectedOrderId] = useState<string | null>(null);
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(1);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'admin'>('login');
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [selectedShopDepartment, setSelectedShopDepartment] = useState<'all' | 'women' | 'men' | 'child'>('all');
  const [selectedShopCategory, setSelectedShopCategory] = useState<string>('all');

  // ─── localStorage sync for cart + wishlist ─────────────────────────────────
  useEffect(() => { ls.set('ms_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { ls.set('ms_wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { ls.set('ms_admin_failed_attempts', adminFailedAttempts.toString()); }, [adminFailedAttempts]);
  useEffect(() => {
    adminLockoutUntil
      ? ls.set('ms_admin_lockout_until', adminLockoutUntil.toString())
      : ls.del('ms_admin_lockout_until');
  }, [adminLockoutUntil]);

  // ─── Seed + public Firestore listeners (readable by every visitor) ────────
  useEffect(() => {
    runSeedIfEmpty();

    const unsubs = [
      onSnapshot(collection(db, 'products'), snap => {
        setProducts(snap.docs.map(d => ({ ...d.data() } as Product)));
        setIsLoading(false);
      }),
      onSnapshot(collection(db, 'coupons'), snap => {
        setCoupons(snap.docs.map(d => ({ ...d.data() } as Coupon)));
      }),
      onSnapshot(collection(db, 'categories'), snap => {
        setCategories(snap.docs.map(d => ({ ...d.data() } as StoreCategory)));
      }),
      onSnapshot(doc(db, 'settings', 'store'), snap => {
        if (snap.exists()) setSettings(snap.data() as StoreSettings);
      }),
      onSnapshot(doc(db, 'colors', 'palette'), snap => {
        if (snap.exists()) setColors(snap.data().list as ColorOption[]);
      }),
      onSnapshot(doc(db, 'whatsapp_contacts', 'list'), snap => {
        if (snap.exists()) setWhatsappContacts(snap.data().contacts as WhatsAppContact[]);
      }),
    ];

    return () => unsubs.forEach(u => u());
  }, []);

  // ─── Admin-only Firestore listeners (full orders/users/logs/archives) ─────
  useEffect(() => {
    if (!isAdminLoggedIn) {
      setOrders([]);
      setUsers([]);
      setMonthlyArchives([]);
      setSecurityLogs([]);
      return;
    }
    const unsubs = [
      onSnapshot(collection(db, 'orders'), snap => {
        const docs = snap.docs.map(d => ({ ...d.data() } as Order));
        docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(docs);
      }),
      onSnapshot(collection(db, 'users'), snap => {
        setUsers(snap.docs.map(d => ({ ...d.data() } as UserAccount)));
      }),
      onSnapshot(collection(db, 'newsletter_subscribers'), snap => {
        const docs = snap.docs.map(d => ({ ...d.data() } as NewsletterSubscriber));
        docs.sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime());
        setSubscribers(docs);
      }),
      onSnapshot(collection(db, 'monthly_archives'), snap => {
        const docs = snap.docs.map(d => ({ ...d.data() } as MonthlyArchive));
        docs.sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
        setMonthlyArchives(docs);
      }),
      onSnapshot(collection(db, 'security_logs'), snap => {
        const docs = snap.docs.map(d => ({ ...d.data() } as SecurityLog));
        docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setSecurityLogs(docs.slice(0, 50));
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [isAdminLoggedIn]);

  // ─── A logged-in customer's own orders only (scoped query, not the full collection) ─
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer') {
      setMyOrders([]);
      return;
    }
    const q = query(collection(db, 'orders'), where('customerUid', '==', currentUser.id));
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ ...d.data() } as Order));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyOrders(docs);
    });
    return unsub;
  }, [currentUser?.id, currentUser?.role]);

  // ─── Firebase Auth state ───────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setIsAdminLoggedIn(false);
        return;
      }
      // Check if admin
      try {
        const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
        if (adminSnap.exists()) {
          const profile = adminSnap.data() as { name?: string; email?: string };
          setAdminCredentials({ name: profile.name || 'Admin', email: profile.email || firebaseUser.email! });
          setIsAdminLoggedIn(true);
          setCurrentUser({
            id: firebaseUser.uid,
            name: profile.name || 'Admin',
            email: profile.email || firebaseUser.email!,
            phone: '',
            role: 'admin',
            createdAt: '',
          });
          return;
        }
      } catch {}
      // Otherwise treat as customer
      try {
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userSnap.exists()) {
          setCurrentUser(userSnap.data() as UserAccount);
        }
      } catch {}
      setIsAdminLoggedIn(false);
    });
    return unsub;
  }, []);

  // ─── Pricing calculations ──────────────────────────────────────────────────
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeThreshold = settings.freeShippingThreshold ?? 500;
  const freeShippingProgress = Math.min(100, subtotal > 0 ? (subtotal / freeThreshold) * 100 : 0);
  const amountUntilFreeShipping = Math.max(0, freeThreshold - subtotal);

  const calculateDeliveryFee = (_km = 1, subtotalAmount: number = subtotal): number => {
    if (subtotalAmount === 0) return 0;
    if (subtotalAmount >= freeThreshold) return 0;
    return settings.standardDeliveryFee ?? 200;
  };

  const deliveryFee = calculateDeliveryFee(deliveryDistanceKm, subtotal);

  let discountAmount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minOrderAmount) {
    if (appliedCoupon.discountPercent) {
      discountAmount = Math.round((subtotal * appliedCoupon.discountPercent) / 100);
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else if (appliedCoupon.fixedDiscount) {
      discountAmount = appliedCoupon.fixedDiscount;
    }
  }

  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  // ─── Security log helper ───────────────────────────────────────────────────
  const addSecurityLog = (action: SecurityLog['action'], details: string, status: SecurityLog['status']) => {
    const newLog: SecurityLog = {
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.104 (Authenticated Local IP)',
      deviceInfo: typeof navigator !== 'undefined'
        ? `${navigator.platform || 'Device'} • ${navigator.userAgent.slice(0, 32)}...`
        : 'Admin Workstation',
      action, details, status,
    };
    setDoc(doc(collection(db, 'security_logs'), newLog.id), newLog).catch(() => {});
  };

  // ─── Admin Auth ────────────────────────────────────────────────────────────
  const clearSecurityLogs = () => {
    // Delete all security log docs (fetch current and batch delete)
    securityLogs.forEach(log => deleteDoc(doc(db, 'security_logs', log.id)).catch(() => {}));
  };

  const resetAdminLockout = () => {
    setAdminFailedAttempts(0);
    setAdminLockoutUntil(null);
  };

  const sendAdminPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return { success: true, message: 'Password reset email sent. Check your inbox.' };
    } catch {
      return { success: false, message: 'Could not send reset email. Check the address and try again.' };
    }
  };

  // Admin identity now lives in Firebase Auth; a matching admins/{uid} doc
  // marks that account as admin. There is no plaintext password anywhere.
  const adminLogin = async (emailInput: string, passwordInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();
    const now = Date.now();

    if (adminLockoutUntil && now < adminLockoutUntil) {
      const remainingSec = Math.ceil((adminLockoutUntil - now) / 1000);
      return { success: false, locked: true, remainingSeconds: remainingSec, message: `Device locked for ${Math.ceil(remainingSec / 60)} minute(s).` };
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const adminSnap = await getDoc(doc(db, 'admins', credential.user.uid));
      if (!adminSnap.exists()) {
        await signOut(auth);
        throw new Error('not-admin');
      }
      const profile = adminSnap.data() as { name?: string; email?: string };
      setAdminFailedAttempts(0);
      setAdminLockoutUntil(null);
      setAdminCredentials({ name: profile.name || 'Admin', email: profile.email || cleanEmail });
      setIsAdminLoggedIn(true);
      setCurrentUser({
        id: credential.user.uid,
        name: profile.name || 'Admin',
        email: profile.email || cleanEmail,
        phone: '',
        role: 'admin',
        createdAt: '',
      });
      setIsAuthModalOpen(false);
      setCurrentView('admin');
      addSecurityLog('LOGIN_SUCCESS', 'Administrator verified and authenticated.', 'success');
      return { success: true, role: 'admin' as const, locked: false, message: 'Welcome back, Administrator.' };
    } catch {
      const nextAttempts = adminFailedAttempts + 1;
      if (nextAttempts >= 3) {
        const lockUntil = now + 15 * 60 * 1000;
        setAdminFailedAttempts(3);
        setAdminLockoutUntil(lockUntil);
        return { success: false, locked: true, remainingAttempts: 0, remainingSeconds: 900, message: 'CRITICAL: 3 failed attempts. Terminal locked for 15 minutes.' };
      }
      setAdminFailedAttempts(nextAttempts);
      return { success: false, locked: false, remainingAttempts: 3 - nextAttempts, message: `Invalid credentials. ${3 - nextAttempts} attempt(s) remaining.` };
    }
  };

  const updateAdminCredentials = async (
    currentPassword: string, newEmail: string, newPassword: string, newName?: string
  ): Promise<{ success: boolean; message: string }> => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, message: 'You must be signed in as admin to update credentials.' };
    }
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    } catch {
      return { success: false, message: 'Current password is incorrect.' };
    }
    try {
      const cleanEmail = newEmail.trim().toLowerCase();
      if (cleanEmail && cleanEmail !== user.email.toLowerCase()) {
        await updateEmail(user, cleanEmail);
      }
      if (newPassword.trim()) {
        await updatePassword(user, newPassword.trim());
      }
      const profile = { name: newName?.trim() || adminCredentials.name || 'Store Executive', email: cleanEmail || user.email };
      await setDoc(doc(db, 'admins', user.uid), profile, { merge: true });
      setAdminCredentials(profile);
      addSecurityLog('CREDENTIALS_CHANGED', 'Admin credentials updated.', 'success');
      return { success: true, message: 'Admin credentials saved successfully!' };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/requires-recent-login') return { success: false, message: 'Please sign out and sign back in, then try again.' };
      if (code === 'auth/email-already-in-use') return { success: false, message: 'That email is already in use by another account.' };
      if (code === 'auth/weak-password') return { success: false, message: 'Password must be at least 6 characters.' };
      return { success: false, message: 'Failed to update credentials. Please try again.' };
    }
  };

  // ─── Customer Auth (Firebase Auth) ────────────────────────────────────────
  const login = async (emailInput: string, passwordInput: string): Promise<{ success: boolean; role?: 'admin' | 'customer'; message: string }> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const adminSnap = await getDoc(doc(db, 'admins', credential.user.uid));
      if (adminSnap.exists()) {
        const profile = adminSnap.data() as { name?: string; email?: string };
        setAdminCredentials({ name: profile.name || 'Admin', email: profile.email || cleanEmail });
        setIsAdminLoggedIn(true);
        setCurrentUser({
          id: credential.user.uid,
          name: profile.name || 'Admin',
          email: profile.email || cleanEmail,
          phone: '',
          role: 'admin',
          createdAt: '',
        });
        setIsAuthModalOpen(false);
        setCurrentView('admin');
        return { success: true, role: 'admin', message: 'Welcome back, Administrator.' };
      }
      const userSnap = await getDoc(doc(db, 'users', credential.user.uid));
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserAccount;
        setCurrentUser(userData);
        setIsAdminLoggedIn(false);
        setIsAuthModalOpen(false);
        return { success: true, role: 'customer', message: `Welcome back, ${userData.name}.` };
      }
      return { success: true, role: 'customer', message: 'Welcome back!' };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        return { success: false, message: 'Invalid email or password. Please check and try again.' };
      }
      return { success: false, message: 'Sign in failed. Please try again.' };
    }
  };

  const signup = async (userData: { name: string; email: string; password: string; phone: string; city: string; address: string }): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = userData.email.trim().toLowerCase();
    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, userData.password.trim());
      const newUser: UserAccount = {
        id: credential.user.uid,
        name: userData.name.trim(),
        email: cleanEmail,
        phone: userData.phone.trim(),
        city: userData.city,
        address: userData.address.trim(),
        role: 'customer',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', credential.user.uid), newUser);
      setCurrentUser(newUser);
      setIsAdminLoggedIn(false);
      setIsAuthModalOpen(false);
      return { success: true, message: `Account created! Welcome, ${newUser.name}.` };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/email-already-in-use') {
        return { success: false, message: 'An account with this email already exists. Please sign in.' };
      }
      if (code === 'auth/weak-password') {
        return { success: false, message: 'Password must be at least 6 characters.' };
      }
      return { success: false, message: 'Sign up failed. Please try again.' };
    }
  };

  const logout = () => {
    signOut(auth).catch(() => {});
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    if (currentView === 'admin' || currentView === 'account') setCurrentView('home');
  };

  const deleteCustomer = (emailOrPhoneOrId: string) => {
    const target = emailOrPhoneOrId.trim().toLowerCase();
    const toDelete = users.filter(
      u => u.email.toLowerCase() === target || u.phone.trim().toLowerCase() === target || u.id === target
    );
    toDelete.forEach(u => deleteDoc(doc(db, 'users', u.id)).catch(() => {}));
  };

  // ─── Cart ──────────────────────────────────────────────────────────────────
  const addToCart = (product: Product, size: string, color: string, quantity: number): { success: boolean; message: string } => {
    const variantKey = `${size}_${color}`;
    const availableStock = product.variantStock[variantKey] ?? product.stock;
    const existingIndex = cart.findIndex(i => i.productId === product.id && i.size === size && i.color === color);
    const currentQtyInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const requestedTotal = currentQtyInCart + quantity;

    if (availableStock <= 0) return { success: false, message: `Variant (${size} / ${color}) is out of stock.` };
    if (requestedTotal > availableStock) return { success: false, message: `Only ${availableStock} units available. You have ${currentQtyInCart} in bag.` };

    if (existingIndex > -1) {
      setCart(prev => prev.map((item, idx) => idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item));
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${size}-${color.replace(/[^a-zA-Z0-9]/g, '')}`,
        productId: product.id, product, size, color, quantity, price: product.price,
      };
      setCart(prev => [...prev, newItem]);
    }
    setIsCartOpen(true);
    return { success: true, message: `Added ${product.name} (${size}) to your bag.` };
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(itemId); return; }
    setCart(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const maxStock = item.product.variantStock[`${item.size}_${item.color}`] ?? item.product.stock;
      return { ...item, quantity: Math.min(quantity, maxStock) };
    }));
  };

  const removeFromCart = (itemId: string) => setCart(prev => prev.filter(i => i.id !== itemId));
  const clearCart = () => { setCart([]); setAppliedCoupon(null); };

  const toggleWishlist = (productId: string) =>
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
    if (!coupon) return { success: false, message: 'Invalid or inactive coupon code.' };
    if (subtotal < coupon.minOrderAmount) return { success: false, message: `Minimum order PKR ${coupon.minOrderAmount.toLocaleString()} required.` };
    setAppliedCoupon(coupon);
    return { success: true, message: `Coupon ${coupon.code} applied!` };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  // ─── Place Order ───────────────────────────────────────────────────────────
  const placeOrder = (customerInfo: {
    name: string; email: string; phone: string; address: string;
    city: string; area: string; postalCode?: string; notes?: string;
  }): Order => {
    const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderId = `ord-${Date.now()}`;

    const newOrder: Order = {
      id: orderId, orderNumber,
      customerUid: currentUser && currentUser.role === 'customer' ? currentUser.id : null,
      customerName: customerInfo.name, customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone, address: customerInfo.address,
      city: customerInfo.city, area: customerInfo.area,
      postalCode: customerInfo.postalCode || 'N/A', orderNotes: customerInfo.notes || '',
      items: [...cart], subtotal, discount: discountAmount, deliveryFee, total,
      paymentMethod: 'Cash on Delivery', status: 'Pending',
      createdAt: new Date().toISOString(),
      trackingHistory: [{ status: 'Pending', timestamp: new Date().toISOString(), note: 'Order placed via Cash on Delivery.' }],
    };

    // Write order to Firestore
    setDoc(doc(db, 'orders', orderId), newOrder).catch(() => {});

    // Mirror a lookup copy for guest tracking (see lib/orderTracking.ts)
    const trackingKey = getTrackingKey(newOrder.orderNumber, newOrder.customerPhone);
    setDoc(doc(db, 'order_lookup', trackingKey), newOrder).catch(() => {});

    // Deduct stock in Firestore — one transaction per product, reading the
    // live server document at write time so concurrent checkouts can't both
    // deduct from the same stale count (lost-update race).
    const cartSnapshot = [...cart];
    const affectedProductIds = Array.from(new Set(cartSnapshot.map(c => c.productId)));
    affectedProductIds.forEach(productId => {
      const itemsForProduct = cartSnapshot.filter(c => c.productId === productId);
      const ref = doc(db, 'products', productId);
      runTransaction(db, async tx => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as Product;
        const updatedVariantStock = { ...data.variantStock };
        let totalDeduction = 0;
        itemsForProduct.forEach(item => {
          const vKey = `${item.size}_${item.color}`;
          updatedVariantStock[vKey] = Math.max(0, (updatedVariantStock[vKey] ?? 0) - item.quantity);
          totalDeduction += item.quantity;
        });
        tx.update(ref, {
          variantStock: updatedVariantStock,
          stock: Math.max(0, data.stock - totalDeduction),
        });
      }).catch(() => {});
    });

    setLastPlacedOrder(newOrder);
    clearCart();
    setCurrentView('order-confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return newOrder;
  };

  // ─── Order Management ──────────────────────────────────────────────────────
  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const defaultNotes: Record<OrderStatus, string> = {
      Pending: 'Order awaiting confirmation.', Confirmed: 'Order confirmed.',
      Processing: 'Garment undergoing quality inspection.', Packed: 'Sealed in luxury packaging.',
      Shipped: 'Handed to courier dispatch.', 'Out for Delivery': 'Courier en route.',
      Delivered: 'Delivered. Cash collected.', Cancelled: 'Order cancelled.',
    };
    const newEntry = { status, timestamp: new Date().toISOString(), note: note || defaultNotes[status] };
    const updated = { ...order, status, trackingHistory: [...order.trackingHistory, newEntry] };
    updateDoc(doc(db, 'orders', orderId), { status, trackingHistory: updated.trackingHistory }).catch(() => {});

    const trackingKey = getTrackingKey(order.orderNumber, order.customerPhone);
    updateDoc(doc(db, 'order_lookup', trackingKey), { status, trackingHistory: updated.trackingHistory }).catch(() => {});
  };

  const deleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    deleteDoc(doc(db, 'orders', orderId)).catch(() => {});
    if (order) {
      const trackingKey = getTrackingKey(order.orderNumber, order.customerPhone);
      deleteDoc(doc(db, 'order_lookup', trackingKey)).catch(() => {});
    }
  };

  // ─── Product CRUD ──────────────────────────────────────────────────────────
  const addProduct = (product: Product) => {
    setDoc(doc(db, 'products', product.id), product).catch(() => {});
  };

  const updateProduct = (product: Product) => {
    setDoc(doc(db, 'products', product.id), product).catch(() => {});
  };

  const deleteProduct = (productId: string) => {
    deleteDoc(doc(db, 'products', productId)).catch(() => {});
  };

  const updateVariantStock = (productId: string, variantKey: string, newStock: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const updatedVariants = { ...product.variantStock, [variantKey]: Math.max(0, newStock) };
    const sumStock = Object.values(updatedVariants).reduce((a, b) => a + b, 0);
    updateDoc(doc(db, 'products', productId), {
      variantStock: updatedVariants,
      stock: sumStock > 0 ? sumStock : Math.max(0, newStock),
    }).catch(() => {});
  };

  // ─── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    const merged = { ...settings, ...newSettings };
    setDoc(doc(db, 'settings', 'store'), merged).catch(() => {});
  };

  // ─── Coupons ───────────────────────────────────────────────────────────────
  const addCoupon = (coupon: Coupon) => {
    setDoc(doc(db, 'coupons', coupon.id), coupon).catch(() => {});
  };

  const deleteCoupon = (couponId: string) => {
    deleteDoc(doc(db, 'coupons', couponId)).catch(() => {});
  };

  // ─── Categories ────────────────────────────────────────────────────────────
  const addCategory = (category: StoreCategory) => {
    setDoc(doc(db, 'categories', category.id), category).catch(() => {});
  };

  const deleteCategory = (categoryId: string) => {
    deleteDoc(doc(db, 'categories', categoryId)).catch(() => {});
  };

  const updateCategory = (category: StoreCategory) => {
    setDoc(doc(db, 'categories', category.id), category).catch(() => {});
  };

  // ─── Colors ────────────────────────────────────────────────────────────────
  const addColor = (newColor: ColorOption): { success: boolean; message: string } => {
    const trimmedName = newColor.name.trim();
    if (!trimmedName) return { success: false, message: 'Please enter a color name.' };
    if (colors.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, message: `Color "${trimmedName}" already exists.` };
    }
    const updated = [...colors, { name: trimmedName, hex: newColor.hex.trim() || '#111111' }];
    setDoc(doc(db, 'colors', 'palette'), { list: updated }).catch(() => {});
    return { success: true, message: `Color "${trimmedName}" added.` };
  };

  const deleteColor = (colorName: string): { success: boolean; message: string } => {
    const updated = colors.filter(c => c.name.toLowerCase() !== colorName.trim().toLowerCase());
    setDoc(doc(db, 'colors', 'palette'), { list: updated }).catch(() => {});
    return { success: true, message: 'Color removed.' };
  };

  const resetColorsToDefault = () => {
    setDoc(doc(db, 'colors', 'palette'), { list: INITIAL_COLORS }).catch(() => {});
  };

  // ─── Newsletter ────────────────────────────────────────────────────────────
  const addSubscriber = async (email: string): Promise<{ success: boolean; message: string }> => {
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) return { success: false, message: 'Please provide a valid email address.' };
    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: trimmed,
      subscribedAt: new Date().toISOString(),
      source: 'Storefront Footer',
    };
    await addDoc(collection(db, 'newsletter_subscribers'), newSub);
    return { success: true, message: 'Welcome to MUSHAY Atelier. Your email has been privileged for seasonal lookbooks.' };
  };

  const deleteSubscriber = (idOrEmail: string) => {
    const target = idOrEmail.trim().toLowerCase();
    const toDelete = subscribers.filter(s => s.id === target || s.email.toLowerCase() === target);
    toDelete.forEach(s => {
      // Need to find the Firestore document ID - use query or store it
      // For now delete by scanning the collection
      deleteDoc(doc(db, 'newsletter_subscribers', s.id)).catch(() => {});
    });
  };

  // ─── WhatsApp Contacts ─────────────────────────────────────────────────────
  const updateWhatsAppContacts = (contacts: WhatsAppContact[]) => {
    setDoc(doc(db, 'whatsapp_contacts', 'list'), { contacts }).catch(() => {});
  };

  // ─── Monthly Archives ──────────────────────────────────────────────────────
  const archiveCurrentMonth = (monthLabel?: string) => {
    const now = new Date();
    const label = monthLabel || now.toLocaleString('default', { month: 'long', year: 'numeric' });
    const newArchive: MonthlyArchive = {
      id: `arch-${Date.now()}`, monthName: label, year: now.getFullYear(),
      archivedAt: now.toISOString(),
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
      totalOrders: orders.length,
      deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'Cancelled').length,
      orders: [...orders],
    };
    setDoc(doc(db, 'monthly_archives', newArchive.id), newArchive).catch(() => {});
    // Clear active orders (and their tracking lookup mirrors)
    const batch = writeBatch(db);
    orders.forEach(o => {
      batch.delete(doc(db, 'orders', o.id));
      batch.delete(doc(db, 'order_lookup', getTrackingKey(o.orderNumber, o.customerPhone)));
    });
    batch.commit().catch(() => {});
    return { success: true, archive: newArchive };
  };

  const deleteArchive = (archiveId: string) => deleteDoc(doc(db, 'monthly_archives', archiveId)).catch(() => {});

  const restoreArchive = (archiveId: string) => {
    const found = monthlyArchives.find(a => a.id === archiveId);
    if (!found || found.orders.length === 0) return;
    const existingIds = new Set(orders.map(o => o.id));
    const batch = writeBatch(db);
    found.orders.filter(o => !existingIds.has(o.id)).forEach(o => batch.set(doc(db, 'orders', o.id), o));
    batch.commit().catch(() => {});
  };

  // ─── Navigation ────────────────────────────────────────────────────────────
  const navigateTo = (view: AppView, productId?: string, department?: 'all' | 'women' | 'men' | 'child', category?: string) => {
    if (department) setSelectedShopDepartment(department);
    if (category) setSelectedShopCategory(category);
    if (productId) setSelectedProductId(productId);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ShopContext.Provider value={{
      isLoading, products, orders, cart, wishlist, coupons, appliedCoupon, settings,
      monthlyArchives, categories, addCategory, deleteCategory, updateCategory,
      colors, addColor, deleteColor, resetColorsToDefault,
      selectedShopDepartment, setSelectedShopDepartment, selectedShopCategory, setSelectedShopCategory,
      subscribers, addSubscriber, deleteSubscriber,
      currentUser, isAdminLoggedIn, adminCredentials,
      isAuthModalOpen, setIsAuthModalOpen, authModalMode, setAuthModalMode,
      adminFailedAttempts, adminLockoutUntil, securityLogs,
      adminLogin, resetAdminLockout, sendAdminPasswordReset, clearSecurityLogs,
      isCartOpen, setIsCartOpen, isWhatsAppModalOpen, setIsWhatsAppModalOpen,
      currentView, setCurrentView, selectedProductId, setSelectedProductId,
      lastPlacedOrder, setLastPlacedOrder, quickViewProduct, setQuickViewProduct,
      activeAdminTab, setActiveAdminTab, adminSelectedOrderId, setAdminSelectedOrderId,
      whatsappContacts, updateWhatsAppContacts,
      subtotal, deliveryFee, discountAmount, total,
      freeShippingProgress, amountUntilFreeShipping, deliveryDistanceKm, setDeliveryDistanceKm,
      calculateDeliveryFee, users, deleteCustomer, login, signup, logout, updateAdminCredentials,
      myOrders,
      addToCart, updateCartItemQuantity, removeFromCart, clearCart,
      toggleWishlist, isInWishlist, applyCoupon, removeCoupon, placeOrder,
      updateOrderStatus, deleteOrder, addProduct, updateProduct, deleteProduct, updateVariantStock,
      updateSettings, addCoupon, deleteCoupon,
      archiveCurrentMonth, deleteArchive, restoreArchive, navigateTo,
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};
