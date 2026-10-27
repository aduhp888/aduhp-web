'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
  Award,
  Sparkles,
  Info,
  AlertCircle,
  FileText,
  Package,
  Wifi,
  HardDrive,
  Plus,
  Minus,
  ArrowRight,
  Lock,
  Swords
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  formatIDR, 
  PHOTO_SLOT_DESCRIPTIONS, 
  getProductVariants, 
  getProductColors,
  getColorStockForVariant
} from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import NavbarCartAndAuth from '../../components/NavbarCartAndAuth';

export default function ProductDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const productId = routeParams?.id;

  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery state (0 to 4 for 5 slots)
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Variant & Quantity Selection State
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);
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
          query = query.eq('slug', productId);
        }

        const { data, error } = await query.single();
        if (data) {
          setProduct(data);
          const variantsList = getProductVariants(data);
          const defaultVar = variantsList.find(v => v.isDefault && v.stock > 0) || variantsList.find(v => v.stock > 0) || variantsList[0];
          setSelectedVariant(defaultVar);
          const colorsList = getProductColors(data);
          const defaultColor = colorsList.find(c => c.isDefault) || colorsList[0];
          setSelectedColor(defaultColor?.name || 'Black');
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

  // Current active stock strictly synchronized with selected variant AND selected color
  const currentColorStock = getColorStockForVariant(selectedVariant, selectedColor);
  const currentVariantStock = currentColorStock;
  const isOutOfStock = currentColorStock <= 0;

  // Add to Cart
  const handleAddToCart = () => {
    if (!product) return;
    if (isOutOfStock) {
      setToastMessage(`⚠️ Stok varian ${selectedVariant?.label || ''} warna "${selectedColor}" saat ini sedang habis.`);
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    addToCart(product, selectedVariant, selectedColor, quantity);
    setToastMessage(`✓ ${product.name} (${selectedVariant?.label || ''} - ${selectedColor}) berhasil masuk ke keranjang!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Direct Buy / Checkout with Login Wall
  const handleDirectBuy = () => {
    if (!product) return;
    if (isOutOfStock) {
      setToastMessage(`⚠️ Stok varian ${selectedVariant?.label || ''} warna "${selectedColor}" saat ini sedang habis.`);
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
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
      image: photoGallery[0]?.url || '',
      quantity: quantity.toString()
    }).toString();

    const targetUrl = `/checkout?${query}`;

    // Login Wall: Wajib Login sebelum Checkout ke Pembayaran
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      router.push(targetUrl);
    }
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
                <ShieldCheck size={14} />
                <span>Garansi Resmi PT</span>
              </div>

              <NavbarCartAndAuth />
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
                  padding: '8px 12px',
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
                alt={product.name}
                style={{
                  width: '92%',
                  height: '92%',
                  objectFit: 'contain',
                  transition: 'transform 0.25s ease'
                }}
              />
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
                    padding: '6px',
                    border: activePhotoIdx === idx ? `2px solid ${themeColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                    aspectRatio: '1 / 1',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Foto ${idx + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot.url}
                    alt={`Thumbnail ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
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

              {currentVariantStock > 0 && currentVariantStock <= 5 && (
                <span style={{
                  background: 'rgba(255, 77, 77, 0.15)',
                  color: '#FF6B6B',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  🔥 Sisa {currentVariantStock} Unit!
                </span>
              )}

              {currentVariantStock === 0 && (
                <span style={{
                  background: 'rgba(255, 69, 58, 0.2)',
                  color: '#FF453A',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  ⚠️ Stok Varian Habis
                </span>
              )}

              {currentVariantStock > 5 && (
                <span style={{
                  background: 'rgba(52, 199, 89, 0.15)',
                  color: '#34C759',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  ✓ Tersedia {currentVariantStock} Unit
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
                Transfer langsung ke <strong>Rekening Resmi PT. SECOND CIRCLE TEKNOLOGI</strong>. Dilindungi jaminan pengiriman berasuransi.
              </p>
            </div>

            {/* RAM & STORAGE VARIANT SELECTOR */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  💾 Pilih Varian Kapasitas (RAM & Storage):
                </label>
                <span style={{ fontSize: '12px', color: isOutOfStock ? '#FF453A' : themeColor, fontWeight: 700 }}>
                  Terpilih: {selectedVariant?.label} {isOutOfStock ? '(Stok Habis)' : ''}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                {variants.map((v, i) => {
                  const isSelected = selectedVariant?.label === v.label;
                  const vOutOfStock = v.stock !== undefined && v.stock <= 0;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v);
                        // Auto switch color if current selectedColor has 0 stock in newly selected variant
                        let activeColor = selectedColor;
                        const currentStockInNewVar = getColorStockForVariant(v, selectedColor);
                        if (currentStockInNewVar <= 0) {
                          const firstInStock = colors.find(c => getColorStockForVariant(v, c.name) > 0);
                          if (firstInStock) {
                            activeColor = firstInStock.name;
                            setSelectedColor(firstInStock.name);
                          }
                        }
                        const colorStock = getColorStockForVariant(v, activeColor);
                        if (colorStock > 0) {
                          setQuantity(prev => Math.min(prev, colorStock));
                        } else {
                          setQuantity(1);
                        }
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isSelected 
                          ? (vOutOfStock ? 'rgba(255, 69, 58, 0.1)' : 'rgba(198, 255, 0, 0.08)') 
                          : '#16161c',
                        border: isSelected 
                          ? (vOutOfStock ? '2px solid #FF453A' : `2px solid ${themeColor}`) 
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        opacity: !isSelected && vOutOfStock ? 0.65 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#fff' : '#ccc' }}>
                          {v.label}
                        </span>
                        {vOutOfStock ? (
                          <span style={{
                            fontSize: '9px',
                            background: 'rgba(255, 69, 58, 0.2)',
                            color: '#FF6B6B',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 800
                          }}>
                            Habis
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '9px',
                            background: 'rgba(52, 199, 89, 0.15)',
                            color: '#34C759',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            {v.stock} Unit
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '13px', color: isSelected ? (vOutOfStock ? '#FF6B6B' : themeColor) : '#aaa', fontWeight: 800, marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                        {formatIDR(v.price)}
                      </div>

                      {v.isDefault && (
                        <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>Varian Standar</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Notice if selected variant is out of stock entirely */}
              {selectedVariant?.stock !== undefined && Number(selectedVariant.stock) <= 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: 'rgba(255, 69, 58, 0.08)',
                  border: '1px solid rgba(255, 69, 58, 0.25)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#FF9E9E'
                }}>
                  <AlertCircle size={15} color="#FF453A" />
                  <span>Varian <strong>{selectedVariant?.label}</strong> saat ini semua stoknya kosong. Harga di atas adalah harga referensi katalog.</span>
                </div>
              )}
            </div>

            {/* COLOR SELECTION */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎨 Pilihan Warna Unit: <span style={{ color: '#ccc', fontWeight: 600 }}>{selectedColor}</span>
                </label>
                {selectedVariant && (
                  <span style={{ fontSize: '11px', color: currentColorStock > 0 ? '#34C759' : '#FF6B6B', fontWeight: 700 }}>
                    {currentColorStock > 0 ? `● Stok: ${currentColorStock} Unit` : '● Stok Warna Ini Habis'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {colors.map((c, i) => {
                  const isSelected = selectedColor === c.name;
                  const colorStock = getColorStockForVariant(selectedVariant, c.name);
                  const isColorEmpty = colorStock <= 0;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c.name);
                        if (colorStock > 0) {
                          setQuantity(prev => Math.min(prev, colorStock));
                        } else {
                          setQuantity(1);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: isSelected 
                          ? (isColorEmpty ? 'rgba(255, 69, 58, 0.15)' : 'rgba(255, 255, 255, 0.1)') 
                          : (isColorEmpty ? 'rgba(255, 255, 255, 0.02)' : '#16161c'),
                        border: isSelected 
                          ? `2px solid ${isColorEmpty ? '#FF453A' : themeColor}` 
                          : (isColorEmpty ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.1)'),
                        color: isColorEmpty && !isSelected ? '#777' : '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: isColorEmpty && !isSelected ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: c.hex,
                        border: '1px solid rgba(255,255,255,0.3)',
                        opacity: isColorEmpty ? 0.5 : 1
                      }} />
                      <span>{c.name}</span>
                      {isColorEmpty ? (
                        <span style={{
                          fontSize: '9px',
                          background: 'rgba(255, 69, 58, 0.2)',
                          color: '#FF6B6B',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          fontWeight: 800
                        }}>
                          Habis
                        </span>
                      ) : (
                        colorStock <= 3 && (
                          <span style={{
                            fontSize: '9px',
                            background: 'rgba(255, 159, 10, 0.2)',
                            color: '#FF9F0A',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            Sisa {colorStock}
                          </span>
                        )
                      )}
                      {isSelected && <Check size={14} color={isColorEmpty ? '#FF453A' : themeColor} />}
                    </button>
                  );
                })}
              </div>

              {/* Warning banner if current selected color is out of stock */}
              {isOutOfStock && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: 'rgba(255, 69, 58, 0.08)',
                  border: '1px solid rgba(255, 69, 58, 0.25)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  color: '#FF9E9E'
                }}>
                  <AlertCircle size={15} color="#FF453A" />
                  <span>
                    Varian <strong>{selectedVariant?.label}</strong> untuk pilihan warna <strong>"{selectedColor}"</strong> saat ini stoknya habis. Silakan pilih warna lain yang masih ready.
                  </span>
                </div>
              )}
            </div>

            {/* QUANTITY SELECTOR */}
            <div style={{ marginBottom: '26px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Kuantitas:
              </label>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#16161c',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  style={{
                    width: '38px',
                    height: '38px',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Kurangi jumlah"
                >
                  <Minus size={14} />
                </button>
                <span style={{
                  minWidth: '44px',
                  textAlign: 'center',
                  fontWeight: 800,
                  color: '#fff',
                  fontSize: '15px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => (prev < currentVariantStock ? prev + 1 : prev))}
                  disabled={currentVariantStock <= 0 || quantity >= currentVariantStock}
                  style={{
                    width: '38px',
                    height: '38px',
                    background: 'none',
                    border: 'none',
                    color: (currentVariantStock <= 0 || quantity >= currentVariantStock) ? '#555' : '#fff',
                    cursor: (currentVariantStock <= 0 || quantity >= currentVariantStock) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Tambah jumlah"
                >
                  <Plus size={14} />
                </button>
              </div>

              <span style={{ fontSize: '12px', color: currentVariantStock > 0 ? '#888' : '#FF6B6B', fontWeight: 600 }}>
                {currentVariantStock > 0 
                  ? `Stok tersedia: ${currentVariantStock} unit`
                  : 'Stok varian ini habis'}
              </span>
            </div>

            {/* ACTION CTA BUTTONS GRID */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
              gap: '12px', 
              marginBottom: '32px' 
            }}>
              <button
                type="button"
                onClick={handleAddToCart}
                className="btn"
                style={{
                  minHeight: '54px',
                  justifyContent: 'center',
                  padding: '14px 18px',
                  fontSize: '14.5px',
                  fontWeight: 800,
                  background: isOutOfStock ? 'rgba(255, 255, 255, 0.05)' : (isConditionSecond ? 'rgba(0, 229, 255, 0.12)' : 'rgba(198, 255, 0, 0.12)'),
                  border: isOutOfStock ? '1.5px solid rgba(255, 255, 255, 0.2)' : `1.5px solid ${themeColor}`,
                  color: isOutOfStock ? '#aaa' : themeColor,
                  borderRadius: '12px',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: isOutOfStock ? 'none' : (isConditionSecond ? '0 4px 16px rgba(0, 229, 255, 0.15)' : '0 4px 16px rgba(198, 255, 0, 0.15)'),
                  whiteSpace: 'nowrap'
                }}
                title={isOutOfStock ? "Stok varian ini habis" : "Tambahkan ke Keranjang Belanja"}
              >
                <ShoppingBag size={18} />
                <span>{isOutOfStock ? '+ Keranjang (Habis)' : '+ Tambah ke Keranjang'}</span>
              </button>

              <button
                type="button"
                onClick={handleDirectBuy}
                className="btn"
                style={{
                  minHeight: '54px',
                  justifyContent: 'center',
                  padding: '14px 20px',
                  fontSize: '15px',
                  fontWeight: 900,
                  background: isOutOfStock ? '#2a2a35' : themeColor,
                  color: isOutOfStock ? '#888' : '#000',
                  borderRadius: '12px',
                  boxShadow: isOutOfStock ? 'none' : (isConditionSecond ? '0 8px 24px rgba(0, 229, 255, 0.25)' : '0 8px 24px rgba(198, 255, 0, 0.25)'),
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  whiteSpace: 'nowrap'
                }}
                title={isOutOfStock ? "Stok varian ini habis" : "Beli langsung dan lanjutkan ke pembayaran"}
              >
                {!user && !isOutOfStock && <Lock size={16} />}
                <span>
                  {isOutOfStock 
                    ? 'Stok Habis' 
                    : (user ? 'Beli Sekarang' : 'Login & Beli Sekarang')}
                </span>
                {!isOutOfStock && <ArrowRight size={18} />}
              </button>

              <Link
                href={`/adu-hp?slot1=${product.id}`}
                className="btn btn-adukan-cta"
                style={{
                  minHeight: '54px',
                  justifyContent: 'center',
                  padding: '14px 18px',
                  fontSize: '14.5px',
                  fontWeight: 800,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 75, 75, 0.12)',
                  border: '1.5px solid rgba(255, 75, 75, 0.5)',
                  color: '#FF6B6B',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(255, 75, 75, 0.18)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                title="Bandingkan spesifikasi di arena adu HP"
              >
                <Swords size={18} />
                <span>Adukan HP</span>
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
                  onClick={() => setActiveTab('full_specs')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'full_specs' ? `2px solid ${themeColor}` : '2px solid transparent',
                    color: activeTab === 'full_specs' ? '#fff' : '#888',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📋 Spesifikasi Lengkap
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
                      {product.antutu?.total ? Number(product.antutu.total).toLocaleString('id-ID') : '1.450.000'} Poin
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

              {/* Tab 3: Spesifikasi Lengkap Smartphone */}
              {activeTab === 'full_specs' && (
                <div style={{
                  background: '#14141a',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}>
                  {/* Header info */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-lime)', fontWeight: 800, fontSize: '15px' }}>
                      <FileText size={18} />
                      <span>Lembar Spesifikasi Lengkap Smartphone</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#aaa', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px' }}>
                      {product.brand || 'Original Brand'} • {product.category || 'Smartphone'}
                    </span>
                  </div>

                  {/* Grid 6 Kategori Spesifikasi */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                    
                    {/* 1. Dapur Pacu */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF9100', fontSize: '12px', fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase' }}>
                        <Cpu size={15} />
                        <span>Dapur Pacu & Sistem Operasi</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Chipset / CPU:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{product.specs?.chipset || 'Octa-Core High Performance'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Sistem Operasi:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{product.specs?.os || 'Android OS Modern'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Skor AnTuTu v10:</span>
                          <span style={{ color: 'var(--accent-lime)', fontWeight: 700, textAlign: 'right' }}>
                            {product.antutu?.total ? `${Number(product.antutu.total).toLocaleString('id-ID')} Poin` : '1.450.000 Poin'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#888' }}>Kategori Performa:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{product.antutu?.tier || 'High Tier Gaming'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Layar & Visual */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00E5FF', fontSize: '12px', fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase' }}>
                        <Smartphone size={15} />
                        <span>Layar & Panel Visual</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Panel Layar:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{product.specs?.display || 'AMOLED Mulus 120Hz'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Refresh Rate:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>Hingga 120Hz Adaptif</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Touch Sampling:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>Ultra-Responsive Gaming</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#888' }}>Proteksi Layar:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>Corning Gorilla Glass</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Memori & Kapasitas */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E040FB', fontSize: '12px', fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase' }}>
                        <HardDrive size={15} />
                        <span>Memori & Kapasitas</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Varian Dipilih:</span>
                          <span style={{ color: 'var(--accent-lime)', fontWeight: 700, textAlign: 'right' }}>
                            {selectedVariant ? `${selectedVariant.ram}GB / ${selectedVariant.storage}GB` : (product.specs?.ram_rom || `${product.ram_gb || 8}GB / ${product.storage_gb || 256}GB`)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Pilihan Varian:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>
                            {variants && variants.length > 0 
                              ? variants.map(v => `${v.ram}/${v.storage}GB`).join(', ') 
                              : (product.ram_gb ? `${product.ram_gb}/${product.storage_gb}GB` : 'Tersedia')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Tipe Storage:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>UFS High Speed Flash</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#888' }}>Ekspansi Memori:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>RAM Virtual Didukung</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Kamera & Fotografi */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00E676', fontSize: '12px', fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase' }}>
                        <Camera size={15} />
                        <span>Kamera & Rekaman Video</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Sensor Kamera:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{product.specs?.camera || '50MP OIS High Clarity'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Stabilisasi:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>OIS (Optical Image Stabilization)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Perekaman Video:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>4K @ 30/60 FPS & 1080p Slo-Mo</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#888' }}>Fitur Fotografi:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>Night Mode, HDR, Portrait AI</span>
                        </div>
                      </div>
                    </div>

                    {/* 5. Baterai & Daya */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-lime)', fontSize: '12px', fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase' }}>
                        <BatteryCharging size={15} />
                        <span>Baterai & Pengisian Daya</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Kapasitas Baterai:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>{product.specs?.battery || '5000 mAh'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Fast Charging:</span>
                          <span style={{ color: 'var(--accent-lime)', fontWeight: 700, textAlign: 'right' }}>Didukung Fast Charging</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Tipe Konektor:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>USB Type-C (OTG Support)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#888' }}>Manajemen Daya:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>AI Smart Battery Saver</span>
                        </div>
                      </div>
                    </div>

                    {/* 6. Jaringan & Konektivitas */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#29B6F6', fontSize: '12px', fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase' }}>
                        <Wifi size={15} />
                        <span>Konektivitas & Sensor</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Jaringan Seluler:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>5G / 4G LTE / Dual SIM Nano</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>Konektivitas Nirkabel:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>Wi-Fi Dual Band & BT 5.x</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                          <span style={{ color: '#888' }}>NFC & Navigasi:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>Didukung / GPS, GLONASS</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#888' }}>Sensor Keamanan:</span>
                          <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>Fingerprint & Face Unlock</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7. Garansi Distributor & Kelengkapan Box */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFD700', fontWeight: 700, marginBottom: '6px' }}>
                          <ShieldCheck size={16} />
                          <span>Jaminan Garansi & Legalitas</span>
                        </div>
                        <p style={{ color: '#aaa', margin: 0, lineHeight: 1.6 }}>
                          {product.official_distributor || 'Garansi Resmi Distributor Indonesia'}. IMEI 100% terdaftar resmi di database Kemenperin / Bea Cukai Republik Indonesia dengan perlindungan sinyal permanen seumur hidup.
                        </p>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#69F0AE', fontWeight: 700, marginBottom: '6px' }}>
                          <Package size={16} />
                          <span>Kelengkapan Dalam Box</span>
                        </div>
                        <p style={{ color: '#aaa', margin: 0, lineHeight: 1.6 }}>
                          1x Unit Smartphone, 1x Adapter Charger / Kabel USB Type-C Original, 1x SIM Tray Ejector, 1x Buku Petunjuk & Kartu Garansi Resmi, 1x Surat Invoice Pembelian Resmi AduHP.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 8. Deskripsi Tambahan (jika ada) */}
                  {product.description && (
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#888', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Deskripsi & Catatan Tambahan
                      </div>
                      <p style={{ fontSize: '13px', color: '#ccc', lineHeight: 1.6, margin: 0 }}>
                        {product.description}
                      </p>
                    </div>
                  )}
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

      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 100000,
          background: 'rgba(18, 18, 23, 0.95)',
          border: '1px solid var(--accent-lime)',
          borderRadius: '10px',
          padding: '12px 18px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="var(--accent-lime)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Floating Sticky Bottom Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        background: 'rgba(18, 18, 23, 0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#888' }}>Total ({quantity} unit):</div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: themeColor, fontFamily: 'var(--font-mono)' }}>
            {formatIDR(currentPrice * quantity)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleAddToCart}
            style={{
              padding: '10px 14px',
              background: isOutOfStock ? 'rgba(255, 255, 255, 0.05)' : 'rgba(198, 255, 0, 0.1)',
              border: isOutOfStock ? '1px solid #555' : '1.5px solid var(--accent-lime)',
              color: isOutOfStock ? '#888' : 'var(--accent-lime)',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShoppingBag size={14} />
            <span>+ Keranjang</span>
          </button>
          <button
            type="button"
            onClick={handleDirectBuy}
            style={{
              padding: '10px 18px',
              background: isOutOfStock ? '#333' : themeColor,
              color: isOutOfStock ? '#888' : '#000',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {isOutOfStock ? 'Stok Habis' : (user ? 'Beli Sekarang' : 'Login & Beli')}
          </button>
        </div>
      </div>
    </div>
  );
}
