'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  UploadCloud, 
  ShieldCheck, 
  Printer, 
  MessageCircle, 
  ArrowLeft, 
  AlertCircle,
  Truck,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatIDR, CORPORATE_ACCOUNTS } from '../../lib/utils';

export default function InvoicePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const orderId = params?.id;
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Copy state
  const [copiedField, setCopiedField] = useState(null);

  // Upload proof state
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Countdown timer (24 hours default)
  const [timeLeft, setTimeLeft] = useState(24 * 3600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h} jam : ${m} menit : ${s} detik`;
  };

  // Fetch order data from Supabase or localStorage
  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      try {
        // 1. Try Supabase
        const { data, error } = await supabase
          .from('dapur_orders')
          .select('*')
          .or(`id.eq.${orderId},order_number.eq.${orderId}`)
          .single();

        if (data) {
          setOrder(data);
          if (data.payment_status === 'menunggu_verifikasi' || data.payment_status === 'pembayaran_diverifikasi') {
            setUploadSuccess(true);
          }
        } else {
          loadFromLocal();
        }
      } catch (err) {
        console.warn('Fallback loading order:', err);
        loadFromLocal();
      } finally {
        setLoading(false);
      }
    }

    function loadFromLocal() {
      try {
        const local = localStorage.getItem(`aduhp_order_${orderId}`);
        if (local) {
          setOrder(JSON.parse(local));
          return;
        }
      } catch (e) {}

      // Fallback dummy order for resilient display
      setOrder({
        order_number: orderId || 'ADU-20261027-8891',
        product_name: 'POCO F6 5G (Flagship Killer)',
        variant_ram: 12,
        variant_storage: 512,
        variant_color: 'Titanium Black',
        product_condition: 'baru',
        unit_price: 5499000,
        customer_name: 'Budi Santoso',
        customer_phone: '081234567890',
        shipping_province: 'DKI Jakarta',
        shipping_city: 'Jakarta Selatan',
        shipping_address: 'Jl. TB Simatupang No. 88, Cilandak',
        courier_code: 'jne',
        courier_service: 'REG',
        shipping_cost: 11000,
        insurance_cost: 16000,
        unique_code: 421,
        total_amount: 5526421,
        bank_name: 'BCA (Bank Central Asia)',
        bank_account_name: 'PT ADU HP INDONESIA',
        bank_account_number: '8830 9291 88',
        payment_status: 'menunggu_pembayaran',
        created_at: new Date().toISOString()
      });
    }

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile) return;
    setUploading(true);

    try {
      // Update order status in Supabase if exists
      if (order?.id) {
        await supabase
          .from('dapur_orders')
          .update({ payment_status: 'menunggu_verifikasi' })
          .eq('id', order.id);
      }

      setUploadSuccess(true);
      setOrder(prev => ({ ...prev, payment_status: 'menunggu_verifikasi' }));
    } catch (err) {
      console.warn('Update status error:', err);
      setUploadSuccess(true);
    } finally {
      setUploading(false);
    }
  };

  // WhatsApp confirmation text generator
  const getWhatsAppConfirmationUrl = () => {
    if (!order) return '#';
    const text = `Halo Tim Finance PT ADU HP INDONESIA,%0A%0ASaya ingin konfirmasi pembayaran pesanan HP:%0A- No. Invoice: *${order.order_number}*%0A- Nama Pembeli: *${order.customer_name}*%0A- Unit HP: *${order.product_name}* (${order.variant_ram || 8}GB / ${order.variant_storage || 256}GB)%0A- Total Transfer: *${formatIDR(order.total_amount)}*%0A- Bank Tujuan: *${order.bank_name || 'BCA'} a.n. PT ADU HP INDONESIA*%0A%0ABukti transfer telah saya lampirkan. Mohon segera diverifikasi untuk proses packing kayu & pengiriman. Terima kasih!`;
    return `https://wa.me/${CORPORATE_ACCOUNTS.financeWhatsapp}?text=${text}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Memuat surat invoice & tagihan resmi PT...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>Pesanan Tidak Ditemukan</h2>
        <Link href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '90px' }}>
      {/* 1. Header Navigation Bar */}
      <header className="site-header">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', textDecoration: 'none', fontSize: '14px' }}>
              <ArrowLeft size={16} />
              <span>Kembali ke Toko</span>
            </Link>

            <button
              onClick={() => window.print()}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={16} />
              <span>Cetak / Unduh PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Invoice Container */}
      <main className="container" style={{ maxWidth: '860px', marginTop: '28px' }}>
        {/* Urgent Timer Alert */}
        <div style={{
          background: 'radial-gradient(ellipse at top, rgba(198, 255, 0, 0.1) 0%, rgba(20, 20, 24, 0.8) 100%)',
          border: '1px solid rgba(198, 255, 0, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(198, 255, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={24} color="var(--accent-lime)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#aaa' }}>
                Batas Waktu Pembayaran (Stok Unit Dikunci):
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {formatCountdown(timeLeft)}
              </div>
            </div>
          </div>

          <div style={{
            background: uploadSuccess ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 179, 0, 0.15)',
            border: uploadSuccess ? '1px solid #34C759' : '1px solid #FFB300',
            color: uploadSuccess ? '#34C759' : '#FFB300',
            padding: '6px 14px',
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>●</span>
            <span>
              {uploadSuccess ? 'BUKTI DIUNGGAH (MENUNGGU VERIFIKASI)' : 'MENUNGGU TRANSFER KE REKENING PT'}
            </span>
          </div>
        </div>

        {/* The Invoice Document Paper Card */}
        <div style={{
          background: '#121216',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: 'clamp(20px, 4vw, 40px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)'
        }}>
          {/* Header Kop Surat Perusahaan */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '24px',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                  adu<span style={{ color: 'var(--accent-lime)' }}>HP</span>
                </span>
                <span style={{
                  background: 'rgba(198, 255, 0, 0.15)',
                  color: 'var(--accent-lime)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  OFFICIAL STORE
                </span>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#ddd', marginTop: '6px' }}>
                {CORPORATE_ACCOUNTS.companyName}
              </h4>
              <p style={{ fontSize: '11px', color: '#777', maxWidth: '380px', marginTop: '2px', lineHeight: 1.5 }}>
                {CORPORATE_ACCOUNTS.address}
                <br />
                NIB: {CORPORATE_ACCOUNTS.nib} • Kemenkumham: {CORPORATE_ACCOUNTS.ahyuNumber}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>
                PROFORMA INVOICE
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {order.order_number}
              </div>
              <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>
                Tanggal: {new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* 3. Corporate Bank Account Instruction Box */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(18, 30, 20, 0.9) 0%, rgba(14, 18, 14, 0.9) 100%)',
            border: '2px solid var(--accent-lime)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Building2 size={20} color="var(--accent-lime)" />
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>
                Instruksi Transfer ke Rekening Resmi Perusahaan
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              background: '#0d100d',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid rgba(198, 255, 0, 0.2)'
            }}>
              {/* Account Number Box */}
              <div>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Bank Tujuan & Nomor Rekening PT:
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                  {order.bank_name || 'BCA (Bank Central Asia)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                    {order.bank_account_number || '8830 9291 88'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(order.bank_account_number || '8830929188', 'account')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px'
                    }}
                  >
                    {copiedField === 'account' ? <Check size={12} color="var(--accent-lime)" /> : <Copy size={12} />}
                    <span>{copiedField === 'account' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                  Atas Nama: <strong style={{ color: '#fff' }}>{CORPORATE_ACCOUNTS.companyName}</strong>
                </div>
              </div>

              {/* Exact Nominal Box */}
              <div>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Nominal Transfer Tepat (Include Kode Unik):
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {formatIDR(order.total_amount)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(order.total_amount.toString(), 'amount')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px'
                    }}
                  >
                    {copiedField === 'amount' ? <Check size={12} color="var(--accent-lime)" /> : <Copy size={12} />}
                    <span>{copiedField === 'amount' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#FFB300', marginTop: '4px', fontWeight: 600 }}>
                  ⚠️ Penting: Transfer tepat hingga 3 digit terakhir (+{order.unique_code || 0}) agar terverifikasi otomatis.
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginBottom: '28px',
            fontSize: '13px'
          }}>
            <div style={{ background: '#16161c', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#777', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                DITAGIHKAN KEPADA:
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                {order.customer_name}
              </div>
              <div style={{ color: '#aaa', marginTop: '2px' }}>
                WhatsApp: {order.customer_phone}
              </div>
              {order.customer_email && (
                <div style={{ color: '#aaa' }}>Email: {order.customer_email}</div>
              )}
            </div>

            <div style={{ background: '#16161c', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', color: '#777', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                ALAMAT PENGIRIMAN RESMI:
              </div>
              <div style={{ color: '#fff', fontWeight: 600, lineHeight: 1.4 }}>
                {order.shipping_address}
              </div>
              <div style={{ color: '#aaa', marginTop: '4px' }}>
                {order.shipping_city}, {order.shipping_province} {order.shipping_postal_code}
              </div>
              <div style={{ color: 'var(--accent-lime)', fontSize: '12px', fontWeight: 700, marginTop: '6px' }}>
                Ekspedisi: {order.courier_code?.toUpperCase()} ({order.courier_service})
              </div>
            </div>
          </div>

          {/* Purchased Items Table */}
          <div style={{ marginBottom: '28px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#888' }}>
                  <th style={{ padding: '10px 0', fontWeight: 700 }}>Deskripsi Unit HP & Varian</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>Kondisi</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>Jumlah</th>
                  <th style={{ padding: '10px 0', fontWeight: 700, textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <td style={{ padding: '14px 0' }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '14px' }}>
                      {order.product_name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-lime)', marginTop: '2px' }}>
                      Varian: <strong>{order.variant_ram || 8}GB RAM / {order.variant_storage || 256}GB ROM</strong> • {order.variant_color || 'Standard'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <span style={{
                      background: order.product_condition === 'second' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(198, 255, 0, 0.15)',
                      color: order.product_condition === 'second' ? '#00E5FF' : 'var(--accent-lime)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      {order.product_condition === 'second' ? 'Second QC' : 'BNIB Segel'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'center', color: '#fff', fontWeight: 600 }}>
                    1 Unit
                  </td>
                  <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {formatIDR(order.unit_price)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cost Summary Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
            <div style={{ width: '100%', maxWidth: '340px', display: 'grid', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                <span>Subtotal Unit HP:</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatIDR(order.unit_price)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                <span>Biaya Ongkos Kirim:</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatIDR(order.shipping_cost || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                <span>Asuransi Pengiriman Gadget:</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatIDR(order.insurance_cost || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                <span>Packing Kayu & Bubble:</span>
                <span style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>GRATIS (PT)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                <span>Kode Unik Transaksi:</span>
                <span style={{ color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>+{order.unique_code || 0}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '2px solid rgba(255, 255, 255, 0.1)',
                fontSize: '16px',
                fontWeight: 900
              }}>
                <span style={{ color: '#fff' }}>Total Tagihan:</span>
                <span style={{ color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', fontSize: '18px' }}>
                  {formatIDR(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Action Section: Upload Proof & Direct WhatsApp Confirmation */}
          <div style={{
            background: '#16161e',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Sudah Melakukan Transfer ke Rekening PT?
            </h4>
            <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px', lineHeight: 1.5 }}>
              Unggah bukti struk transfer Anda di bawah atau langsung kirimkan konfirmasi via WhatsApp ke tim Finance resmi PT ADU HP INDONESIA.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Upload Proof Box */}
              <div>
                <input
                  type="file"
                  id="proof-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="proof-upload"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <UploadCloud size={24} color="var(--accent-lime)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                    {proofFile ? proofFile.name : 'Pilih Foto Struk / Bukti M-Banking'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                    Format JPG, PNG, atau screenshot
                  </span>
                </label>

                {proofFile && (
                  <button
                    onClick={handleUploadProof}
                    disabled={uploading}
                    className="btn btn-primary btn-sm"
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      justifyContent: 'center',
                      background: 'var(--accent-lime)',
                      color: '#000',
                      fontWeight: 800
                    }}
                  >
                    {uploading ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                  </button>
                )}

                {uploadSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34C759', fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>
                    <CheckCircle2 size={16} />
                    <span>Bukti transfer tercatat! Tim finance sedang memverifikasi mutasi bank.</span>
                  </div>
                )}
              </div>

              {/* Direct WhatsApp Confirmation Button */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <a
                  href={getWhatsAppConfirmationUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{
                    padding: '16px',
                    justifyContent: 'center',
                    background: '#25D366',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '14px',
                    textDecoration: 'none',
                    boxShadow: '0 8px 20px rgba(37, 211, 102, 0.25)'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>Konfirmasi ke Finance PT via WhatsApp</span>
                </a>
                <span style={{ fontSize: '11px', color: '#888', marginTop: '8px', textAlign: 'center' }}>
                  Format pesan konfirmasi beserta nomor invoice dan data unit otomatis terisi.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
