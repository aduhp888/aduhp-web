'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  ExternalLink, 
  ChevronRight, 
  Copy, 
  Check, 
  MessageCircle, 
  ArrowLeft,
  ShoppingBag,
  RefreshCw,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NavbarCartAndAuth from '../components/NavbarCartAndAuth';
import { formatIDR } from '../lib/utils';

// Status labels, colors, and badge definitions
const STATUS_CONFIG = {
  menunggu_pembayaran: {
    label: 'Menunggu Pembayaran',
    color: '#FFB800',
    bg: 'rgba(255, 184, 0, 0.12)',
    border: 'rgba(255, 184, 0, 0.3)',
    desc: 'Harap selesaikan transfer resmi ke rekening PT sebelum batas waktu.'
  },
  menunggu_verifikasi: {
    label: 'Menunggu Verifikasi',
    color: '#00E5FF',
    bg: 'rgba(0, 229, 255, 0.12)',
    border: 'rgba(0, 229, 255, 0.3)',
    desc: 'Bukti transfer sedang diverifikasi oleh Tim Keuangan PT. SECOND CIRCLE TEKNOLOGI.'
  },
  pembayaran_diverifikasi: {
    label: 'Pembayaran Diverifikasi',
    color: '#C6FF00',
    bg: 'rgba(198, 255, 0, 0.12)',
    border: 'rgba(198, 255, 0, 0.3)',
    desc: 'Dana telah resmi masuk ke rekening PT. Pesanan diteruskan ke gudang logistik.'
  },
  dikemas: {
    label: 'Sedang Dikemas (QC Logistik)',
    color: '#B388FF',
    bg: 'rgba(179, 136, 255, 0.12)',
    border: 'rgba(179, 136, 255, 0.3)',
    desc: 'Unit HP sedang melalui QC fisik, segel keamanan & packing kayu protektif.'
  },
  dikirim: {
    label: 'Dalam Pengiriman Ekspedisi',
    color: '#448AFF',
    bg: 'rgba(68, 138, 255, 0.12)',
    border: 'rgba(68, 138, 255, 0.3)',
    desc: 'Paket telah diserahkan ke kurir logistik dan diasuransikan penuh.'
  },
  selesai: {
    label: 'Pesanan Selesai',
    color: '#00E676',
    bg: 'rgba(0, 230, 118, 0.12)',
    border: 'rgba(0, 230, 118, 0.3)',
    desc: 'Paket smartphone telah diterima dengan aman dan garansi resmi aktif.'
  },
  dibatalkan: {
    label: 'Dibatalkan',
    color: '#FF5252',
    bg: 'rgba(255, 82, 82, 0.12)',
    border: 'rgba(255, 82, 82, 0.3)',
    desc: 'Pesanan dibatalkan karena batas waktu pembayaran habis atau permintaan pembeli.'
  }
};

const FILTER_TABS = [
  { id: 'all', label: 'Semua Pesanan' },
  { id: 'menunggu_pembayaran', label: 'Menunggu Pembayaran' },
  { id: 'menunggu_verifikasi', label: 'Verifikasi' },
  { id: 'diproses', label: 'Diproses Gudang' },
  { id: 'dikirim', label: 'Dikirim' },
  { id: 'selesai', label: 'Selesai' },
  { id: 'dibatalkan', label: 'Dibatalkan' }
];

export default function PesananPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [copiedOrder, setCopiedOrder] = useState(null);

  // 1. Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/pesanan');
    }
  }, [user, authLoading, router]);

  // 2. Fetch Orders for current logged in user
  useEffect(() => {
    async function fetchUserOrders() {
      if (!user) return;
      setLoadingOrders(true);

      const fetchedList = [];
      const userEmail = profile?.email || user.email || '';
      const userPhone = profile?.whatsapp_number || user.phone || user.user_metadata?.phone || '';

      try {
        // Query Supabase dapur_orders by email or phone
        let query = supabase
          .from('dapur_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (userEmail && userPhone) {
          query = query.or(`customer_email.eq.${userEmail},customer_phone.eq.${userPhone}`);
        } else if (userEmail) {
          query = query.eq('customer_email', userEmail);
        } else if (userPhone) {
          query = query.eq('customer_phone', userPhone);
        }

        const { data, error } = await query;
        if (data && data.length > 0) {
          fetchedList.push(...data);
        }
      } catch (err) {
        console.warn('Error fetching orders from Supabase:', err);
      }

      // Merge with localStorage cached orders (for offline resilience)
      try {
        if (typeof window !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('aduhp_order_')) {
              try {
                const item = JSON.parse(localStorage.getItem(key));
                if (item && item.order_number) {
                  const matchEmail = userEmail && item.customer_email === userEmail;
                  const matchPhone = userPhone && item.customer_phone === userPhone;
                  if (matchEmail || matchPhone) {
                    const exists = fetchedList.some(o => o.order_number === item.order_number);
                    if (!exists) {
                      fetchedList.push(item);
                    }
                  }
                }
              } catch (parseErr) {}
            }
          }
        }
      } catch (localErr) {}

      // Sort newest first
      fetchedList.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setOrders(fetchedList);
      setLoadingOrders(false);
    }

    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'diproses') {
      return orders.filter(o => o.payment_status === 'pembayaran_diverifikasi' || o.payment_status === 'dikemas');
    }
    return orders.filter(o => o.payment_status === activeTab);
  }, [orders, activeTab]);

  const copyText = (text, id) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedOrder(id);
      setTimeout(() => setCopiedOrder(null), 2000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch {
      return dateString;
    }
  };

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px', border: '3px solid rgba(198,255,0,0.2)', borderTopColor: 'var(--accent-lime)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#aaa', fontSize: '14px' }}>Memuat akun & data pesanan Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#fff', paddingBottom: '80px' }}>
      {/* 1. Universal Top Header */}
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
                  fontWeight: 600,
                  transition: 'color 0.15s'
                }}
              >
                <ArrowLeft size={16} />
                <span>Beranda</span>
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>
                Pesanan Saya
              </span>
            </div>

            <NavbarCartAndAuth />
          </div>
        </div>
      </header>

      {/* 2. Main Container */}
      <main className="container" style={{ maxWidth: '1000px', marginTop: '32px' }}>
        {/* Banner / User Summary */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 26, 0.9) 0%, rgba(14, 14, 18, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '24px 28px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-lime)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Akun Pembeli Terverifikasi
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
              {profile?.display_name || user.user_metadata?.display_name || user.user_metadata?.full_name || 'Pelanggan Setia aduhp.com'}
            </h1>
            <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
              {profile?.email || user.email} {(profile?.whatsapp_number || user.user_metadata?.phone) && `• ${profile?.whatsapp_number || user.user_metadata?.phone}`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(198, 255, 0, 0.06)',
              border: '1px solid rgba(198, 255, 0, 0.25)',
              padding: '10px 18px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 600 }}>Total Transaksi</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                {orders.length}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '24px',
          scrollbarWidth: 'none'
        }}>
          {FILTER_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: isActive ? '1px solid var(--accent-lime)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isActive ? 'rgba(198, 255, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? 'var(--accent-lime)' : '#aaa'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 4. Orders List or Empty State */}
        {loadingOrders ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px', border: '3px solid rgba(198,255,0,0.2)', borderTopColor: 'var(--accent-lime)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#888', fontSize: '14px' }}>Memuat riwayat transaksi pesanan...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{
            background: '#121216',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '64px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: '#666'
            }}>
              <ShoppingBag size={34} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              {activeTab === 'all' ? 'Belum Ada Transaksi' : 'Tidak Ada Pesanan pada Kategori Ini'}
            </h3>
            <p style={{ fontSize: '13px', color: '#888', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              Mulai belanja handphone impian Anda dengan jaminan resmi PT, garansi uang kembali 100%, dan pengiriman berlayanan asuransi.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                href="/hp-baru"
                style={{
                  background: 'var(--accent-lime)',
                  color: '#000',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '13px',
                  textDecoration: 'none'
                }}
              >
                Katalog HP Baru BNIB
              </Link>
              <Link
                href="/hp-second"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '13px',
                  textDecoration: 'none'
                }}
              >
                Katalog HP Second Certified
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredOrders.map(order => {
              const status = STATUS_CONFIG[order.payment_status] || STATUS_CONFIG.menunggu_pembayaran;
              const isWaitingPayment = order.payment_status === 'menunggu_pembayaran';
              const targetInvoiceUrl = `/invoice/${order.id || order.order_number}`;

              return (
                <div
                  key={order.id || order.order_number}
                  style={{
                    background: '#121217',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease, transform 0.2s ease'
                  }}
                >
                  {/* Card Header: Order No, Date, Status */}
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                          #{order.order_number}
                        </span>
                        <button
                          onClick={() => copyText(order.order_number, order.order_number)}
                          title="Salin Nomor Pesanan"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedOrder === order.order_number ? 'var(--accent-lime)' : '#666',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '2px'
                          }}
                        >
                          {copiedOrder === order.order_number ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>

                      <span style={{ fontSize: '12px', color: '#888' }}>
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '100px',
                      background: status.bg,
                      border: `1px solid ${status.border}`,
                      color: status.color,
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color }} />
                      <span>{status.label}</span>
                    </div>
                  </div>

                  {/* Card Body: Product Snippet */}
                  <div style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.product_image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=300&q=80'}
                      alt={order.product_name || 'Smartphone'}
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '12px',
                        objectFit: 'contain',
                        background: '#181820',
                        padding: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        flexShrink: 0
                      }}
                    />

                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: order.product_condition === 'second' ? '#00E5FF' : 'var(--accent-lime)',
                          textTransform: 'uppercase'
                        }}>
                          {order.product_condition === 'second' ? 'Certified Second QC' : '100% Baru BNIB Segel'}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                        {order.product_name}
                      </h4>

                      <div style={{ fontSize: '12px', color: '#aaa', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span>Varian: <strong>{order.variant_ram || '-'}GB / {order.variant_storage || '-'}GB</strong></span>
                        <span>•</span>
                        <span>Warna: <strong>{order.variant_color || '-'}</strong></span>
                        <span>•</span>
                        <span>Jumlah: <strong style={{ color: 'var(--accent-lime)' }}>{order.quantity || 1} unit</strong></span>
                      </div>

                      {/* Courier & Tracking if shipped */}
                      {order.tracking_number && (
                        <div style={{
                          marginTop: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'rgba(68, 138, 255, 0.08)',
                          border: '1px solid rgba(68, 138, 255, 0.25)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#448AFF'
                        }}>
                          <Truck size={14} />
                          <span>No. Resi ({order.courier_code?.toUpperCase()}): <strong>{order.tracking_number}</strong></span>
                          <button
                            onClick={() => copyText(order.tracking_number, order.tracking_number)}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0' }}
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      )}

                      {/* Cancelled notes if cancelled */}
                      {order.payment_status === 'dibatalkan' && order.notes && (
                        <div style={{
                          marginTop: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255, 69, 58, 0.08)',
                          border: '1px solid rgba(255, 69, 58, 0.25)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          color: '#FF6B6B'
                        }}>
                          <span>Keterangan: {order.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown Preview */}
                    <div style={{ textAlign: 'right', minWidth: '160px' }}>
                      <div style={{ fontSize: '11px', color: '#888' }}>Total Pembayaran</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {formatIDR(order.total_amount || 0)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#777', marginTop: '4px' }}>
                        Metode: {order.bank_name ? order.bank_name.split(' ')[0] : 'Transfer PT'}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Action Buttons */}
                  <div style={{
                    padding: '14px 20px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#777', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} color="var(--accent-lime)" />
                      <span>Rekening Resmi Berbadan Hukum PT. SECOND CIRCLE TEKNOLOGI</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* WhatsApp Help */}
                      <a
                        href={`https://wa.me/6281511843450?text=${encodeURIComponent(`Halo Admin PT. SECOND CIRCLE TEKNOLOGI (aduhp.com), saya ingin menanyakan status pesanan saya #${order.order_number}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#ccc',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <MessageCircle size={14} color="#25D366" />
                        <span>Bantuan CS</span>
                      </a>

                      {/* Detail / Invoice */}
                      <Link
                        href={targetInvoiceUrl}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 18px',
                          borderRadius: '10px',
                          background: isWaitingPayment ? 'var(--accent-lime)' : 'rgba(255, 255, 255, 0.08)',
                          border: isWaitingPayment ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                          color: isWaitingPayment ? '#000' : '#fff',
                          fontSize: '12px',
                          fontWeight: 800,
                          textDecoration: 'none',
                          boxShadow: isWaitingPayment ? '0 0 15px rgba(198, 255, 0, 0.3)' : 'none'
                        }}
                      >
                        {isWaitingPayment ? (
                          <>
                            <Clock size={14} />
                            <span>Bayar Sekarang</span>
                          </>
                        ) : (
                          <>
                            <span>Lihat Detail & Faktur</span>
                            <ChevronRight size={14} />
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
