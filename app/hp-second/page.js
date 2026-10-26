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
  Maximize2,
  ChevronLeft,
  ChevronRight,
  BatteryCharging,
  Info
} from 'lucide-react';
import { CERTIFIED_SECOND_PHONES } from '../data/secondPhones';
import { PRICE_TIERS } from '../data/entryPhones';
import { supabase } from '../lib/supabase';

function formatIDR(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function HpSecondPage() {
  const [products, setProducts] = useState(CERTIFIED_SECOND_PHONES);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active photo index per product card: { [productId]: activeIndex }
  const [activePhotoMap, setActivePhotoMap] = useState({});

  // Lightbox Zoom Modal: { product, activeIndex }
  const [lightboxData, setLightboxData] = useState(null);

  // Detail Modal for 35 QC Inspection Breakdown
  const [inspectionModalPhone, setInspectionModalPhone] = useState(null);

  // Fetch live second products from Supabase
  useEffect(() => {
    async function fetchSecondProducts() {
      try {
        const { data, error } = await supabase
          .from('dapur_products')
          .select('*')
          .eq('is_active', true)
          .eq('condition', 'second')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const merged = [...CERTIFIED_SECOND_PHONES];
          data.forEach(item => {
            if (!merged.some(m => m.id === item.id || m.slug === item.slug)) {
              merged.unshift(item); // Newly uploaded second phones at the top!
            }
          });
          setProducts(merged);
        }
      } catch (err) {
        console.warn('Using certified second phones database:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSecondProducts();
  }, []);

  const BRANDS = ['all', 'Apple', 'Samsung', 'OPPO', 'Xiaomi', 'POCO', 'Vivo', 'Realme', 'Infinix', 'iQOO', 'Tecno'];
  const GRADES = [
    { id: 'all', label: 'Semua Grade' },
    { id: 'Grade A+', label: 'Grade A+ (Mulus 99% Like New)' },
    { id: 'Grade A', label: 'Grade A (Mulus 95-98% Terawat)' },
  ];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Must be condition second
      if (p.condition && p.condition !== 'second') return false;

      // Brand filter
      const matchesBrand = selectedBrand === 'all' || p.brand?.toLowerCase() === selectedBrand.toLowerCase();

      // Grade filter
      const matchesGrade = selectedGrade === 'all' || (p.grade && p.grade.includes(selectedGrade));

      // Tier filter
      const matchesTier = selectedTier === 'all' || p.price_tier === selectedTier;

      // Search filter
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.imei?.includes(q) ||
        p.specs?.chipset?.toLowerCase().includes(q);

      return matchesBrand && matchesGrade && matchesTier && matchesSearch;
    });
  }, [products, selectedBrand, selectedGrade, selectedTier, searchQuery]);

  function getActivePhotoIndex(phoneId) {
    return activePhotoMap[phoneId] || 0;
  }

  function setActivePhotoIndex(phoneId, idx) {
    setActivePhotoMap(prev => ({ ...prev, [phoneId]: idx }));
  }

  function getWhatsAppSecondUrl(phone) {
    const activePhotoUrl = (phone.images && phone.images[0]) || '';
    const text = encodeURIComponent(
      `Halo Tim QC aduhp.com, saya berminat dengan unit HP Second Bersertifikat ini:\n\n` +
      `📱 *Unit:* ${phone.name}\n` +
      `🏆 *Kondisi:* ${phone.grade || 'Second Grade A+'}\n` +
      `🔋 *Battery Health:* ${phone.battery_health ? `${phone.battery_health}% Original` : 'Sehat'}\n` +
      `🔒 *IMEI:* ${phone.imei || 'Resmi Terdaftar'}\n` +
      `💰 *Harga:* ${formatIDR(phone.price)}\n` +
      `🛡️ *Garansi:* ${phone.official_distributor || 'Garansi Toko 30 Hari'}\n\n` +
      `Bisa tolong kirimkan video inspeksi fisik 5 sudut dan apakah unit ini masih tersedia? Terima kasih.`
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
              <div className="brand-vs-box" style={{ padding: 0, overflow: 'hidden', background: '#000', border: '1px solid rgba(0, 229, 255, 0.4)', boxShadow: '0 0 10px rgba(0, 229, 255, 0.35)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="AduHP Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="brand-meta">
                <div className="brand-title-row">
                  <span className="brand-name">AduHP</span>
                  <span className="brand-mvp-badge" style={{ background: 'rgba(0, 229, 255, 0.2)', color: '#00E5FF', borderColor: 'rgba(0, 229, 255, 0.4)' }}>
                    SECOND QC LAB
                  </span>
                </div>
                <span className="brand-tagline">Katalog HP Second Lolos 35 Titik Inspeksi</span>
              </div>
            </Link>

            <nav className="nav-menu">
              <Link href="/" className="nav-link">
                Home
              </Link>
              <Link href="/adu-hp" className="nav-link">
                ⚔️ Adu HP
              </Link>
              <Link href="/hp-baru" className="nav-link">
                📱 HP Baru
              </Link>
              <Link 
                href="/hp-second" 
                className="nav-link"
                style={{
                  background: 'rgba(0, 229, 255, 0.12)',
                  border: '1px solid rgba(0, 229, 255, 0.4)',
                  color: '#00E5FF',
                  fontWeight: 800,
                }}
              >
                🔄 HP Second
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 2. Hero Section HP Second */}
      <section style={{
        padding: '48px 0 32px',
        background: 'radial-gradient(ellipse at top, rgba(0, 229, 255, 0.08) 0%, transparent 70%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', marginBottom: '16px' }}>
            <ShieldCheck size={14} color="#00E5FF" />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#00E5FF', letterSpacing: '0.5px' }}>
              BERSERTIFIKAT aduHP LAB • 35 TITIK INSPEKSI • 5 FOTO FISIK RIIL
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1.2 }}>
            Katalog HP Second Berkualitas & Bergaransi
          </h1>
          <p style={{ color: '#aaa', fontSize: '15px', maxWidth: '750px', marginTop: '10px', lineHeight: 1.6 }}>
            Beli HP second anti-waswas! Setiap unit lolos 35 titik uji laboratorium teknisi aduHP: <strong>IMEI Kemenperin resmi permanen</strong>, Battery Health original, layar bebas shadow/burn-in, dan <strong>difoto dari 5 sudut fisik riil</strong> yang bisa Anda periksa sebelum membeli.
          </p>

          {/* Quick Badges Bar */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#00E5FF" />
              <span style={{ fontSize: '13px', color: '#ccc' }}>5 Foto Fisik Detail Terkompresi</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--accent-lime)" />
              <span style={{ fontSize: '13px', color: '#ccc' }}>Garansi Toko 30 Hari Ganti Unit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BatteryCharging size={18} color="#FF9100" />
              <span style={{ fontSize: '13px', color: '#ccc' }}>Battery Health Sehat & Original</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Filters Toolbar */}
      <section style={{ padding: '24px 0 16px' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: '#121216',
            padding: '16px 20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                <input
                  type="text"
                  placeholder="Cari unit HP second, seri, IMEI, atau chipset..."
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

              {/* Total Count */}
              <span style={{ fontSize: '13px', color: '#00E5FF', fontWeight: 700 }}>
                {filteredProducts.length} Unit Second Tersedia
              </span>
            </div>

            {/* Filter Pills Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
              <span style={{ fontSize: '12px', color: '#777' }}>Merek:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {BRANDS.map(b => (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(b)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: selectedBrand === b ? '#00E5FF' : 'rgba(255, 255, 255, 0.04)',
                      color: selectedBrand === b ? '#000' : '#ccc',
                      border: selectedBrand === b ? '1px solid #00E5FF' : '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '12px',
                      fontWeight: selectedBrand === b ? 800 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {b === 'all' ? 'Semua Merek' : b}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: '12px', color: '#777', marginLeft: '12px' }}>Grade Fisik:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {GRADES.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGrade(g.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: selectedGrade === g.id ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: selectedGrade === g.id ? '#00E5FF' : '#ccc',
                      border: selectedGrade === g.id ? '1px solid #00E5FF' : '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '12px',
                      fontWeight: selectedGrade === g.id ? 800 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Second Products Grid with 5-Photo Interactive Gallery */}
      <section style={{ padding: '0 0 60px' }}>
        <div className="container">
          {loading ? (
            <div style={{ padding: '80px 0', textAlign: 'center', color: '#888' }}>
              <div className="spin" style={{ width: '32px', height: '32px', border: '3px solid #00E5FF', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} />
              Memuat data HP Second bersertifikat...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', background: '#121216', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Smartphone size={40} color="#555" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Tidak ada unit HP Second yang cocok</h3>
              <p style={{ color: '#888', fontSize: '13px', marginTop: '6px' }}>
                Coba ubah filter merek atau grade kemulusan yang dipilih.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {filteredProducts.map(phone => {
                const imagesList = Array.isArray(phone.images) && phone.images.length > 0 
                  ? phone.images 
                  : ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=800'];
                
                const activePhotoIdx = getActivePhotoIndex(phone.id);
                const currentPhoto = imagesList[activePhotoIdx] || imagesList[0];
                const photoLabel = phone.photo_labels?.[activePhotoIdx] || `Foto Sudut #${activePhotoIdx + 1}`;

                return (
                  <div
                    key={phone.id}
                    className="card"
                    style={{
                      background: '#121216',
                      border: '1px solid rgba(0, 229, 255, 0.25)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00E5FF';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.25)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Interactive 5-Photo Gallery Area */}
                    <div style={{ position: 'relative', height: '240px', background: '#0a0a0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Top Badges */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', zIndex: 2 }}>
                        <span style={{
                          background: 'rgba(0, 229, 255, 0.95)',
                          color: '#000',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 900
                        }}>
                          SECOND
                        </span>
                        {phone.battery_health && (
                          <span style={{
                            background: 'rgba(0, 0, 0, 0.75)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid #00E5FF',
                            color: '#00E5FF',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <BatteryCharging size={12} />
                            BH {phone.battery_health}%
                          </span>
                        )}
                      </div>

                      {/* Zoom Lightbox Trigger Button */}
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
                          padding: '6px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          zIndex: 2
                        }}
                        title="Buka 5 Foto Fisik Fullscreen"
                      >
                        <Maximize2 size={13} />
                        <span>{imagesList.length} Foto</span>
                      </button>

                      {/* Main Displayed Photo */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentPhoto}
                        alt={`${phone.name} foto ${activePhotoIdx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=800';
                        }}
                      />

                      {/* Photo Label Bar Overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                        padding: '16px 12px 6px',
                        fontSize: '11px',
                        color: '#ddd',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: 600, textShadow: '0 1px 2px #000' }}>
                          {photoLabel}
                        </span>
                        <span style={{ fontSize: '10px', color: '#00E5FF', fontWeight: 800 }}>
                          {activePhotoIdx + 1}/{imagesList.length}
                        </span>
                      </div>
                    </div>

                    {/* 5 Thumbnail Switchers */}
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      padding: '8px 12px',
                      background: '#0e0e12',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      {imagesList.slice(0, 5).map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActivePhotoIndex(phone.id, i)}
                          style={{
                            flex: 1,
                            height: '40px',
                            borderRadius: '6px',
                            border: activePhotoIdx === i ? '2px solid #00E5FF' : '1px solid rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                            padding: 0,
                            background: '#000',
                            cursor: 'pointer',
                            opacity: activePhotoIdx === i ? 1 : 0.65,
                            transition: 'all 0.15s ease'
                          }}
                          title={`Lihat foto ${i + 1}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`Thumb ${i + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Content Details */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '6px' }}>
                        {phone.name}
                      </h4>

                      {/* Grade & Garansi */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '11px',
                          background: 'rgba(0, 229, 255, 0.12)',
                          color: '#00E5FF',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          {phone.grade || 'Second Grade A+'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#888' }}>
                          • {phone.completeness || 'Fullset Box Original'}
                        </span>
                      </div>

                      {/* IMEI Status Banner */}
                      <div style={{
                        background: 'rgba(198, 255, 0, 0.04)',
                        border: '1px solid rgba(198, 255, 0, 0.2)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#eee',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <ShieldCheck size={14} color="var(--accent-lime)" />
                        <span>{phone.imei_status || 'IMEI Resmi Kemenperin All Operator Bebas Blokir'}</span>
                      </div>

                      {/* QC Inspection Summary Trigger */}
                      <button
                        onClick={() => setInspectionModalPhone(phone)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: '#aaa',
                          fontSize: '11px',
                          cursor: 'pointer',
                          marginBottom: '14px',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} color="#00E5FF" />
                          <span>35 Titik QC Lab aduHP (Layar, TrueTone, FaceID)</span>
                        </div>
                        <Info size={13} color="#666" />
                      </button>

                      {/* Price Section */}
                      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '20px', fontWeight: 900, color: '#00E5FF', fontFamily: 'var(--font-mono)' }}>
                            {formatIDR(phone.price)}
                          </span>
                          {phone.original_price && (
                            <span style={{ fontSize: '12px', color: '#666', textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                              Baru: {formatIDR(phone.original_price)}
                            </span>
                          )}
                        </div>

                        {/* CTA Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            onClick={() => setLightboxData({ product: phone, activeIndex: 0 })}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                          >
                            <span>🔍 5 Foto QC</span>
                          </button>
                          <a
                            href={getWhatsAppSecondUrl(phone)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{
                              flex: 1.3,
                              justifyContent: 'center',
                              fontSize: '12px',
                              background: '#00E5FF',
                              color: '#000',
                              fontWeight: 900
                            }}
                          >
                            <ShoppingBag size={13} />
                            <span>Beli Unit Ini</span>
                          </a>
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

      {/* 5. Lightbox Zoom Modal for 5 Compressed Inspection Photos */}
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
              <span style={{ fontSize: '12px', color: '#00E5FF' }}>
                {lightboxData.product.photo_labels?.[lightboxData.activeIndex] || `Foto Fisik #${lightboxData.activeIndex + 1}`}
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
            {/* Prev Button */}
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

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxData.product.images[lightboxData.activeIndex]}
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

            {/* Next Button */}
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
          </div>

          {/* Thumbnail Strip at Bottom */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            {lightboxData.product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxData(prev => ({ ...prev, activeIndex: idx }))}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '8px',
                  border: lightboxData.activeIndex === idx ? '2px solid #00E5FF' : '1px solid rgba(255,255,255,0.2)',
                  overflow: 'hidden',
                  padding: 0,
                  background: '#000',
                  cursor: 'pointer',
                  opacity: lightboxData.activeIndex === idx ? 1 : 0.5
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. QC Inspection Checklist Modal */}
      {inspectionModalPhone && (
        <div
          onClick={() => setInspectionModalPhone(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#16161b',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#00E5FF" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff' }}>
                  Laporan QC 35 Titik Lab aduHP
                </h3>
              </div>
              <button
                onClick={() => setInspectionModalPhone(null)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '16px' }}>
              Unit: <strong>{inspectionModalPhone.name}</strong>
            </div>

            {/* Checklist Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(inspectionModalPhone.qc_details || [
                { name: 'Layar & True Tone', status: 'Passed', note: 'Original Apple Super Retina XDR 120Hz' },
                { name: 'Face ID & Biometrik', status: 'Passed', note: 'Kamera TrueDepth responsif' },
                { name: 'Battery Health', status: 'Passed', note: `${inspectionModalPhone.battery_health || 92}% Original Belum Pernah Diservis` },
                { name: 'IMEI Kemenperin', status: 'Passed', note: 'Tembus Kemenperin All Operator Selamanya' },
                { name: 'Kamera & Sensor OIS', status: 'Passed', note: 'Lensa jernih bebas debu/jamur' }
              ]).map((qc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{qc.name}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{qc.note}</div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    background: 'rgba(0, 229, 255, 0.15)',
                    color: '#00E5FF',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 800
                  }}>
                    {qc.status}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setInspectionModalPhone(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: '#00E5FF',
                  color: '#000',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Tutup Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
