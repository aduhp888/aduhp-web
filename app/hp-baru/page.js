'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowLeft, 
  Smartphone, 
  Flame, 
  ShieldCheck, 
  CheckCircle2, 
  Cpu, 
  Gauge, 
  Search, 
  X, 
  MessageCircle, 
  ShoppingBag, 
  ExternalLink, 
  Filter, 
  SlidersHorizontal, 
  Award, 
  Check, 
  Zap, 
  Layers, 
  Activity,
  ArrowRight,
  Maximize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PRICE_TIERS } from '../data/entryPhones';
import { supabase } from '../lib/supabase';
import { getProductVariants, getProductColors } from '../lib/utils';

// Brand-brand smartphone resmi di Indonesia beserta distributor resminya
export const INDONESIA_BRANDS = [
  { id: 'all', name: 'Semua Merek', icon: '📱', distributor: 'Semua Distributor Resmi' },
  { id: 'Samsung', name: 'Samsung', icon: '🌌', distributor: 'Garansi Resmi SEIN 1 Tahun', popular: 'Galaxy S24 / A55 / A15' },
  { id: 'Xiaomi', name: 'Xiaomi & Redmi', icon: '🟠', distributor: 'Garansi Resmi TAM 15 Bulan', popular: 'Xiaomi 14 / Redmi Note 13' },
  { id: 'Apple', name: 'Apple (iPhone)', icon: '🍎', distributor: 'Garansi Resmi iBox / Digimap 1 Tahun', popular: 'iPhone 16 / 15 / 14' },
  { id: 'POCO', name: 'POCO', icon: '🟡', distributor: 'Garansi Resmi TAM 15 Bulan', popular: 'POCO F6 / X6 5G / M6' },
  { id: 'Infinix', name: 'Infinix', icon: '⚡', distributor: 'Garansi Resmi Carlcare 12 Bulan', popular: 'GT 20 Pro / Hot 50 Pro+' },
  { id: 'Oppo', name: 'OPPO', icon: '🟢', distributor: 'Garansi Resmi OPPO Indonesia', popular: 'Find X7 / Reno 12' },
  { id: 'Vivo', name: 'vivo', icon: '🔷', distributor: 'Garansi Resmi vivo Indonesia', popular: 'X100 / V40 / Y100' },
  { id: 'Realme', name: 'realme', icon: '🟡', distributor: 'Garansi Resmi realme Indonesia', popular: 'GT 6 / 13 Pro+ / C67' },
  { id: 'iQOO', name: 'iQOO', icon: '🚀', distributor: 'Garansi Resmi iQOO / vivo', popular: 'iQOO 12 / Z9 5G' },
  { id: 'Tecno', name: 'TECNO', icon: '🔹', distributor: 'Garansi Resmi Carlcare 13 Bulan', popular: 'Camon 30 / Pova 6 Pro' },
  { id: 'Asus', name: 'Asus ROG', icon: '🎮', distributor: 'Garansi Resmi Asus Indonesia', popular: 'ROG Phone 8 / Zenfone' },
  { id: 'itel', name: 'itel', icon: '🔴', distributor: 'Garansi Resmi Carlcare 12 Bulan', popular: 'RS4 / S24 / P55 5G' },
];

function formatIDR(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDirectCheckoutUrl(phone) {
  if (!phone) return '/checkout';

  const variants = getProductVariants(phone);
  const defaultVar = variants.find(v => v.isDefault && v.stock > 0) || variants.find(v => v.stock > 0) || variants[0];
  const colors = getProductColors(phone);
  const defaultColor = colors.find(c => c.isDefault) || colors[0];

  const ram = defaultVar?.ram || phone.ram_gb || 8;
  const storage = defaultVar?.storage || phone.storage_gb || 256;
  const price = defaultVar?.price || phone.price || 0;
  const color = defaultColor?.name || phone.color || 'Standard';
  const image = (Array.isArray(phone.images) && phone.images[0]) ? phone.images[0] : '';
  const condition = phone.condition || 'baru';

  const params = new URLSearchParams({
    productId: phone.id || '',
    name: phone.name || '',
    price: price.toString(),
    ram: ram.toString(),
    storage: storage.toString(),
    color: color,
    condition: condition,
    image: image
  });

  return `/checkout?${params.toString()}`;
}

export default function HpBaruPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [saleFilter, setSaleFilter] = useState('all'); // 'all' | 'dijual' | 'compare_only'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecModal, setSelectedSpecModal] = useState(null);
  const [activePhotoMap, setActivePhotoMap] = useState({});
  const [lightboxData, setLightboxData] = useState(null);

  function getActivePhotoIndex(phoneId) {
    return activePhotoMap[phoneId] || 0;
  }

  function setActivePhotoIndex(phoneId, idx) {
    setActivePhotoMap(prev => ({ ...prev, [phoneId]: idx }));
  }

  // Fetch live products from Supabase
  useEffect(() => {
    async function fetchLiveProducts() {
      try {
        const { data, error } = await supabase
          .from('dapur_products')
          .select('*')
          .eq('is_active', true)
          .eq('condition', 'baru')
          .order('created_at', { ascending: false });

        if (data) {
          const list = data.map(item => ({
            ...item,
            is_for_sale: item.is_for_sale !== false,
            sale_status: item.sale_status || (item.is_for_sale === false ? 'compare_only' : 'dijual')
          }));
          setProducts(list);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.warn('Error fetching live products:', err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveProducts();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Must be condition baru
      if (p.condition && p.condition !== 'baru') return false;

      // Brand filter
      let matchesBrand = true;
      if (selectedBrand !== 'all') {
        if (selectedBrand === 'Xiaomi') {
          matchesBrand = p.brand?.toLowerCase() === 'xiaomi' || p.brand?.toLowerCase() === 'redmi';
        } else {
          matchesBrand = p.brand?.toLowerCase() === selectedBrand.toLowerCase();
        }
      }

      // Tier filter
      const matchesTier = selectedTier === 'all' || p.price_tier === selectedTier;

      // Sale status filter
      const matchesSale = saleFilter === 'all' ||
        (saleFilter === 'dijual' && p.is_for_sale !== false) ||
        (saleFilter === 'compare_only' && p.is_for_sale === false);

      // Search filter
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.specs?.chipset?.toLowerCase().includes(q);

      return matchesBrand && matchesTier && matchesSale && matchesSearch;
    });
  }, [products, selectedBrand, selectedTier, saleFilter, searchQuery]);

  function getWhatsAppBuyUrl(phone) {
    const text = encodeURIComponent(
      `Halo Tim aduhp.com, saya ingin memesan Smartphone Baru BNIB:\n\n` +
      `📱 *${phone.name}*\n` +
      `💰 *Harga:* ${formatIDR(phone.price)}\n` +
      `🛡️ *Garansi:* ${phone.official_distributor || 'Resmi Indonesia'}\n\n` +
      `Apakah stok unit segel ini ready untuk dikirim? Terima kasih.`
    );
    return `https://wa.me/6281234567890?text=${text}`;
  }

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', background: 'var(--bg-black)' }}>
      {/* 1. Header Navbar */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="brand-wrapper">
              <div className="brand-vs-box" style={{ padding: 0, overflow: 'hidden', background: '#000', border: '1px solid var(--border-lime)', boxShadow: '0 0 10px rgba(198, 255, 0, 0.35)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="AduHP Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="brand-meta">
                <div className="brand-title-row">
                  <span className="brand-name">AduHP</span>
                  <span className="brand-mvp-badge">BARU BNIB</span>
                </div>
                <span className="brand-tagline">Katalog HP Baru Resmi Indonesia</span>
              </div>
            </Link>

            <nav className="nav-menu">
              <Link href="/" className="nav-link">
                Home
              </Link>
              <Link href="/adu-hp" className="nav-link">
                ⚔️ Adu HP
              </Link>
              <Link 
                href="/hp-baru" 
                className="nav-link"
                style={{
                  background: 'rgba(198, 255, 0, 0.12)',
                  border: '1px solid var(--border-lime)',
                  color: 'var(--accent-lime)',
                  fontWeight: 800,
                }}
              >
                📱 HP Baru
              </Link>
              <Link 
                href="/hp-second" 
                className="nav-link"
                style={{
                  color: '#00E5FF',
                }}
              >
                🔄 HP Second
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 2. Hero Section HP Baru */}
      <section style={{
        padding: '48px 0 32px',
        background: 'radial-gradient(ellipse at top, rgba(198, 255, 0, 0.08) 0%, transparent 70%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'rgba(198, 255, 0, 0.1)', border: '1px solid var(--border-lime)', marginBottom: '16px' }}>
            <Sparkles size={14} color="var(--accent-lime)" />
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-lime)', letterSpacing: '0.5px' }}>
              100% BARU • BNIB SEGEL RESMI • GARANSI DISTRIBUTOR INDONESIA
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1.2 }}>
            Katalog Smartphone Baru Indonesia
          </h1>
          <p style={{ color: '#aaa', fontSize: '15px', maxWidth: '720px', marginTop: '10px', lineHeight: 1.6 }}>
            Pilih HP baru impianmu dari berbagai merek resmi di Indonesia (Samsung, Xiaomi, Apple, POCO, Infinix, Oppo, Vivo, Realme, dll.). Semua unit bergaransi distributor resmi (SEIN, TAM, iBox, Carlcare) & dilengkapi skor AnTuTu v10 riil.
          </p>

          {/* Quick Stats Bar */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--accent-lime)" />
              <span style={{ fontSize: '13px', color: '#ccc' }}>Garansi Resmi TAM / SEIN / iBox</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#FF9100" />
              <span style={{ fontSize: '13px', color: '#ccc' }}>Skor AnTuTu v10 & Uji Gaming FPS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#00E5FF" />
              <span style={{ fontSize: '13px', color: '#ccc' }}>IMEI Kemenperin 100% Permanen</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Brand Category Grid */}
      <section style={{ padding: '24px 0 16px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏢</span>
              <span>Pilih Merek HP di Indonesia:</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#777' }}>
              {filteredProducts.length} Smartphone Ditemukan
            </span>
          </div>

          {/* Brand Filter Pills Bar */}
          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '10px',
            scrollbarWidth: 'thin'
          }}>
            {INDONESIA_BRANDS.map(brand => {
              const isSelected = selectedBrand === brand.id;
              const brandCount = brand.id === 'all' 
                ? products.length 
                : products.filter(p => brand.id === 'Xiaomi' ? (p.brand?.toLowerCase() === 'xiaomi' || p.brand?.toLowerCase() === 'redmi') : p.brand?.toLowerCase() === brand.id.toLowerCase()).length;

              return (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: isSelected ? 'var(--accent-lime)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#000' : '#ddd',
                    border: isSelected ? '1px solid var(--accent-lime)' : '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '13px',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{brand.icon}</span>
                  <span>{brand.name}</span>
                  <span style={{
                    fontSize: '11px',
                    background: isSelected ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}>
                    {brandCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Brand Info Banner */}
          {selectedBrand !== 'all' && (
            <div style={{
              marginTop: '12px',
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'rgba(198, 255, 0, 0.04)',
              border: '1px solid rgba(198, 255, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="var(--accent-lime)" />
                <span style={{ fontSize: '13px', color: '#eee' }}>
                  Distributor Resmi: <strong>{INDONESIA_BRANDS.find(b => b.id === selectedBrand)?.distributor}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedBrand('all')}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset ke Semua Merek
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Filter Tier & Search Toolbar */}
      <section style={{ padding: '12px 0 24px' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
            background: '#121216',
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
              <input
                type="text"
                placeholder="Cari nama HP baru, chipset, atau spesifikasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Price Tier Selector */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flexWrap: 'wrap' }}>
              {PRICE_TIERS.map(tier => {
                const isSelected = selectedTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? `1px solid ${tier.color || '#fff'}` : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isSelected ? tier.color || '#fff' : '#888',
                      fontSize: '12px',
                      fontWeight: isSelected ? 800 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tier.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Status Penjualan Tabs */}
            <div style={{ display: 'flex', gap: '8px', width: '100%', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `Semua Katalog (${products.filter(p => !p.condition || p.condition === 'baru').length})` },
                { id: 'dijual', label: `🛍️ Dijual oleh aduHP (${products.filter(p => (!p.condition || p.condition === 'baru') && p.is_for_sale !== false).length})` },
                { id: 'compare_only', label: `⚖️ Database Pembanding (${products.filter(p => (!p.condition || p.condition === 'baru') && p.is_for_sale === false).length})` },
              ].map(tab => {
                const isSelected = saleFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSaleFilter(tab.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      border: isSelected 
                        ? (tab.id === 'compare_only' ? '1px solid #00E5FF' : '1px solid var(--accent-lime)')
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isSelected 
                        ? (tab.id === 'compare_only' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(198, 255, 0, 0.12)')
                        : '#18181c',
                      color: isSelected 
                        ? (tab.id === 'compare_only' ? '#00E5FF' : 'var(--accent-lime)')
                        : '#aaa',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Product Grid */}
      <section style={{ padding: '0 0 60px' }}>
        <div className="container">
          {loading ? (
            <div style={{ padding: '80px 0', textAlign: 'center', color: '#888' }}>
              <div className="spin" style={{ width: '32px', height: '32px', border: '3px solid var(--accent-lime)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} />
              Memuat katalog HP Baru resmi Indonesia...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', background: '#121216', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Smartphone size={40} color="#555" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Tidak ada HP Baru yang cocok</h3>
              <p style={{ color: '#888', fontSize: '13px', marginTop: '6px' }}>
                Coba ubah filter merek atau kata kunci pencarian Anda.
              </p>
              <button
                onClick={() => { setSelectedBrand('all'); setSelectedTier('all'); setSearchQuery(''); }}
                style={{
                  marginTop: '16px',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: 'var(--accent-lime)',
                  color: '#000',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredProducts.map(phone => {
                const imagesList = Array.isArray(phone.images) && phone.images.length > 0 
                  ? phone.images 
                  : [(phone.images && phone.images[0]) || phone.image_url || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600'];
                
                const activePhotoIdx = getActivePhotoIndex(phone.id);
                const currentPhoto = imagesList[activePhotoIdx] || imagesList[0];
                const hasDiscount = phone.original_price && phone.original_price > phone.price;
                const discountPercent = hasDiscount 
                  ? Math.round(((phone.original_price - phone.price) / phone.original_price) * 100) 
                  : 0;

                return (
                  <div
                    key={phone.id}
                    className="card"
                    style={{
                      background: '#121216',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(198, 255, 0, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Image Area */}
                    <div style={{ position: 'relative', height: '210px', background: 'radial-gradient(circle, #222 0%, #0d0d10 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px' }}>
                      {/* Badge Brand & Status Penjualan */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', zIndex: 2 }}>
                        <span style={{
                          background: 'rgba(0, 0, 0, 0.7)',
                          backdropFilter: 'blur(4px)',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800
                        }}>
                          {phone.brand}
                        </span>
                        {phone.is_for_sale === false ? (
                          <span style={{
                            background: 'rgba(0, 229, 255, 0.2)',
                            border: '1px solid rgba(0, 229, 255, 0.45)',
                            color: '#00E5FF',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800
                          }}>
                            ⚖️ DATA PEMBANDING
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(198, 255, 0, 0.15)',
                            border: '1px solid var(--border-lime)',
                            color: 'var(--accent-lime)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800
                          }}>
                            🟢 DIJUAL ADUHP
                          </span>
                        )}
                      </div>

                      {/* Zoom Trigger Button if multi-photos */}
                      <button
                        onClick={() => setLightboxData({ product: phone, activeIndex: activePhotoIdx })}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          zIndex: 2
                        }}
                        title="Buka 5 Foto Fullscreen"
                      >
                        <Maximize2 size={11} />
                        <span>{imagesList.length} Foto</span>
                      </button>

                      {hasDiscount && (
                        <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: '#f43f5e', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, zIndex: 2 }}>
                          HEMAT {discountPercent}%
                        </div>
                      )}

                      {/* Main Display Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentPhoto}
                        alt={`${phone.name} foto ${activePhotoIdx + 1}`}
                        style={{ maxHeight: '165px', maxWidth: '85%', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600';
                        }}
                      />
                    </div>

                    {/* 5 Thumbnails Strip (if multiple photos) */}
                    {imagesList.length > 1 && (
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        padding: '6px 12px',
                        background: '#0e0e12',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        {imagesList.slice(0, 5).map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActivePhotoIndex(phone.id, i)}
                            style={{
                              flex: 1,
                              height: '36px',
                              borderRadius: '6px',
                              border: activePhotoIdx === i ? '2px solid var(--accent-lime)' : '1px solid rgba(255, 255, 255, 0.1)',
                              overflow: 'hidden',
                              padding: 0,
                              background: '#000',
                              cursor: 'pointer',
                              opacity: activePhotoIdx === i ? 1 : 0.6,
                              transition: 'all 0.15s ease'
                            }}
                            title={`Foto ${i + 1}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`Thumb ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Content Body */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Link href={`/produk/${phone.id}`} style={{ textDecoration: 'none' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '6px', transition: 'color 0.15s ease' }} className="hover-lime">
                          {phone.name}
                        </h4>
                      </Link>

                      {/* Distributor Guarantee */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#aaa', marginBottom: '12px' }}>
                        <ShieldCheck size={13} color="var(--accent-lime)" />
                        <span>{phone.official_distributor || 'Garansi Distributor Resmi Indonesia'}</span>
                      </div>

                      {/* Hardware Snippet */}
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#ccc', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Cpu size={13} color="#FF9100" />
                          <span style={{ fontWeight: 600 }}>{phone.specs?.chipset || 'Octa-Core Processor'}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          {phone.specs?.display || 'Layar Mulus'} • {phone.specs?.battery || 'Baterai Awet'}
                        </div>
                      </div>

                      {/* AnTuTu Score Badge */}
                      {phone.antutu?.total ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 109, 0, 0.08)',
                          border: '1px solid rgba(255, 109, 0, 0.25)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          marginBottom: '14px',
                          fontSize: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF9100', fontWeight: 800 }}>
                            <Flame size={14} />
                            <span>AnTuTu v10:</span>
                          </div>
                          <span style={{ fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                            {phone.antutu.total.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ) : null}

                      {/* Price Section */}
                      <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          {phone.is_for_sale === false ? (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                              <span style={{ fontSize: '15px', fontWeight: 800, color: '#aaa', fontFamily: 'var(--font-mono)' }}>
                                SRP: {formatIDR(phone.price)}
                              </span>
                              <span style={{ fontSize: '10px', color: '#777' }}>(Tidak Dijual)</span>
                            </div>
                          ) : (
                            <>
                              <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                                {formatIDR(phone.price)}
                              </span>
                              {hasDiscount && (
                                <span style={{ fontSize: '12px', color: '#777', textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                                  {formatIDR(phone.original_price)}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* CTA Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <Link
                            href={`/adu-hp?slot1=${phone.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                            title="Adukan HP Ini di Arena Derby"
                          >
                            <span>⚔️ Adukan</span>
                          </Link>
                          {phone.is_for_sale === false ? (
                            <div
                              style={{
                                flex: 1.2,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px dashed rgba(255, 255, 255, 0.18)',
                                color: '#888',
                                fontSize: '11px',
                                fontWeight: 600,
                                textAlign: 'center',
                                cursor: 'default'
                              }}
                              title="Tipe handphone ini adalah data spesifikasi pembanding di arena duel, tidak dijual oleh aduHP."
                            >
                              <span>⚖️ Hanya Pembanding</span>
                            </div>
                          ) : (
                            <Link
                              href={getDirectCheckoutUrl(phone)}
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1.2, justifyContent: 'center', fontSize: '12px', background: 'var(--accent-lime)', color: '#000', fontWeight: 800, textDecoration: 'none' }}
                              title="Beli langsung unit ini dan lanjut ke halaman Checkout"
                            >
                              <ShoppingBag size={13} />
                              <span>Beli Langsung</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Zoom Modal for 5 Photos */}
      {lightboxData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/* Top Modal Bar */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10
          }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff' }}>
                {lightboxData.product.name}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--accent-lime)' }}>
                100% Baru BNIB Segel Resmi • Foto #{lightboxData.activeIndex + 1} dari {lightboxData.product.images?.length || 1}
              </span>
            </div>
            <button
              onClick={() => setLightboxData(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              ✕ Tutup
            </button>
          </div>

          {/* Large Image with Next / Prev Navigation */}
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {lightboxData.product.images?.length > 1 && (
              <button
                onClick={() => {
                  const total = lightboxData.product.images.length;
                  const prevIdx = (lightboxData.activeIndex - 1 + total) % total;
                  setLightboxData(prev => ({ ...prev, activeIndex: prevIdx }));
                }}
                style={{
                  position: 'absolute',
                  left: '-48px',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxData.product.images?.[lightboxData.activeIndex] || lightboxData.product.image_url}
              alt="Zoom Unit"
              style={{
                maxWidth: '85vw',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            />

            {lightboxData.product.images?.length > 1 && (
              <button
                onClick={() => {
                  const total = lightboxData.product.images.length;
                  const nextIdx = (lightboxData.activeIndex + 1) % total;
                  setLightboxData(prev => ({ ...prev, activeIndex: nextIdx }));
                }}
                style={{
                  position: 'absolute',
                  right: '-48px',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Thumbnail Strip at Bottom */}
          {lightboxData.product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              {lightboxData.product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxData(prev => ({ ...prev, activeIndex: idx }))}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '8px',
                    border: lightboxData.activeIndex === idx ? '2px solid var(--accent-lime)' : '1px solid rgba(255,255,255,0.2)',
                    overflow: 'hidden',
                    padding: 0,
                    background: '#000',
                    cursor: 'pointer',
                    opacity: lightboxData.activeIndex === idx ? 1 : 0.5
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
