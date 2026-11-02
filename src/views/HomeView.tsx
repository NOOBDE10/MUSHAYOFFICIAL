import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import {
  ArrowRight,
  Crown,
  ShieldCheck,
  Truck,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    products,
    settings,
    navigateTo,
    categories,
    setSelectedShopDepartment,
    setSelectedShopCategory,
    setActiveAdminTab,
    setIsWhatsAppModalOpen,
  } = useShop();

  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

  // Increased card quantities for a richer, more abundant browsing experience
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 12);
  const newArrivals = products.filter((p) => p.isNew || p.id === 'prod-001' || p.id === 'prod-002').slice(0, 8);
  const dealProducts = products.filter((p) => p.isSale || p.discountPercent > 10).slice(0, 8);

  // Active categories from Admin Panel
  const activeCategories = categories.filter((c) => c.isActive);

  const handleDepartmentClick = (dept: 'women' | 'men' | 'child') => {
    setSelectedShopDepartment(dept);
    setSelectedShopCategory('all');
    navigateTo('shop');
  };

  const handleCategoryCardClick = (cat: typeof categories[0]) => {
    if (cat.gender && cat.gender !== 'all') {
      setSelectedShopDepartment(cat.gender);
    } else {
      setSelectedShopDepartment('all');
    }
    setSelectedShopCategory(cat.name);
    navigateTo('shop');
  };

  const handleWhatsAppOrder = () => {
    setIsWhatsAppModalOpen(true);
  };

  return (
    <div className="w-full space-y-16 md:space-y-24 pb-16 bg-[#F5EFE6] text-[#111111]">
      {/* 
        1. LUXURY HERO SECTION WITH MATCHING BACKGROUND IMAGE & TOTALLY TRANSPARENT LOGO:
        "हीरो सेशन में इमेज लगा दो। मेरे लोगो का बैकग्राउंड रिमूव करके टोटल ट्रांसपेरेंट कर दो। 
        और लोगो से ही मिलते-जुलते कुछ भी आप अपनी तरफ से पिक्चर हीरो सेशन के बैकग्राउंड पर लगा दो।"
      */}
      <section className="relative w-full min-h-[72vh] md:min-h-[82vh] flex items-center justify-center overflow-hidden border-b border-[#A0645A]/25">
        {/* Hero Background Image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={settings.heroBackgroundImage || '/src/assets/images/hero_ms_luxury_1791101309370.jpg'}
            alt="MUSHAY Luxury Atelier"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center scale-105 filter brightness-[0.97] contrast-[1.03] transition-transform duration-1000"
          />
          {/* Luminous, translucent luxury overlay that ensures typography remains crisp and clear */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5EFE6]/75 via-[#FAF7F2]/65 to-[#F5EFE6]/90 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.45)_0%,rgba(245,239,230,0.7)_80%)]" />
        </div>

        {/* Hero Center Content: Typography & Focal Call to Action */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center py-16 sm:py-24 md:py-32 flex flex-col items-center">
          <span className="text-[11px] sm:text-xs font-semibold tracking-[0.35em] text-[#8B2E0B] uppercase mb-3 animate-fadeIn">
            Haute Couture Atelier • {settings.brandName || 'MUSHAY'}
          </span>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif-luxury font-bold tracking-tight text-[#111111] animate-fadeIn leading-[1.12]">
            {settings.heroHeadline || 'STYLE THAT SPEAKS.'}
          </h1>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-[#111111]/75 font-normal max-w-lg tracking-wide leading-relaxed animate-fadeIn">
            {settings.heroSubtext || 'Discover refined fashion designed for your everyday moments.'}
          </p>

          {/* Focal Action: 1 Primary CTA + 1 Understated Concierge Link */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigateTo('shop')}
              className="w-full sm:w-auto px-9 py-3.5 bg-[#8B2E0B] hover:bg-[#702407] text-[#FAF7F2] font-semibold text-xs uppercase tracking-[0.22em] rounded-[14px] shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>Explore Collection →</span>
            </button>

            <button
              onClick={handleWhatsAppOrder}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#FAF7F2]/90 hover:bg-[#FAF7F2] text-[#111111] border border-[#A0645A]/30 font-semibold text-xs uppercase tracking-[0.18em] rounded-[14px] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              title="Open WhatsApp Concierge Fitting"
            >
              <span className="w-2 h-2 rounded-full bg-[#1E7E34]" />
              <span>Concierge Inquiry</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY TILES: EXPLORE THE HOUSE OF MUSHAY (Women, Men, Child) - Always 3 Columns Side-by-Side on All Devices */}
      <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="text-center space-y-1.5 sm:space-y-2 mb-6 sm:mb-10">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#8B2E0B] font-semibold">
            Curated Collections
          </span>
          <h2 className="text-lg sm:text-3xl md:text-4xl font-serif-luxury font-bold text-[#111111] tracking-wide">
            EXPLORE THE HOUSE OF {settings.brandName || 'MUSHAY'}
          </h2>
          <p className="text-[11px] sm:text-sm text-[#111111]/70 max-w-lg mx-auto">
            Choose your department to view tailored garments and exclusive bespoke creations.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
          {/* Card 1: Women's Couture */}
          <div
            onClick={() => handleDepartmentClick('women')}
            className="group relative h-[190px] xs:h-[230px] sm:h-[320px] md:h-[420px] rounded-[14px] sm:rounded-[22px] overflow-hidden border border-[#A0645A]/30 hover:border-[#8B2E0B] cursor-pointer transition-all duration-300 shadow-[0_6px_20px_rgba(17,17,17,0.06)] hover:shadow-[0_18px_40px_rgba(139,46,11,0.2)] hover:-translate-y-1 flex flex-col justify-end"
          >
            <img
              src="/src/assets/images/fashion_gold_blazer_1790533633560.jpg"
              alt="Women's Couture"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/40 to-transparent" />
            <div className="relative z-10 p-2 sm:p-5 md:p-6 flex items-end justify-between gap-1">
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[10px] md:text-[11px] uppercase tracking-wider text-[#C4AD8A] font-semibold block leading-tight mb-0.5 sm:mb-1">
                  Atelier
                </span>
                <h3 className="text-[10.5px] xs:text-xs sm:text-lg md:text-2xl font-serif-luxury font-bold text-white tracking-wide leading-tight">
                  WOMEN'S COUTURE
                </h3>
                <p className="hidden md:block text-xs text-[#FAF7F2]/80 mt-1 line-clamp-1">
                  Dresses, gowns & tailored blazers
                </p>
              </div>
              <span className="hidden sm:flex p-2 md:p-3 rounded-full bg-[#8B2E0B] text-white group-hover:scale-110 group-hover:translate-x-1 transition-all shadow-md shrink-0">
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </span>
            </div>
          </div>

          {/* Card 2: Men's Bespoke */}
          <div
            onClick={() => handleDepartmentClick('men')}
            className="group relative h-[190px] xs:h-[230px] sm:h-[320px] md:h-[420px] rounded-[14px] sm:rounded-[22px] overflow-hidden border border-[#A0645A]/30 hover:border-[#8B2E0B] cursor-pointer transition-all duration-300 shadow-[0_6px_20px_rgba(17,17,17,0.06)] hover:shadow-[0_18px_40px_rgba(139,46,11,0.2)] hover:-translate-y-1 flex flex-col justify-end"
          >
            <img
              src="/src/assets/images/fashion_mens_gold_tuxedo_1790533657236.jpg"
              alt="Men's Bespoke"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/40 to-transparent" />
            <div className="relative z-10 p-2 sm:p-5 md:p-6 flex items-end justify-between gap-1">
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[10px] md:text-[11px] uppercase tracking-wider text-[#C4AD8A] font-semibold block leading-tight mb-0.5 sm:mb-1">
                  Sartorial
                </span>
                <h3 className="text-[10.5px] xs:text-xs sm:text-lg md:text-2xl font-serif-luxury font-bold text-white tracking-wide leading-tight">
                  MEN'S BESPOKE
                </h3>
                <p className="hidden md:block text-xs text-[#FAF7F2]/80 mt-1 line-clamp-1">
                  Luxury suits, tuxedos & tailoring
                </p>
              </div>
              <span className="hidden sm:flex p-2 md:p-3 rounded-full bg-[#8B2E0B] text-white group-hover:scale-110 group-hover:translate-x-1 transition-all shadow-md shrink-0">
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </span>
            </div>
          </div>

          {/* Card 3: Children's Collection */}
          <div
            onClick={() => handleDepartmentClick('child')}
            className="group relative h-[190px] xs:h-[230px] sm:h-[320px] md:h-[420px] rounded-[14px] sm:rounded-[22px] overflow-hidden border border-[#A0645A]/30 hover:border-[#8B2E0B] cursor-pointer transition-all duration-300 shadow-[0_6px_20px_rgba(17,17,17,0.06)] hover:shadow-[0_18px_40px_rgba(139,46,11,0.2)] hover:-translate-y-1 flex flex-col justify-end"
          >
            <img
              src="/src/assets/images/child_luxury_fashion_1790986764971.jpg"
              alt="Children's Atelier"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/40 to-transparent" />
            <div className="relative z-10 p-2 sm:p-5 md:p-6 flex items-end justify-between gap-1">
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[10px] md:text-[11px] uppercase tracking-wider text-[#C4AD8A] font-semibold block leading-tight mb-0.5 sm:mb-1">
                  Junior Atelier
                </span>
                <h3 className="text-[10.5px] xs:text-xs sm:text-lg md:text-2xl font-serif-luxury font-bold text-white tracking-wide leading-tight">
                  CHILDREN'S
                </h3>
                <p className="hidden md:block text-xs text-[#FAF7F2]/80 mt-1 line-clamp-1">
                  Festive kurtas & luxury sets
                </p>
              </div>
              <span className="hidden sm:flex p-2 md:p-3 rounded-full bg-[#8B2E0B] text-white group-hover:scale-110 group-hover:translate-x-1 transition-all shadow-md shrink-0">
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 
        3. SIGNATURE BEST SELLERS (Increased quantity: 12 cards)
        "जो कार्ड्स हैं, वो कार्ड्स की क्वांटिटी थोड़ी बढ़ा दो।"
      */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-4 border-b border-[#A0645A]/25">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#8B2E0B] font-semibold">
              Most Coveted
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#111111] tracking-wide">
              SIGNATURE BEST SELLERS
            </h2>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="text-xs uppercase tracking-widest font-bold text-[#8B2E0B] hover:text-[#111111] flex items-center gap-1.5 group transition-colors"
          >
            <span>VIEW ALL PIECES</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. LUXURY CAMPAIGN BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[22px] overflow-hidden border border-[#A0645A]/30 bg-[#FAF7F2] p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
          <div className="max-w-xl space-y-4 text-left">
            <span className="text-xs uppercase tracking-[0.3em] text-[#8B2E0B] font-bold flex items-center justify-start gap-1.5">
              <Crown className="w-3.5 h-3.5 text-[#8B2E0B]" />
              Bespoke Tailoring Atelier
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif-luxury font-bold text-[#111111] tracking-wide leading-tight">
              PRECISION TAILORING. UNCOMPROMISED NOBILITY.
            </h2>
            <p className="text-xs sm:text-sm text-[#111111]/80 font-normal leading-relaxed">
              Every {settings.brandName || 'MUSHAY'} garment is hand-inspected in our design ateliers before being sealed in preservation packaging. Enjoy nationwide Cash on Delivery and prompt delivery.
            </p>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="px-8 py-3.5 bg-[#8B2E0B] hover:bg-[#111111] text-[#F5EFE6] font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] rounded-[22px] transition-all transform hover:scale-105 shrink-0 shadow-md cursor-pointer"
          >
            EXPLORE ATELIER
          </button>
        </div>
      </section>

      {/* 
        5. FEATURED DEALS & SALE HIGHLIGHTS (8 cards)
      */}
      {dealProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-4 border-b border-[#A0645A]/25">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-[#8B2E0B] font-semibold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#8B2E0B]" />
                Limited Privileges
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#111111] tracking-wide">
                SPECIAL ATELIER DEALS
              </h2>
            </div>

            <button
              onClick={() => navigateTo('shop')}
              className="text-xs uppercase tracking-widest font-bold text-[#8B2E0B] hover:text-[#111111] flex items-center gap-1.5 group transition-colors"
            >
              <span>EXPLORE ALL DEALS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {dealProducts.map((product) => (
              <ProductCard key={product.id} product={product} isDealCard={true} />
            ))}
          </div>
        </section>
      )}

      {/* 6. NEW COUTURE DROPS (8 cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-[#8B2E0B] font-semibold">
            Fresh From Atelier
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#111111] tracking-wide">
            NEW COUTURE DROPS
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 7. TRUST INDICATORS: ONLY 2 DAYS EASY EXCHANGE */}
      {/* 7. EDITORIAL PILLARS & TRUST STANDARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-y border-[#A0645A]/25 py-8 md:py-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#8B2E0B] font-bold block">01 / Payment</span>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#111111]">Cash on Delivery</h4>
            <p className="text-[11px] text-[#6B5E55] leading-relaxed">Pay upon unboxing anywhere across Pakistan</p>
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#8B2E0B] font-bold block">02 / Shipping</span>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#111111]">Complimentary Courier</h4>
            <p className="text-[11px] text-[#6B5E55] leading-relaxed">Free insured shipping on orders over PKR {settings.freeShippingThreshold.toLocaleString()}</p>
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#8B2E0B] font-bold block">03 / Standard</span>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#111111]">Atelier Tailoring</h4>
            <p className="text-[11px] text-[#6B5E55] leading-relaxed">Hand-inspected silk, cashmere, and bespoke weaves</p>
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#8B2E0B] font-bold block">04 / Concierge</span>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#111111]">Size Exchange Guarantee</h4>
            <p className="text-[11px] text-[#6B5E55] leading-relaxed">Direct 2-day size exchange concierge service</p>
          </div>
        </div>
      </section>

      {/* 8. CATEGORIES SECTION (CLOSED BY DEFAULT & ON REFRESH, SIMPLE NORMAL BUTTON TO TOGGLE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <button
            onClick={() => setIsCategoryDrawerOpen(!isCategoryDrawerOpen)}
            className="px-7 py-3 bg-[#FAF7F2] hover:bg-white text-[#111111] hover:text-[#8B2E0B] border border-[#A0645A]/30 rounded-[14px] text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            aria-expanded={isCategoryDrawerOpen}
          >
            <Layers className="w-4 h-4 text-[#8B2E0B]" />
            <span>Categories</span>
            {isCategoryDrawerOpen ? (
              <ChevronUp className="w-4 h-4 text-[#8B2E0B]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8B2E0B]" />
            )}
          </button>
        </div>

        {isCategoryDrawerOpen && (
          <div className="mt-8 pt-6 border-t border-[#A0645A]/20 animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {activeCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryCardClick(cat)}
                  className="group relative bg-[#FAF7F2] border border-[#A0645A]/25 hover:border-[#8B2E0B]/60 rounded-[16px] p-2.5 sm:p-3 cursor-pointer transition-all duration-300 hover:shadow-[0_10px_24px_rgba(17,17,17,0.06)] flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[10px] mb-2 bg-[#EAE0D1]">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#111111]/85 text-[#FAF7F2] text-[8px] font-bold uppercase tracking-wider rounded-[4px]">
                      {cat.gender.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-center space-y-0.5">
                    <h4 className="text-xs font-semibold text-[#111111] group-hover:text-[#8B2E0B] transition-colors uppercase tracking-wider line-clamp-1 font-serif-luxury">
                      {cat.name}
                    </h4>
                    {cat.itemCount && (
                      <p className="text-[10px] text-[#6B5E55] font-mono tabular-nums">
                        {cat.itemCount} Garments
                      </p>
                    )}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-[#A0645A]/15 text-center">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#8B2E0B] group-hover:underline">
                      Explore →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
