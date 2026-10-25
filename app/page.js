'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Truck, 
  Cpu, 
  Smartphone, 
  ShoppingBag, 
  ExternalLink, 
  ArrowRight, 
  Search, 
  X, 
  Check, 
  RefreshCw, 
  Award, 
  Flame, 
  MessageCircle,
  SlidersHorizontal,
  ChevronDown,
  Trash2
} from 'lucide-react';

// Fallback seed data in case API endpoint is temporarily unreachable
const FALLBACK_PRODUCTS = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    name: 'iPhone 16 Pro Max 256GB',
    brand: 'Apple',
    condition: 'baru',
    grade: 'Baru (BNIB Segel)',
    battery_health: null,
    official_distributor: 'iBox / Digimap Resmi 1 Tahun',
    price: 24999000,
    original_price: 26999000,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop'],
    specs: { chipset: 'Apple A18 Pro (3nm)', display: '6.9 Super Retina XDR OLED 120Hz', battery: '4685 mAh', os: 'iOS 18' },
    scores: { ngojol: 88, game: 98, ngonten: 99, tiktok: 98, kuliah: 89, awet: 95 }
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    name: 'Samsung Galaxy S24 Ultra 512GB',
    brand: 'Samsung',
    condition: 'baru',
    grade: 'Baru (BNIB Segel)',
    battery_health: null,
    official_distributor: 'SEIN Resmi Indonesia 1 Tahun',
    price: 23999000,
    original_price: 25999000,
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=1000&auto=format&fit=crop'],
    specs: { chipset: 'Snapdragon 8 Gen 3 for Galaxy', display: '6.8 Dynamic AMOLED 2X 120Hz', battery: '5000 mAh 45W', os: 'Android 14' },
    scores: { ngojol: 92, game: 99, ngonten: 97, tiktok: 96, kuliah: 92, awet: 96 }
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    name: 'iPhone 13 Pro 256GB (Second Grade A+)',
    brand: 'Apple',
    condition: 'second',
    grade: 'Second Grade A+ (Mulus 99%)',
    battery_health: 92,
    official_distributor: 'Eks Resmi iBox • Garansi Toko 30 Hari',
    price: 9499000,
    original_price: 18499000,
    images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1000&auto=format&fit=crop'],
    specs: { chipset: 'Apple A15 Bionic', display: '6.1 Super Retina XDR ProMotion 120Hz', battery: 'BH 92% Original', os: 'iOS 18 Supported' },
    scores: { ngojol: 94, game: 91, ngonten: 94, tiktok: 93, kuliah: 96, awet: 97 }
  },
  {
    id: 'a1000000-0000-0000-0000-000000000004',
    name: 'Xiaomi 14 Ultra 512GB (Leica Quad-Cam)',
    brand: 'Xiaomi',
    condition: 'baru',
    grade: 'Baru (BNIB Segel)',
    battery_health: null,
    official_distributor: 'TAM Resmi Indonesia 15 Bulan',
    price: 17999000,
    original_price: 19999000,
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop'],
    specs: { chipset: 'Snapdragon 8 Gen 3', display: '6.73 WQHD+ LTPO 120Hz', battery: '5000 mAh 90W HyperCharge', os: 'HyperOS' },
    scores: { ngojol: 90, game: 97, ngonten: 100, tiktok: 95, kuliah: 88, awet: 92 }
  },
  {
    id: 'a1000000-0000-0000-0000-000000000005',
    name: 'Samsung Galaxy S23 Ultra 256GB (Second Eks SEIN)',
    brand: 'Samsung',
    condition: 'second',
    grade: 'Second Grade A+ (Mulus 98%)',
    battery_health: 95,
    official_distributor: 'Eks SEIN Resmi • Bebas Blokir IMEI',
    price: 11499000,
    original_price: 19999000,
    images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1000&auto=format&fit=crop'],
    specs: { chipset: 'Snapdragon 8 Gen 2 for Galaxy', display: '6.8 Dynamic AMOLED 2X 120Hz', battery: 'BH 95% 5000 mAh', os: 'Android 14 One UI 6.1' },
    scores: { ngojol: 93, game: 94, ngonten: 95, tiktok: 94, kuliah: 95, awet: 98 }
  }
];

const NEEDS_LIST = [
  {
    id: 'ngojol',
    icon: '🛵',
    label: 'Buat Ngojol',
    desc: 'Baterai monster + layar nits terang siang hari + NFC e-toll'
  },
  {
    id: 'game',
    icon: '🎮',
    label: 'Buat Game',
    desc: 'Antutu 1jt+ Snapdragon/Dimensity + 120Hz-144Hz lancar jaya'
  },
  {
    id: 'ngonten',
    icon: '📸',
    label: 'Buat Ngonten',
    desc: 'Hardware OIS stabil + sensor tajam buat video reels'
  },
  {
    id: 'tiktok',
    icon: '📹',
    label: 'Live TikTok',
    desc: 'Kamera depan jernih + tahan panas streaming berjam-jam'
  },
  {
    id: 'kuliah',
    icon: '🎓',
    label: 'Sekolah/Kuliah',
    desc: 'Storage lega PDF/tugas + baterai awet + harga hemat'
  },
  {
    id: 'awet',
    icon: '💰',
    label: 'Cari Murah Awet',
    desc: 'Spek per rupiah paling tinggi, anti-boncos'
  }
];

function formatIDR(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function LandingPage() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState('ngojol'); // Default checked like screenshot
  
  // 3 Comparison slots
  const [comparedIds, setComparedIds] = useState([
    'a1000000-0000-0000-0000-000000000003', // iPhone 13 Pro Second
    'a1000000-0000-0000-0000-000000000005', // Galaxy S23 Ultra Second
    'a1000000-0000-0000-0000-000000000001', // iPhone 16 Pro Max
  ]);

  // Modals & Drawers
  const [modalOpen, setModalOpen] = useState(null); // 'katalog' | 'budget' | 'cart' | 'swap-slot'
  const [activeSlotToSwap, setActiveSlotToSwap] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterBudgetMax, setFilterBudgetMax] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  // Fetch live products from dapur.aduhp.com/api/products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('https://dapur.aduhp.com/api/products');
        if (res.ok) {
          const json = await res.json();
          const list = json.data && json.data.length > 0 ? json.data : json;
          if (Array.isArray(list) && list.length > 0) {
            // Enhance fetched data with algorithmic score mapping if needed
            const enriched = list.map((item, idx) => {
              const base = FALLBACK_PRODUCTS[idx % FALLBACK_PRODUCTS.length];
              return {
                ...item,
                scores: item.scores || base.scores || {
                  ngojol: 90,
                  game: 92,
                  ngonten: 95,
                  tiktok: 93,
                  kuliah: 91,
                  awet: 94
                }
              };
            });
            setProducts(enriched);
            // Default first 3
            if (enriched.length >= 3) {
              setComparedIds([enriched[2]?.id || enriched[0].id, enriched[4]?.id || enriched[1].id, enriched[0].id]);
            }
          }
        }
      } catch (err) {
        console.warn('Using curated gadget catalogue data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Compute products currently in the battle arena
  const comparedProducts = useMemo(() => {
    return comparedIds.map(id => products.find(p => p.id === id) || products[0]);
  }, [comparedIds, products]);

  // Determine the Winner based on the selected need score
  const winnerIndex = useMemo(() => {
    let maxScore = -1;
    let winIdx = 0;
    comparedProducts.forEach((p, idx) => {
      const score = p?.scores?.[selectedNeed] || 90;
      if (score > maxScore) {
        maxScore = score;
        winIdx = idx;
      }
    });
    return winIdx;
  }, [comparedProducts, selectedNeed]);

  function handleSelectNeed(needId) {
    setSelectedNeed(needId);
    // Smooth scroll down to meja aduan
    const el = document.getElementById('meja-aduan');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function handleOpenSwap(slotIndex) {
    setActiveSlotToSwap(slotIndex);
    setModalOpen('swap-slot');
  }

  function handleSelectPhoneForSlot(productId) {
    setComparedIds(prev => {
      const next = [...prev];
      next[activeSlotToSwap] = productId;
      return next;
    });
    setModalOpen(null);
  }

  function addToCart(product) {
    setCartItems(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev;
      return [...prev, product];
    });
    setModalOpen('cart');
  }

  function removeFromCart(id) {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }

  function makeWhatsAppUrl(phoneName, price, cond) {
    const text = encodeURIComponent(
      `Halo Tim aduHP! Saya ingin order unit dari aduhp.com:\n\n` +
      `📱 Unit: ${phoneName}\n` +
      `📦 Kondisi: ${cond === 'baru' ? 'Baru BNIB Segel' : 'Second Certified Pre-Owned'}\n` +
      `💰 Harga: ${formatIDR(price)}\n\n` +
      `Mohon info stok fisik & nomor resi pengiriman se-Indonesia.`
    );
    return `https://wa.me/6281234567890?text=${text}`;
  }

  function makeCartCheckoutUrl() {
    const listText = cartItems.map((item, i) => `${i + 1}. ${item.name} (${formatIDR(item.price)})`).join('\n');
    const total = cartItems.reduce((acc, curr) => acc + (curr.price || 0), 0);
    const text = encodeURIComponent(
      `Halo Tim aduHP! Saya ingin checkout pesanan dari aduhp.com:\n\n` +
      listText +
      `\n\n💵 Total Pembayaran: ${formatIDR(total)}\n` +
      `Mohon panduan transfer manual PT & invoice garansi 40 titik cek.`
    );
    return `https://wa.me/6281234567890?text=${text}`;
  }

  // Filtered products for catalog modal
  const filteredCatalog = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = filterBrand === 'all' || p.brand.toLowerCase() === filterBrand.toLowerCase();
      const matchesBudget = !filterBudgetMax || p.price <= filterBudgetMax;
      return matchesSearch && matchesBrand && matchesBudget;
    });
  }, [products, searchQuery, filterBrand, filterBudgetMax]);

  return (
    <>
      {/* 1. Header Navbar */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            {/* Logo */}
            <Link href="/" className="brand-wrapper">
              <div className="brand-vs-box">
                VS
              </div>
              <div className="brand-meta">
                <div className="brand-title-row">
                  <span className="brand-name">AduHP</span>
                  <span className="brand-mvp-badge">MVP</span>
                </div>
                <span className="brand-tagline">Adu Spek, Adu Harga, Baru Beli</span>
              </div>
            </Link>

            {/* Nav Menu */}
            <nav className="nav-menu">
              <button 
                onClick={() => setModalOpen('katalog')} 
                className="nav-link nav-pill-katalog"
              >
                Katalog
              </button>

              <button 
                onClick={() => {
                  const el = document.getElementById('meja-aduan');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="nav-link"
              >
                <span>⚔️</span>
                <span>Adu HP</span>
              </button>

              <button 
                onClick={() => setModalOpen('cart')} 
                className="nav-link"
                style={{ position: 'relative' }}
              >
                <span>🛍️</span>
                <span>Keranjang</span>
                {cartItems.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: 'var(--accent-lime)',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 800,
                    borderRadius: '50%',
                    width: '17px',
                    height: '17px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {cartItems.length}
                  </span>
                )}
              </button>

              <a 
                href="https://dapur.aduhp.com" 
                target="_blank" 
                rel="noreferrer" 
                className="nav-link"
                title="Buka Admin Panel Rahasia dapur.aduhp.com"
              >
                <span>🛡️</span>
                <span>Admin Panel</span>
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="hero-section">
        <div className="container">
          {/* Badge Platform */}
          <div className="hero-badge-platform">
            <Sparkles size={14} />
            <span>SMART COMPARE & AI RECOMMENDATION PLATFORM</span>
          </div>

          {/* H1 Main Title */}
          <h1 className="hero-title">
            Bingung Pilih HP?<br />
            <span className="hero-highlight">Adu Dulu Baru Beli.</span> GRATIS
          </h1>

          {/* Subtext */}
          <p className="hero-desc">
            Nggak ada HP yang 100% sempurna. Yang ada cuma HP yang <strong>pas buat kebutuhan dan dompet lu</strong>. Adu 2-3 HP langsung secara objektif, tanpa sensor, no endorse!
          </p>

          {/* 2 CTA Buttons */}
          <div className="hero-cta-group">
            <button 
              onClick={() => {
                const el = document.getElementById('meja-aduan');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary-lime"
            >
              <span>⚔️ Buka Meja Aduan HP</span>
              <ArrowRight size={17} />
            </button>

            <button 
              onClick={() => setModalOpen('budget')}
              className="btn-secondary-dark"
            >
              <span>Cari Sesuai Budget</span>
            </button>
          </div>

          {/* 4 Trust Badges */}
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon-box">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="trust-title">No Payment Gateway</div>
                <div className="trust-desc">Transfer manual aman PT</div>
              </div>
            </div>

            <div className="trust-card">
              <div className="trust-icon-box">
                <Cpu size={22} />
              </div>
              <div>
                <div className="trust-title">Rule-Based AI</div>
                <div className="trust-desc">100% rumus transparan</div>
              </div>
            </div>

            <div className="trust-card">
              <div className="trust-icon-box">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="trust-title">Garansi 40 Titik Cek</div>
                <div className="trust-desc">Baru & Second Teruji</div>
              </div>
            </div>

            <div className="trust-card">
              <div className="trust-icon-box">
                <Truck size={22} />
              </div>
              <div>
                <div className="trust-title">Siap Kirim Se-Indonesia</div>
                <div className="trust-desc">Packing kayu & asuransi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LANGKAH 1 Section */}
      <section className="section-langkah">
        <div className="container">
          <div className="langkah-header">
            <h2 className="langkah-title">
              <span className="langkah-tag">LANGKAH 1:</span>
              Pilih Kebutuhan Utama HP Lu
            </h2>
            <div className="langkah-ai-hint">
              AI menyesuaikan bobot rumus skor
            </div>
          </div>

          {/* Grid 6 Kartu Kebutuhan */}
          <div className="needs-grid">
            {NEEDS_LIST.map((item) => {
              const isActive = selectedNeed === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectNeed(item.id)}
                  className={`need-card ${isActive ? 'active' : ''}`}
                >
                  <div className="need-title-row">
                    <span className="need-icon">{item.icon}</span>
                    <span className="need-label">{item.label}</span>
                  </div>
                  <p className="need-desc">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Meja Aduan HP (Interactive Battle Arena) */}
      <section id="meja-aduan" className="meja-aduan-section">
        <div className="container">
          <div className="meja-header">
            <div className="meja-title-wrapper">
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                ⚔️ Meja Aduan Spek & Harga
              </h2>
              <div className="meja-badge-pulse">
                <div className="pulse-dot"></div>
                <span>Kebutuhan: {NEEDS_LIST.find(n => n.id === selectedNeed)?.label}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setModalOpen('katalog')}
                className="btn-secondary-dark" 
                style={{ padding: '8px 16px', fontSize: '12.5px' }}
              >
                <span>+ Ganti Model HP</span>
              </button>
            </div>
          </div>

          {/* 3 HP Comparison Grid */}
          <div className="battle-arena-grid">
            {comparedProducts.map((phone, index) => {
              const isWinner = index === winnerIndex;
              const score = phone?.scores?.[selectedNeed] || (92 + index * 2);
              const imgUrl = phone?.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop';

              return (
                <div key={phone?.id || index} className={`battle-slot-card ${isWinner ? 'winner' : ''}`}>
                  {isWinner && (
                    <div className="winner-crown-badge">
                      <Award size={13} />
                      <span>REKOMENDASI AI #1</span>
                    </div>
                  )}

                  {/* Image */}
                  <div className="phone-img-container">
                    <img src={imgUrl} alt={phone?.name} className="phone-img" />
                  </div>

                  {/* Body Info */}
                  <div className="phone-info-body">
                    <div className="phone-brand-condition">
                      <span className="phone-brand-tag">{phone?.brand}</span>
                      <span className={`phone-condition-badge ${phone?.condition === 'baru' ? 'badge-baru' : 'badge-second'}`}>
                        {phone?.grade || (phone?.condition === 'baru' ? 'Baru BNIB' : 'Second Grade A+')}
                      </span>
                    </div>

                    <h3 className="phone-title">{phone?.name}</h3>

                    <div className="phone-price-row">
                      <span className="price-main">{formatIDR(phone?.price)}</span>
                      {phone?.original_price && (
                        <span className="price-strike">{formatIDR(phone?.original_price)}</span>
                      )}
                    </div>

                    {/* AI Score Bar */}
                    <div className="ai-score-container">
                      <div className="ai-score-top">
                        <span className="ai-score-label">Kecocokan {NEEDS_LIST.find(n => n.id === selectedNeed)?.label}</span>
                        <span className="ai-score-value">{score}%</span>
                      </div>
                      <div className="ai-progress-track">
                        <div 
                          className="ai-progress-fill" 
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Spec Comparison Matrix */}
                    <div className="spec-list">
                      <div className="spec-item">
                        <span className="spec-key">Chipset</span>
                        <span className="spec-val">{phone?.specs?.chipset || 'Flagship SoC'}</span>
                      </div>

                      <div className="spec-item">
                        <span className="spec-key">Layar & Hz</span>
                        <span className="spec-val">{phone?.specs?.display || 'OLED 120Hz'}</span>
                      </div>

                      <div className="spec-item">
                        <span className="spec-key">Baterai & Daya</span>
                        <span className="spec-val">{phone?.specs?.battery || 'Fast Charging'}</span>
                      </div>

                      <div className="spec-item">
                        <span className="spec-key">Distributor Resmi</span>
                        <span className="spec-val" style={{ color: 'var(--accent-lime)' }}>
                          {phone?.official_distributor || 'Resmi Indonesia'}
                        </span>
                      </div>

                      {phone?.battery_health && (
                        <div className="spec-item">
                          <span className="spec-key">Battery Health</span>
                          <span className="spec-val" style={{ color: '#34d399' }}>
                            {phone.battery_health}% Original Sehat
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="card-actions-row">
                      <button
                        onClick={() => handleOpenSwap(index)}
                        className="btn-ganti-hp"
                        title="Ganti slot HP ini dengan model lain"
                      >
                        <RefreshCw size={13} />
                        <span>Ganti HP</span>
                      </button>

                      <a
                        href={makeWhatsAppUrl(phone?.name, phone?.price, phone?.condition)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-order-wa"
                      >
                        <MessageCircle size={14} />
                        <span>Beli (WA)</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Add All Banner */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(198, 255, 0, 0.08) 0%, rgba(20, 20, 20, 0.8) 100%)',
            border: '1px solid var(--border-lime)',
            borderRadius: '16px',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                Belum yakin? Mau konsultasi langsung dengan Teknisi aduHP?
              </div>
              <p style={{ fontSize: '13px', color: '#999' }}>
                Tanya detail IMEI, hasil 40 titik inspeksi QC, foto asli fisik unit, atau nego packing kayu gratis.
              </p>
            </div>

            <a
              href="https://wa.me/6281234567890?text=Halo%20Teknisi%20aduHP!%20Saya%20mau%20konsultasi%20hasil%20aduan%20HP%20di%20aduhp.com"
              target="_blank"
              rel="noreferrer"
              className="btn-primary-lime"
              style={{ padding: '12px 24px', fontSize: '13.5px' }}
            >
              <span>💬 Chat Teknisi Sekarang</span>
            </a>
          </div>
        </div>
      </section>

      {/* 5. Modal: Katalog Produk Lengkap */}
      {modalOpen === 'katalog' && (
        <div className="modal-overlay" onClick={() => setModalOpen(null)}>
          <div className="modal-content-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={20} color="var(--accent-lime)" />
                <h3 className="modal-title">Katalog Gadget aduHP (Stok Real-Time)</h3>
              </div>
              <button onClick={() => setModalOpen(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Search & Filter */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari iPhone, Galaxy, Xiaomi..."
                    style={{
                      width: '100%',
                      background: '#000',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '8px',
                      padding: '10px 14px 10px 36px',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all', 'Apple', 'Samsung', 'Xiaomi'].map(b => (
                    <button
                      key={b}
                      onClick={() => setFilterBrand(b)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: filterBrand === b ? '1px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                        background: filterBrand === b ? 'rgba(198, 255, 0, 0.1)' : '#181818',
                        color: filterBrand === b ? 'var(--accent-lime)' : '#aaa',
                        cursor: 'pointer'
                      }}
                    >
                      {b === 'all' ? 'Semua Brand' : b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredCatalog.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#161616',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      gap: '14px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img 
                        src={item.images?.[0]} 
                        alt={item.name} 
                        style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#000', borderRadius: '8px', padding: '4px' }} 
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{item.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#888', marginTop: '2px' }}>
                          {item.grade} • {item.specs?.chipset}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--accent-lime)', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '15px' }}>
                          {formatIDR(item.price)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#34d399' }}>Tersedia {item.stock || 1} Unit</div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            handleSelectPhoneForSlot(item.id);
                            setModalOpen(null);
                          }}
                          className="btn-secondary-dark"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          ⚔️ Masukkan Meja Adu
                        </button>

                        <button
                          onClick={() => addToCart(item)}
                          className="btn-primary-lime"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                          + Beli
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Swap Slot Phone */}
      {modalOpen === 'swap-slot' && (
        <div className="modal-overlay" onClick={() => setModalOpen(null)}>
          <div className="modal-content-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Ganti HP di Kolom #{activeSlotToSwap + 1}</h3>
              <button onClick={() => setModalOpen(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
                Pilih salah satu gadget di bawah ini untuk diadu speknya di Meja Aduan:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {products.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPhoneForSlot(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: comparedIds.includes(p.id) ? 'rgba(198, 255, 0, 0.05)' : '#161616',
                      border: comparedIds.includes(p.id) ? '1px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={p.images?.[0]} alt={p.name} style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                      <div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: '13.5px' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: '#777' }}>{p.specs?.chipset} • {p.grade}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'var(--accent-lime)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {formatIDR(p.price)}
                      </span>
                      <button className="btn-secondary-dark" style={{ padding: '4px 10px', fontSize: '11px' }}>
                        Pilih
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Cari Sesuai Budget */}
      {modalOpen === 'budget' && (
        <div className="modal-overlay" onClick={() => setModalOpen(null)}>
          <div className="modal-content-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cari HP Sesuai Budget Lu</h3>
              <button onClick={() => setModalOpen(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: '< Rp 10 Juta', max: 10000000, desc: 'Flagship Killer & Second Mulus Grade A+' },
                  { label: 'Rp 10 - 20 Juta', max: 20000000, desc: 'Pro Performance, Kamera OIS Tajam' },
                  { label: '> Rp 20 Juta', max: 50000000, desc: 'Ultra Flagship BNIB Segel Resmi' }
                ].map((b, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setFilterBudgetMax(b.max);
                      setModalOpen('katalog');
                    }}
                    style={{
                      background: '#161616',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '18px 14px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ color: 'var(--accent-lime)', fontWeight: 800, fontSize: '16px', marginBottom: '6px' }}>
                      {b.label}
                    </div>
                    <p style={{ fontSize: '11px', color: '#888' }}>{b.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setFilterBudgetMax(null);
                    setModalOpen('katalog');
                  }}
                  className="btn-secondary-dark"
                >
                  Lihat Semua Rentang Harga
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Drawer: Keranjang */}
      {modalOpen === 'cart' && (
        <div className="modal-overlay" onClick={() => setModalOpen(null)}>
          <div className="modal-content-box" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color="var(--accent-lime)" />
                <h3 className="modal-title">Keranjang Belanja ({cartItems.length})</h3>
              </div>
              <button onClick={() => setModalOpen(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#777' }}>
                  <ShoppingBag size={48} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                  <p>Keranjang masih kosong.</p>
                  <button 
                    onClick={() => setModalOpen('katalog')} 
                    className="btn-primary-lime"
                    style={{ marginTop: '16px', fontSize: '12.5px', padding: '8px 18px' }}
                  >
                    Pilih HP dari Katalog
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#161616',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '12px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={item.images?.[0]} alt={item.name} style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                        <div>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>{item.name}</div>
                          <div style={{ color: 'var(--accent-lime)', fontSize: '12px', fontWeight: 600 }}>{formatIDR(item.price)}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                        title="Hapus dari keranjang"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Summary */}
                  <div style={{
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#999', fontSize: '14px' }}>Subtotal:</span>
                    <span style={{ color: 'var(--accent-lime)', fontSize: '20px', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                      {formatIDR(cartItems.reduce((acc, curr) => acc + (curr.price || 0), 0))}
                    </span>
                  </div>

                  <a
                    href={makeCartCheckoutUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary-lime"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                  >
                    <span>Checkout via WhatsApp Resmi ➔</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="brand-vs-box" style={{ width: '30px', height: '30px', fontSize: '13px' }}>
                VS
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '15px' }}>AduHP 24/7</div>
                <div style={{ fontSize: '11px', color: '#666' }}>Adu Spek, Adu Harga, Baru Beli.</div>
              </div>
            </div>

            <div className="footer-copy">
              © {new Date().getFullYear()} aduhp.com • Terhubung langsung dengan Gudang Stok Real-Time{' '}
              <a href="https://dapur.aduhp.com" target="_blank" rel="noreferrer" className="footer-link-dapur">
                dapur.aduhp.com ↗
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
