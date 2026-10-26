'use client';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Minus,
  Sparkles,
  Lock
} from 'lucide-react';
import { formatIDR } from '../lib/utils';

export default function CartDrawer() {
  const { cart, totalItems, totalPrice, isCartOpen, closeCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    closeCart();

    if (cart.length === 0) return;

    // Ambil item pertama atau seluruh item keranjang
    const firstItem = cart[0];
    const query = new URLSearchParams({
      productId: firstItem.productId,
      name: firstItem.name,
      price: firstItem.price.toString(),
      ram: firstItem.ram.toString(),
      storage: firstItem.storage.toString(),
      color: firstItem.color,
      condition: firstItem.condition || 'baru',
      image: firstItem.image || '',
      quantity: firstItem.quantity.toString()
    }).toString();

    const targetUrl = `/checkout?${query}`;

    // Login Wall: Jika belum login, arahkan ke login dengan redirect
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      router.push(targetUrl);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      justifyContent: 'flex-end',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={closeCart}>
      
      {/* Drawer Panel */}
      <div 
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: '#121217',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)',
          animation: 'slideInRight 0.25s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#16161d'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(198, 255, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-lime)'
            }}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Keranjang Belanja
              </h3>
              <span style={{ fontSize: '11px', color: '#888' }}>
                {totalItems} unit smartphone dipilih
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
                title="Kosongkan seluruh isi keranjang"
              >
                Kosongkan
              </button>
            )}
            <button
              onClick={closeCart}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#aaa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#555'
              }}>
                <ShoppingBag size={32} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                Keranjang Masih Kosong
              </h4>
              <p style={{ fontSize: '12.5px', color: '#888', maxWidth: '280px', lineHeight: 1.5, marginBottom: '24px' }}>
                Yuk, temukan smartphone impian Anda dengan spek dan harga terbaik di aduHP!
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  href="/hp-baru"
                  onClick={closeCart}
                  className="btn btn-primary"
                  style={{ fontSize: '12.5px', padding: '10px 18px', textDecoration: 'none' }}
                >
                  Katalog HP Baru
                </Link>
                <Link
                  href="/hp-second"
                  onClick={closeCart}
                  className="btn btn-secondary"
                  style={{ fontSize: '12.5px', padding: '10px 18px', textDecoration: 'none' }}
                >
                  HP Second QC
                </Link>
              </div>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  gap: '12px',
                  position: 'relative'
                }}
              >
                {/* Product Thumbnail */}
                <img 
                  src={item.image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=300&q=80'} 
                  alt={item.name} 
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                    background: '#0a0a0f',
                    borderRadius: '8px',
                    padding: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                />

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <h4 style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#fff',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Hapus dari keranjang"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Varian Tags */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#aaa',
                      fontWeight: 600
                    }}>
                      {item.ram}GB / {item.storage}GB
                    </span>
                    <span style={{
                      fontSize: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#aaa'
                    }}>
                      {item.color}
                    </span>
                    <span style={{
                      fontSize: '9.5px',
                      color: item.condition === 'second' ? '#00E5FF' : 'var(--accent-lime)',
                      fontWeight: 700
                    }}>
                      {item.condition === 'second' ? 'Second QC' : '100% Baru'}
                    </span>
                  </div>

                  {/* Price & Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: 'var(--accent-lime)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {formatIDR(item.price * item.quantity)}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#1e1e24',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{
                          width: '24px',
                          height: '24px',
                          background: 'none',
                          border: 'none',
                          color: '#aaa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus size={11} />
                      </button>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#fff',
                        padding: '0 8px',
                        minWidth: '22px',
                        textAlign: 'center'
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.maxStock && item.quantity >= item.maxStock}
                        style={{
                          width: '24px',
                          height: '24px',
                          background: 'none',
                          border: 'none',
                          color: (item.maxStock && item.quantity >= item.maxStock) ? '#444' : '#aaa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: (item.maxStock && item.quantity >= item.maxStock) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div style={{
            padding: '18px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#16161d'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>Total Belanja ({totalItems} item):</span>
              <span style={{
                fontSize: '18px',
                fontWeight: 900,
                color: 'var(--accent-lime)',
                fontFamily: 'var(--font-mono)'
              }}>
                {formatIDR(totalPrice)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#888',
              marginBottom: '14px'
            }}>
              <ShieldCheck size={14} color="#69F0AE" />
              <span>Garansi Resmi PT & Pengiriman Berasuransi Aman</span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '14.5px',
                fontWeight: 800,
                background: 'var(--accent-lime)',
                color: '#000',
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(198, 255, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              {!user && <Lock size={15} />}
              <span>{user ? 'Lanjut ke Pembayaran' : 'Login & Lanjut Pembayaran'}</span>
              <ArrowRight size={16} />
            </button>

            {!user && (
              <p style={{ fontSize: '10.5px', color: '#777', textAlign: 'center', marginTop: '8px', margin: '8px 0 0 0' }}>
                *Wajib login terlebih dahulu untuk verifikasi legalitas faktur & rekening PT
              </p>
            )}

            <Link
              href="/keranjang"
              onClick={closeCart}
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '12px',
                color: '#888',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-lime)'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
            >
              Lihat Halaman Keranjang Lengkap →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
