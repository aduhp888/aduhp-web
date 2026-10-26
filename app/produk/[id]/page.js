'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Cpu, 
  Flame, 
  ShoppingBag, 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Zap, 
  Layers, 
  Activity, 
  Smartphone, 
  BatteryCharging, 
  Camera, 
  Radio, 
  Truck, 
  Building2, 
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  formatIDR, 
  CORPORATE_ACCOUNTS, 
  PHOTO_SLOT_DESCRIPTIONS, 
  getProductVariants, 
  getProductColors 
} from '../../lib/utils';

export default function ProductDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const productId = params?.id;
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery state (0 to 4 for 5 slots)
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Variant Selection State
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'qc' | 'garansi'

  // Fetch product from Supabase or fallback
  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        let query = supabase.from('dapur_products').select('*');
        // Check if productId is UUID or slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
        if (isUuid) {
          query = query.eq('id', productId);
        } else {
          query = query.or(`slug.eq.${productId},id.eq.${productId}`);
        }

        const { data, error } = await query.single();
        if (data) {
          setProduct(data);
          const variants = getProductVariants(data);
          setSelectedVariant(variants[0]);
          const colors = getProductColors(data);
          setSelectedColor(colors[0]?.name || 'Black');
        } else {
          // Fallback mock product jika ID tidak ditemukan di DB
          setupFallbackProduct();
        }
      } catch (err) {
        console.warn('Fallback product detail:', err);
        setupFallbackProduct();
      } finally {
        setLoading(false);
      }
    }

    function setupFallbackProduct() {
      const fallback = {
        id: productId || 'demo-poco-f6',
        name: 'POCO F6 5G (Flagship Killer)',
        slug: 'poco-f6-5g',
        brand: 'POCO',
        condition: 'baru',
        grade: '100% Baru (BNIB Segel)',
        badge: '🟢 Dijual Resmi oleh aduHP',
        official_distributor: 'Garansi Resmi TAM Indonesia 15 Bulan',
        imei: '862019068819201 (Terdaftar Kemenperin)',
        price: 5499000,
        original_price: 5999000,
        stock: 8,
        ram_gb: 12,
        storage_gb: 512,
        color: 'Titanium Black',
        description: 'Smartphone Flagship Killer dengan Snapdragon 8s Gen 3, Layar CrystalRes 1.5K 120Hz Flow AMOLED, Kamera 50MP Sony IMX882 OIS, dan 90W Turbo Charge.',
        images: [
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=80'
        ],
        specs: {
          chipset: 'Snapdragon 8s Gen 3 (4nm)',
          display: '6.67" CrystalRes 1.5K 120Hz Flow AMOLED (2400 nits)',
          battery: '5000 mAh • 90W Turbo Charge (100% in 35 min)',
          camera: '50MP Sony IMX882 OIS + 8MP Ultra-wide • Selfie 20MP',
          os: 'Xiaomi HyperOS berbasis Android 14',
          network: 'Dual SIM 5G All Operator Indonesia',
          nfc: 'Multifunctional NFC Aktif'
        },
        antutu: {
          total: 1532000,
          cpu: 395000,
          gpu: 520000,
          memory: 320000,
          ux: 297000,
          tier: 'Flagship Killer Tier 1'
        },
        gaming_fps: {
          mlbb: '120 FPS Ultra Mulus',
          pubg: '90 FPS Smooth Extreme',
          genshin: '58 FPS Highest 60'
        }
      };
      setProduct(fallback);
      const variants = getProductVariants(fallback);
      setSelectedVariant(variants[0]);
      const colors = getProductColors(fallback);
      setSelectedColor(colors[0]?.name || 'Black');
    }

    if (productId) {
      fetchDetail();
    }
  }, [productId]);

  // Normalize 5 Images Array
  const photoGallery = useMemo(() => {
    if (!product) return [];
    const imgs = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
    
    // Ensure we have 5 slots
    return PHOTO_SLOT_DESCRIPTIONS.map((slot, index) => {
      const url = imgs[index] || imgs[0] || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80';
      return {
        ...slot,
        url,
        hasImage: !!imgs[index]
      };
    });
  }, [product]);

  const variants = useMemo(() => {
    if (!product) return [];
    return getProductVariants(product);
  }, [product]);

  const colors = useMemo(() => {
    if (!product) return [];
    return getProductColors(product);
  }, [product]);

  // Calculate current price based on selected variant
  const currentPrice = selectedVariant?.price || product?.price || 0;
  const originalPrice = product?.original_price || (currentPrice > 0 ? Math.round(currentPrice * 1.1) : 0);
  const discountPercent = originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  // Checkout navigation
  const handleProceedToCheckout = () => {
    if (!product) return;
    const ram = selectedVariant?.ram || product.ram_gb || 8;
    const storage = selectedVariant?.storage || product.storage_gb || 256;
    const color = selectedColor || product.color || 'Standard';
    
    const query = new URLSearchParams({
      productId: product.id,
      name: product.name,
      price: currentPrice.toString(),
      ram: ram.toString(),
      storage: storage.toString(),
      color: color,
      condition: product.condition || 'baru',
      image: photoGallery[0]?.url || ''
    }).toString();

    router.push(`/checkout?${query}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px', border: '3px solid rgba(198,255,0,0.2)', borderTopColor: 'var(--accent-lime)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#aaa', fontSize: '14px' }}>Memuat spesifikasi lengkap & 5 foto fisik...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>Produk Tidak Ditemukan</h2>
        <Link href="/hp-baru" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const isConditionSecond = product.condition === 'second';
  const themeColor = isConditionSecond ? '#00E5FF' : 'var(--accent-lime)';

  return (
    <div style={{ paddingBottom: '90px' }}>
      {/* 1. Header Bar Navigation */}
      <header className="site-header">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button 
                onClick={() => router.back()} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  color: '#fff', 
                  borderRadius: '8px', 
                  padding: '8px 12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Kembali</span>
              </button>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                  adu<span style={{ color: 'var(--accent-lime)' }}>HP</span><span style={{ fontSize: '12px', color: '#888', marginLeft: '6px' }}>STORE</span>
                </span>
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'rgba(198, 255, 0, 0.08)', 
                border: '1px solid rgba(198, 255, 0, 0.25)', 
                padding: '6px 12px', 
                borderRadius: '100px',
                fontSize: '12px',
                color: 'var(--accent-lime)',
                fontWeight: 700
              }}>
                <Building2 size={14} />
                <span>Pembayaran Sah ke Rekening PT</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Product Content */}
      <main className="container" style={{ marginTop: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '36px',
          alignItems: 'start'
        }}>
          {/* LEFT COLUMN: 5-PHOTO GALLERY VIEWER */}
          <div>
            {/* Main Active Image Display */}
            <div style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#121216',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              aspectRatio: '1 / 1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}>
              {/* Badge Slot Info */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                zIndex: 3,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#fff',
                fontWeight: 600
              }}>
                <span style={{ color: themeColor }}>●</span>
                <span>Foto {activePhotoIdx + 1}/5: {photoGallery[activePhotoIdx]?.title}</span>
              </div>

              {/* Fullscreen Zoom Trigger */}
              <button
                onClick={() => { setZoomLevel(1); setIsLightboxOpen(true); }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  zIndex: 3,
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
                title="Buka Zoom Lightbox HD"
              >
                <Maximize2 size={14} />
                <span>Perbesar HD</span>
              </button>

              {/* Nav Chevrons */}
              <button
                onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photoGallery.length - 1))}
                style={{
                  position: 'absolute',
                  left: '12px',
                  zIndex: 3,
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={() => setActivePhotoIdx((prev) => (prev < photoGallery.length - 1 ? prev + 1 : 0))}
                style={{
                  position: 'absolute',
                  right: '12px',
                  zIndex: 3,
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronRight size={20} />
              </button>

              {/* Main Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoGallery[activePhotoIdx]?.url}
                alt={`${product.name} - ${photoGallery[activePhotoIdx]?.title}`}
                style={{
                  width: '92%',
                  height: '92%',
                  objectFit: 'contain',
                  transition: 'transform 0.25s ease'
                }}
              />

              {/* Bottom Caption Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                background: 'rgba(10, 10, 14, 0.85)',
                backdropFilter: 'blur(6px)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#bbb',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <strong style={{ color: '#fff' }}>Detail: </strong>
                {photoGallery[activePhotoIdx]?.desc}
              </div>
            </div>

            {/* 5 Thumbnail Slots Selector */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '10px',
              marginTop: '14px'
            }}>
              {photoGallery.map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  style={{
                    background: '#16161c',
                    borderRadius: '10px',
                    padding: '4px',
                    border: activePhotoIdx === idx ? `2px solid ${themeColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                    aspectRatio: '1 / 1',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title={slot.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot.url}
                    alt={slot.title}
                    style={{ width: '100%', height: '80%', objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '9px', fontWeight: 700, color: activePhotoIdx === idx ? themeColor : '#777', marginTop: '2px' }}>
                    Foto {idx + 1}
                  </span>
                </button>
              ))}
            </div>

            {/* Guarantees Box */}
            <div style={{
              marginTop: '24px',
              background: '#121216',
              borderRadius: '14px',
              padding: '18px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <h5 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                🛡️ Jaminan Standar Keamanan Transaksi aduHP
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc' }}>
                  <ShieldCheck size={16} color={themeColor} />
                  <span>Rekening Giro Resmi PT</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc' }}>
                  <Truck size={16} color={themeColor} />
                  <span>Packing Kayu & Bubble Tebal</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc' }}>
                  <Award size={16} color={themeColor} />
                  <span>Garansi IMEI Anti-Blokir</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc' }}>
                  <Sparkles size={16} color={themeColor} />
                  <span>{product.official_distributor || 'Garansi Distributor Resmi'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SPECS, VARIANT SELECTION & CHECKOUT ACTION */}
          <div>
            {/* Condition Badge & Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{
                background: isConditionSecond ? 'rgba(0, 229, 255, 0.15)' : 'rgba(198, 255, 0, 0.15)',
                color: themeColor,
                border: `1px solid ${themeColor}`,
                padding: '4px 10px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}>
                {isConditionSecond ? '🔄 CERTIFIED SECOND QC' : '📱 100% BARU BNIB RESMI'}
              </span>

              <span style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#aaa',
                padding: '4px 10px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                Brand: {product.brand}
              </span>

              {product.stock <= 5 && product.stock > 0 && (
                <span style={{
                  background: 'rgba(255, 77, 77, 0.15)',
                  color: '#FF6B6B',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  🔥 Sisa {product.stock} Unit!
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: '12px' }}>
              {product.name}
            </h1>

            {/* Distributor & IMEI Subtitle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#aaa', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color={themeColor} />
                <span>{product.official_distributor || 'Garansi Resmi Distributor Indonesia'}</span>
              </div>
              {product.imei && (
                <span style={{ color: '#666' }}>• IMEI: {product.imei}</span>
              )}
            </div>

            {/* Price Box */}
            <div style={{
              background: '#14141a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                Harga Resmi Pembelian (Sudah Termasuk PPN):
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  color: themeColor,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.5px'
                }}>
                  {formatIDR(currentPrice)}
                </span>
                {originalPrice > currentPrice && (
                  <>
                    <span style={{ fontSize: '16px', color: '#777', textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                      {formatIDR(originalPrice)}
                    </span>
                    <span style={{
                      background: 'rgba(255, 59, 48, 0.15)',
                      color: '#FF453A',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 800
                    }}>
                      Hemat {discountPercent}%
                    </span>
                  </>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>
                Transfer langsung ke <strong>Rekening Resmi PT ADU HP INDONESIA</strong>. Dilindungi jaminan pengiriman berasuransi.
              </p>
            </div>

            {/* RAM & STORAGE VARIANT SELECTOR */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  💾 Pilih Varian Kapasitas (RAM & Storage):
                </label>
                <span style={{ fontSize: '12px', color: themeColor, fontWeight: 700 }}>
                  Terpilih: {selectedVariant?.label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {variants.map((v, i) => {
                  const isSelected = selectedVariant?.label === v.label;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(198, 255, 0, 0.08)' : '#16161c',
                        border: isSelected ? `2px solid ${themeColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#fff' : '#ccc' }}>
                        {v.label}
                      </div>
                      <div style={{ fontSize: '12px', color: isSelected ? themeColor : '#888', fontWeight: 700, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {formatIDR(v.price)}
                      </div>
                      {v.isDefault && (
                        <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>Varian Standar</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLOR SELECTION */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                🎨 Pilihan Warna Unit: <span style={{ color: '#ccc', fontWeight: 600 }}>{selectedColor}</span>
              </label>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {colors.map((c, i) => {
                  const isSelected = selectedColor === c.name;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(255, 255, 255, 0.1)' : '#16161c',
                        border: isSelected ? `2px solid ${themeColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: c.hex, border: '1px solid rgba(255,255,255,0.3)' }} />
                      <span>{c.name}</span>
                      {isSelected && <Check size={14} color={themeColor} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTION CTA BUTTONS */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <button
                onClick={handleProceedToCheckout}
                className="btn btn-primary"
                style={{
                  flex: '2 1 240px',
                  justifyContent: 'center',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: 900,
                  background: themeColor,
                  color: '#000',
                  boxShadow: `0 8px 24px rgba(198, 255, 0, 0.25)`
                }}
              >
                <ShoppingBag size={20} />
                <span>Beli Sekarang (Lanjut Checkout)</span>
              </button>

              <Link
                href={`/adu-hp?slot1=${product.id}`}
                className="btn btn-secondary"
                style={{
                  flex: '1 1 140px',
                  justifyContent: 'center',
                  padding: '16px 20px',
                  fontSize: '14px',
                  fontWeight: 700
                }}
                title="Bandingkan spesifikasi di arena adu HP"
              >
                <span>⚔️ Adukan HP</span>
              </Link>
            </div>

            {/* SPECIFICATIONS TABS */}
            <div>
              {/* Tab Nav */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '18px', gap: '8px' }}>
                <button
                  onClick={() => setActiveTab('specs')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'specs' ? `2px solid ${themeColor}` : '2px solid transparent',
                    color: activeTab === 'specs' ? '#fff' : '#888',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ⚙️ Spesifikasi Mesin
                </button>
                <button
                  onClick={() => setActiveTab('benchmark')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'benchmark' ? `2px solid ${themeColor}` : '2px solid transparent',
                    color: activeTab === 'benchmark' ? '#fff' : '#888',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🔥 AnTuTu & Gaming FPS
                </button>
                <button
                  onClick={() => setActiveTab('legalitas')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'legalitas' ? `2px solid ${themeColor}` : '2px solid transparent',
                    color: activeTab === 'legalitas' ? '#fff' : '#888',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📜 Legalitas & Garansi PT
                </button>
              </div>

              {/* Tab 1: Specs */}
              {activeTab === 'specs' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div style={{ background: '#14141a', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF9100', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      <Cpu size={15} />
                      <span>CHIPSET & PROCESSOR</span>
                    </div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                      {product.specs?.chipset || 'Octa-Core Processor Modern'}
                    </div>
                  </div>

                  <div style={{ background: '#14141a', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00E5FF', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      <Smartphone size={15} />
                      <span>LAYAR & DISPLAY</span>
                    </div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                      {product.specs?.display || 'AMOLED Mulus 120Hz'}
                    </div>
                  </div>

                  <div style={{ background: '#14141a', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-lime)', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      <BatteryCharging size={15} />
                      <span>BATERAI & FAST CHARGE</span>
                    </div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                      {product.specs?.battery || '5000 mAh Fast Charging'}
                    </div>
                  </div>

                  <div style={{ background: '#14141a', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E040FB', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      <Camera size={15} />
                      <span>KAMERA & SENSOR OIS</span>
                    </div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                      {product.specs?.camera || '50MP OIS + Lensa Jernih'}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Benchmark */}
              {activeTab === 'benchmark' && (
                <div style={{ background: '#14141a', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Flame size={20} color="#FF9100" />
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Skor AnTuTu Benchmark v10:</span>
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                      {product.antutu?.total ? product.antutu.total.toLocaleString('id-ID') : '1.450.000'} Poin
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ color: '#888' }}>MLBB (Mobile Legends):</div>
                      <div style={{ fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                        {product.gaming_fps?.mlbb || '120 FPS Ultra'}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ color: '#888' }}>PUBG Mobile:</div>
                      <div style={{ fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                        {product.gaming_fps?.pubg || '90 FPS Extreme'}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ color: '#888' }}>Genshin Impact:</div>
                      <div style={{ fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                        {product.gaming_fps?.genshin || '55-60 FPS Highest'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Legalitas & PT */}
              {activeTab === 'legalitas' && (
                <div style={{ background: '#14141a', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-lime)', fontWeight: 800, fontSize: '14px', marginBottom: '10px' }}>
                    <Building2 size={16} />
                    <span>Diterbitkan Oleh: {CORPORATE_ACCOUNTS.companyName}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#ccc', lineHeight: 1.6, marginBottom: '12px' }}>
                    Setiap unit smartphone yang Anda beli dari aduhp.com dijamin 100% legal dan terdaftar resmi di database Kemenperin / Bea Cukai Republik Indonesia. Invoice resmi berstempel PT akan diterbitkan bersama unit.
                  </p>
                  <ul style={{ fontSize: '12px', color: '#aaa', paddingLeft: '20px', lineHeight: 1.8 }}>
                    <li>NIB Perusahaan: {CORPORATE_ACCOUNTS.nib}</li>
                    <li>Keputusan Menkumham: {CORPORATE_ACCOUNTS.ahyuNumber}</li>
                    <li>Garansi Sinyal IMEI Permanen Seumur Hidup (Anti-Begall).</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 3. FULLSCREEN HD LIGHTBOX ZOOM MODAL */}
      {isLightboxOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          {/* Top Bar */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                {product.name}
              </h3>
              <p style={{ fontSize: '12px', color: themeColor }}>
                Foto {activePhotoIdx + 1}/5: {photoGallery[activePhotoIdx]?.title}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                style={{ background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}
              >
                + Zoom In
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))}
                style={{ background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}
              >
                - Zoom Out
              </button>
              <button
                onClick={() => setIsLightboxOpen(false)}
                style={{ background: '#ff4444', border: 'none', color: '#fff', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
              >
                <X size={16} />
                <span>Tutup</span>
              </button>
            </div>
          </div>

          {/* Lightbox Center Image */}
          <div style={{
            maxWidth: '90vw',
            maxHeight: '75vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto'
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoGallery[activePhotoIdx]?.url}
              alt="Zoom Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease'
              }}
            />
          </div>

          {/* Bottom Thumbnails inside Modal */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            display: 'flex',
            gap: '10px'
          }}>
            {photoGallery.map((slot, idx) => (
              <button
                key={idx}
                onClick={() => { setActivePhotoIdx(idx); setZoomLevel(1); }}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  background: '#1a1a22',
                  border: activePhotoIdx === idx ? `2px solid ${themeColor}` : '1px solid #444',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  padding: '2px'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slot.url} alt={slot.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
