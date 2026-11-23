import { doc, getDoc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { INITIAL_SETTINGS, INITIAL_COUPONS, INITIAL_CATEGORIES, INITIAL_COLORS } from '../data/initialData';
import { WHATSAPP_CONTACTS } from '../data/whatsappContacts';
import type { Product } from '../types';

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-seed-women-001',
    name: 'AURORA SILK BLOUSE',
    slug: 'aurora-silk-blouse',
    description: 'Cut from 100% pure Mulberry silk, the Aurora Blouse features tailored French cuffs, subtle champagne gold buttons, and a fluid drape that moves effortlessly from boardroom to evening affairs.',
    shortDescription: 'Pure mulberry silk with subtle champagne gold hardware.',
    price: 18500,
    originalPrice: 22000,
    discountPercent: 16,
    category: 'Women',
    subcategory: "Tops & Shirts",
    gender: 'women',
    images: ['/src/assets/images/fashion_gold_blazer_1790533633560.jpg'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Black | Gold Accent', hex: '#111111' }],
    variantStock: {
      'XS_Black | Gold Accent': 4,
      'S_Black | Gold Accent': 8,
      'M_Black | Gold Accent': 12,
      'L_Black | Gold Accent': 6,
      'XL_Black | Gold Accent': 3,
    },
    stock: 33,
    sku: 'MS-W-001',
    rating: 4.9,
    reviewCount: 42,
    isBestSeller: true,
    isFeatured: true,
    material: '100% Mulberry Silk',
    fabric: '22 Momme Silk Charmeuse',
    fit: 'Tailored Relaxed Fit',
    careInstructions: ['Dry clean only', 'Cool iron with pressing cloth'],
    tags: ['Silk', 'Luxury', 'Workwear', 'Evening'],
    createdAt: new Date().toISOString(),
    isNew: false,
    isSale: false,
  },
  {
    id: 'prod-seed-men-001',
    name: 'REGAL SILK BLEND KURTA',
    slug: 'regal-silk-blend-kurta',
    description: 'An elevated eastern essential. Silk-cotton blend kurta with gold button placket and discrete tonal thread stitching on the collar and cuffs.',
    shortDescription: 'Silk-cotton kurta with hand-detailed gold accent placket.',
    price: 11500,
    originalPrice: 14000,
    discountPercent: 17,
    category: 'Men',
    subcategory: 'Eastern & Traditional',
    gender: 'men',
    images: ['/src/assets/images/fashion_mens_gold_tuxedo_1790533657236.jpg'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Black | Gold Accent', hex: '#0c0c0c' },
      { name: 'Charcoal', hex: '#222222' },
    ],
    variantStock: {
      'S_Black | Gold Accent': 7,
      'M_Black | Gold Accent': 14,
      'L_Black | Gold Accent': 12,
      'XL_Black | Gold Accent': 6,
      'XXL_Black | Gold Accent': 3,
      'S_Charcoal': 4,
      'M_Charcoal': 8,
      'L_Charcoal': 6,
      'XL_Charcoal': 3,
      'XXL_Charcoal': 1,
    },
    stock: 64,
    sku: 'MS-M-001',
    rating: 4.8,
    reviewCount: 52,
    isBestSeller: true,
    isFeatured: false,
    material: '60% Silk, 40% Long-Staple Cotton',
    fabric: 'Breathable Lightweight Jacquard',
    fit: 'Traditional Straight Fit',
    careInstructions: ['Hand wash cold', 'Iron on medium heat'],
    tags: ['Kurta', 'Eastern', 'Festive', 'Jumma'],
    createdAt: new Date().toISOString(),
    isNew: true,
    isSale: false,
  },
  {
    id: 'prod-seed-child-001',
    name: 'FESTIVE GOLD EMBROIDERED KURTA SET',
    slug: 'festive-gold-embroidered-kurta-set',
    description: 'Specially crafted for the little ones, this festive 2-piece kurta set features delicate gold threadwork on the neckline and cuffs with a matching elasticated trouser.',
    shortDescription: 'Children\'s festive 2-piece kurta set with gold threadwork.',
    price: 6500,
    originalPrice: 8000,
    discountPercent: 18,
    category: 'Children',
    subcategory: 'Festive Sets',
    gender: 'child',
    images: ['/src/assets/images/fashion_child_kurta_1790535245268.jpg'],
    sizes: ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y'],
    colors: [{ name: 'Black | Gold Accent', hex: '#111111' }],
    variantStock: {
      '2Y_Black | Gold Accent': 5,
      '4Y_Black | Gold Accent': 8,
      '6Y_Black | Gold Accent': 10,
      '8Y_Black | Gold Accent': 8,
      '10Y_Black | Gold Accent': 6,
      '12Y_Black | Gold Accent': 4,
    },
    stock: 41,
    sku: 'MS-C-001',
    rating: 4.9,
    reviewCount: 28,
    isBestSeller: false,
    isFeatured: true,
    material: 'Cotton-Silk Blend',
    fabric: 'Soft Festive Lawn',
    fit: 'Relaxed Festive Cut',
    careInstructions: ['Machine wash gentle', 'Iron on low heat'],
    tags: ['Children', 'Festive', 'Eid', 'Kurta'],
    createdAt: new Date().toISOString(),
    isNew: true,
    isSale: false,
  },
];

export async function runSeedIfEmpty(): Promise<void> {
  try {
    const settingsRef = doc(db, 'settings', 'store');
    const snap = await getDoc(settingsRef);

    if (snap.exists()) return; // Already seeded

    console.log('First run — seeding Firestore...');
    const batch = writeBatch(db);

    // Settings
    batch.set(settingsRef, INITIAL_SETTINGS);

    // Admin accounts are provisioned via scripts/migrate-admin.mjs (Firebase Auth + admins/{uid}), not seeded here.

    // Products (3 seed products)
    for (const product of SEED_PRODUCTS) {
      batch.set(doc(db, 'products', product.id), product);
    }

    // Categories
    for (const cat of INITIAL_CATEGORIES) {
      batch.set(doc(collection(db, 'categories'), cat.id), cat);
    }

    // Coupons
    for (const coupon of INITIAL_COUPONS) {
      batch.set(doc(collection(db, 'coupons'), coupon.id), coupon);
    }

    // Colors
    batch.set(doc(db, 'colors', 'palette'), { list: INITIAL_COLORS });

    // WhatsApp contacts
    batch.set(doc(db, 'whatsapp_contacts', 'list'), { contacts: WHATSAPP_CONTACTS });

    await batch.commit();
    console.log('Firestore seed complete.');
  } catch (err) {
    console.error('Seed error:', err);
  }
}
