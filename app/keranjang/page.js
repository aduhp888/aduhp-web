'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import NavbarCartAndAuth from '../components/NavbarCartAndAuth';
import { formatIDR } from '../lib/utils';

export default function KeranjangPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice } = useCart();
  const { user } = useAuth();
  const [selectedItemKey, setSelectedItemKey] = useState(null);

  // Default to first item if none selected
  const activeItem = cart.find(i => i.itemKey === selectedItemKey) || cart[0];

  const handleProceedCheckout = (item) => {
    if (!item) return;

    const prodId = item.productId || item.id.split('_')[0];
    const checkoutUrl = `/checkout?productId=${prodId}&name=${encodeURIComponent(item.name)}&price=${item.price}&ram=${item.ram}&storage=${item.storage}&color=${encodeURIComponent(item.color)}&condition=${item.condition}&image=${encodeURIComponent(item.image)}&quantity=${item.quantity}`;

    if (!user) {
      // Login Wall: Redirect ke Login dengan menyimpan tujuan checkout
      router.push(`/login?redirect=${encodeURIComponent(checkoutUrl)}`);
    } else {
      router.push(checkoutUrl);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#fff', paddingBottom: '80px' }}>
      {/* 1. Header */}
      <header className="site-header" style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(10, 10, 12, 0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Link
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#aaa',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <ArrowLeft size={16} />
                <span>Lanjut Belanja</span>
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>
                Keranjang Belanja ({totalItems})
              </span>
            </div>

            <NavbarCartAndAuth />
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="container" style={{ maxWidth: '1100px', marginTop: '32px' }}>
        {cart.length === 0 ? (
          <div style={{
            background: '#121216',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '72px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#666'
            }}>
              <ShoppingBag size={40} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
              Keranjang Belanja Masih Kosong
            </h2>
            <p style={{ fontSize: '14px', color: '#888', maxWidth: '440px', margin: '0 auto 28px', lineHeight: 1.5 }}>
              Yuk temukan smartphone impian Anda dengan jaminan berbadan hukum PT, garansi resmi, dan diskon promo hari ini!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                href="/hp-baru"
                style={{
                  background: 'var(--accent-lime)',
                  color: '#000',
                  padding: '13px 28px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                Jelajahi HP Baru BNIB
              </Link>
              <Link
                href="/hp-second"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '13px 28px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                Jelajahi HP Second Certified
              </Link>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px',
            alignItems: 'start'
          }}>
            {/* LEFT COLUMN: LIST OF CART ITEMS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                  Daftar Produk ({totalItems} unit)
                </h3>
                <button
                  onClick={clearCart}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FF6B6B',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Kosongkan Semua</span>
                </button>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {cart.map(item => {
                  const isSelected = activeItem?.itemKey === item.itemKey;
                  return (
                    <div
                      key={item.itemKey}
                      style={{
                        background: '#121217',
                        border: isSelected ? '1px solid var(--accent-lime)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '18px',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center',
                        position: 'relative',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      {/* Thumbnail */}
                      <Link href={`/produk/${item.productId || item.id.split('_')[0]}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: '84px',
                            height: '84px',
                            borderRadius: '12px',
                            objectFit: 'contain',
                            background: '#181820',
                            padding: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        />
                      </Link>

                      {/* Info & Quantity */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: item.condition === 'second' ? '#00E5FF' : 'var(--accent-lime)',
                            textTransform: 'uppercase'
                          }}>
                            {item.condition === 'second' ? 'Certified Second' : 'Baru BNIB'}
                          </span>
                        </div>

                        <Link
                          href={`/produk/${item.productId || item.id.split('_')[0]}`}
                          style={{ fontSize: '15px', fontWeight: 800, color: '#fff', textDecoration: 'none', display: 'block' }}
                        >
                          {item.name}
                        </Link>

                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                          {item.ram}GB / {item.storage}GB • {item.color}
                        </div>

                        <div style={{ marginTop: '4px' }}>
                          <Link
                            href={`/produk/${item.productId || item.id.split('_')[0]}`}
                            style={{
                              fontSize: '11px',
                              color: 'var(--accent-lime)',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>⚙️ Ubah Varian RAM & Warna →</span>
                          </Link>
                        </div>

                        <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
                          {formatIDR(item.price * item.quantity)}
                          {item.quantity > 1 && (
                            <span style={{ fontSize: '11px', color: '#888', fontWeight: 400, marginLeft: '6px' }}>
                              ({formatIDR(item.price)} / unit)
                            </span>
                          )}
                        </div>

                        {/* Controls: Quantity & Remove */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                          {/* Quantity Selector */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: '#181820',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            overflow: 'hidden'
                          }}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.itemKey, item.quantity - 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                background: 'transparent',
                                border: 'none',
                                color: '#ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{
                              padding: '0 10px',
                              fontSize: '13px',
                              fontWeight: 800,
                              color: '#fff',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.itemKey, item.quantity + 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                background: 'transparent',
                                border: 'none',
                                color: '#ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          {/* Quick Checkout Item or Delete */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.itemKey)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#666',
                                cursor: 'pointer',
                                padding: '6px'
                              }}
                              title="Hapus barang"
                            >
                              <Trash2 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleProceedCheckout(item)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#fff',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Checkout Ini Saja
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: RINGKASAN BELANJA */}
            <div style={{ position: 'sticky', top: '90px' }}>
              <div style={{
                background: '#14141a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
                  Ringkasan Belanja
                </h3>

                <div style={{ display: 'grid', gap: '12px', fontSize: '13px', color: '#aaa', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Barang:</span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>{totalItems} unit</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal Harga Unit:</span>
                    <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      {formatIDR(totalPrice)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Estimasi Ongkir:</span>
                    <span style={{ color: 'var(--accent-lime)', fontSize: '12px' }}>Dihitung saat checkout</span>
                  </div>
                </div>

                {/* Total */}
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Total Tagihan:</span>
                    <span style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color: 'var(--accent-lime)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {formatIDR(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA Button */}
                <button
                  type="button"
                  onClick={() => handleProceedCheckout(activeItem)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--accent-lime)',
                    border: 'none',
                    color: '#000',
                    fontSize: '15px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 25px rgba(198, 255, 0, 0.35)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <Lock size={16} />
                  <span>{user ? 'Lanjut ke Checkout Resmi' : 'Masuk Akun & Checkout'}</span>
                  <ArrowRight size={16} />
                </button>

                {!user && (
                  <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '10px' }}>
                    🔒 Anda akan diminta masuk/daftar akun terlebih dahulu untuk keamanan pesanan & auto-fill resi.
                  </p>
                )}

                {/* Guarantee Badges */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#aaa' }}>
                    <ShieldCheck size={14} color="var(--accent-lime)" />
                    <span>Rekening Berbadan Hukum Resmi PT. SECOND CIRCLE TEKNOLOGI</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#aaa' }}>
                    <Truck size={14} color="var(--accent-lime)" />
                    <span>Gratis Packing Kayu & Asuransi Kehilangan Pengiriman</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
