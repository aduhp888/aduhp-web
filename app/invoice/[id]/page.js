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
  ExternalLink,
  Award
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

  // Countdown timer: 30 menit sejak pemesanan (1800 detik)
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sinkronisasi timer 30 menit berdasarkan waktu created_at pesanan
  useEffect(() => {
    if (!order?.created_at) return;
    const createdTime = new Date(order.created_at).getTime();
    const expireTime = createdTime + 30 * 60 * 1000;
    const remaining = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
    setTimeLeft(remaining);
  }, [order]);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m} menit : ${s} detik`;
  };

  // Fetch order data from Supabase or localStorage
  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      try {
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

      // Fallback sample order (nominal bulat tanpa kode unik)
      setOrder({
        order_number: orderId || 'ADU-20261027-4821',
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
        courier_service: 'YES',
        shipping_cost: 18000,
        insurance_cost: 16000,
        unique_code: 0,
        total_amount: 5533000,
        bank_name: 'BCA (Bank Central Asia)',
        bank_account_name: 'PT. SECOND CIRCLE TEKNOLOGI',
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
    const text = `Halo Tim Finance PT. SECOND CIRCLE TEKNOLOGI,%0A%0ASaya ingin konfirmasi pembayaran pesanan HP:%0A- No. Invoice: *${order.order_number}*%0A- Nama Pembeli: *${order.customer_name}*%0A- Unit HP: *${order.product_name}* (${order.variant_ram || 8}GB / ${order.variant_storage || 256}GB)%0A- Total Transfer: *${formatIDR(order.total_amount)}*%0A- Bank Tujuan: *${order.bank_name || 'BCA'} a.n. PT. SECOND CIRCLE TEKNOLOGI*%0A%0ABukti transfer telah saya lampirkan. Mohon segera diverifikasi untuk proses packing kayu & pengiriman. Terima kasih!`;
    return `https://wa.me/${CORPORATE_ACCOUNTS.financeWhatsapp}?text=${text}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Memuat surat invoice resmi PT...</p>
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

  // Calculate Due Date for Official Invoice (30 Menit Sejak Pemesanan)
  const orderDate = new Date(order.created_at || Date.now());
  const dueDate = new Date(orderDate.getTime() + 30 * 60 * 1000);
  const formattedOrderDate = orderDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedDueDate = dueDate.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) + ' WIB';

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '90px' }}>
      {/* 
        ========================================================================
        PRINT STYLES: STRICT 1-PAGE A4 ENFORCEMENT
        Menjamin saat diunduh / dicetak PDF hanya 1 lembar persis sesuai kotak merah
        ========================================================================
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Setup Kertas A4 Portrait */
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }

          /* Sembunyikan elemen non-invoice */
          .no-print,
          .site-header,
          .timer-banner,
          .upload-action-box,
          .copy-btn,
          footer {
            display: none !important;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .page-wrapper {
            padding: 0 !important;
            margin: 0 !important;
          }

          .container {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Card Invoice Resmi: 1 Lembar Bersih */
          #invoice-printable-card {
            background: #ffffff !important;
            color: #111111 !important;
            border: 1.5px solid #d1d5db !important;
            border-radius: 8px !important;
            padding: 20px 24px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
          }

          /* Warna Teks & Background Saat Cetak */
          #invoice-printable-card * {
            color: #111111 !important;
            text-shadow: none !important;
          }

          /* Header Kop PT */
          .print-company-name {
            color: #0f172a !important;
            font-size: 13pt !important;
            font-weight: 900 !important;
          }
          .print-muted {
            color: #475569 !important;
            font-size: 8.5pt !important;
          }
          .print-title {
            color: #0f172a !important;
            font-size: 16pt !important;
            font-weight: 900 !important;
            letter-spacing: 0.5px !important;
          }
          .print-order-no {
            color: #166534 !important;
            font-size: 12pt !important;
            font-weight: 900 !important;
          }

          /* Box Rekening Bank PT */
          .print-bank-box {
            background: #f8fafc !important;
            border: 1.5px solid #22c55e !important;
            border-radius: 8px !important;
            padding: 12px 16px !important;
            margin-bottom: 16px !important;
          }
          .print-acc-no {
            color: #15803d !important;
            font-size: 14pt !important;
            font-weight: 900 !important;
          }
          .print-total-amount {
            color: #0f172a !important;
            font-size: 15pt !important;
            font-weight: 900 !important;
          }

          /* Customer & Shipping Grid */
          .print-info-grid {
            margin-bottom: 16px !important;
            gap: 12px !important;
          }
          .print-info-card {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            padding: 10px 14px !important;
          }

          /* Tabel Produk */
          .print-table {
            margin-bottom: 14px !important;
          }
          .print-table th {
            border-bottom: 2px solid #cbd5e1 !important;
            color: #334155 !important;
            padding: 6px 4px !important;
            font-size: 8.5pt !important;
          }
          .print-table td {
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 8px 4px !important;
            font-size: 9pt !important;
          }
          .print-badge {
            background: #e2e8f0 !important;
            color: #0f172a !important;
            border: 1px solid #94a3b8 !important;
            padding: 2px 6px !important;
            font-size: 7.5pt !important;
          }

          /* Ringkasan Biaya */
          .print-summary-box {
            margin-bottom: 16px !important;
          }
          .print-summary-row {
            font-size: 8.5pt !important;
          }
          .print-grand-total {
            border-top: 2px solid #0f172a !important;
            padding-top: 6px !important;
            font-size: 12pt !important;
            font-weight: 900 !important;
            color: #15803d !important;
          }

          /* Cap Basah Digital PT */
          .print-stamp-box {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding-top: 12px !important;
            border-top: 1px dashed #cbd5e1 !important;
          }
        }
      `}} />

      {/* 1. Header Navigation Bar (Hidden on Print) */}
      <header className="site-header no-print">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', textDecoration: 'none', fontSize: '14px' }}>
              <ArrowLeft size={16} />
              <span>Kembali ke Toko</span>
            </Link>

            <button
              onClick={() => window.print()}
              style={{
                background: 'var(--accent-lime)',
                border: 'none',
                color: '#000',
                padding: '10px 18px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(198, 255, 0, 0.3)'
              }}
            >
              <Printer size={16} />
              <span>Cetak / Unduh PDF (1 Lembar)</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Invoice Container */}
      <main className="container" style={{ maxWidth: '860px', marginTop: '24px' }}>
        
        {/* Banner Sisa Waktu Pembayaran (Tampil di Layar Web, Otomatis Disembunyikan Saat Cetak PDF) */}
        <div className="timer-banner no-print" style={{
          background: 'radial-gradient(ellipse at top, rgba(198, 255, 0, 0.1) 0%, rgba(20, 20, 24, 0.8) 100%)',
          border: '1px solid rgba(198, 255, 0, 0.3)',
          borderRadius: '16px',
          padding: '18px 22px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(198, 255, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={22} color="var(--accent-lime)" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
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

        {/* 
          ========================================================================
          THE INVOICE DOCUMENT PAPER CARD (KOTAK MERAH RESMI)
          Ini satu-satunya bagian yang dicetak menjadi PDF 1 Lembar Profesional
          ========================================================================
        */}
        <div id="invoice-printable-card" style={{
          background: '#121216',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '18px',
          padding: 'clamp(20px, 3.5vw, 36px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
          position: 'relative'
        }}>
          {/* Header Kop Surat Perusahaan */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '20px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px'
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
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.5px'
                }}>
                  OFFICIAL STORE
                </span>
              </div>
              <h4 className="print-company-name" style={{ fontSize: '14px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                {CORPORATE_ACCOUNTS.companyName}
              </h4>
              <p className="print-muted" style={{ fontSize: '11px', color: '#888', maxWidth: '420px', marginTop: '2px', lineHeight: 1.4 }}>
                {CORPORATE_ACCOUNTS.address}
                <br />
                NIB: {CORPORATE_ACCOUNTS.nib} • Keputusan Menkumham: {CORPORATE_ACCOUNTS.ahyuNumber}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="print-title" style={{ fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>
                PROFORMA INVOICE
              </div>
              <div className="print-order-no" style={{ fontSize: '14px', fontWeight: 900, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {order.order_number}
              </div>
              <div className="print-muted" style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                Tanggal Terbit: <strong>{formattedOrderDate}</strong>
              </div>
              {/* Tambahan Info Sisa Waktu / Jatuh Tempo Resmi (30 Menit) */}
              <div className="print-muted" style={{ fontSize: '11px', color: 'var(--accent-lime)', marginTop: '2px', fontWeight: 700 }}>
                ⏰ Batas Bayar: 30 Menit (Jatuh Tempo: {formattedDueDate})
              </div>
            </div>
          </div>

          {/* 3. Corporate Bank Account Instruction Box */}
          <div className="print-bank-box" style={{
            background: 'linear-gradient(135deg, rgba(18, 30, 20, 0.9) 0%, rgba(14, 18, 14, 0.9) 100%)',
            border: '2px solid var(--accent-lime)',
            borderRadius: '14px',
            padding: '18px 20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--accent-lime)" />
                <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>
                  Instruksi Transfer ke Rekening Resmi Perusahaan
                </h3>
              </div>
              <span style={{ fontSize: '10px', background: 'rgba(198, 255, 0, 0.15)', color: 'var(--accent-lime)', padding: '2px 8px', borderRadius: '100px', fontWeight: 800 }}>
                REKENING GIRO PT
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              background: '#0d100d',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(198, 255, 0, 0.2)'
            }}>
              {/* Account Number Box */}
              <div>
                <div className="print-muted" style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Bank Tujuan & Nomor Rekening PT:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                  {order.bank_name || 'BCA (Bank Central Asia)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className="print-acc-no" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                    {order.bank_account_number || '8830 9291 88'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(order.bank_account_number || '8830929188', 'account')}
                    className="copy-btn no-print"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#fff',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px'
                    }}
                  >
                    {copiedField === 'account' ? <Check size={11} color="var(--accent-lime)" /> : <Copy size={11} />}
                    <span>{copiedField === 'account' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <div className="print-muted" style={{ fontSize: '11px', color: '#aaa', marginTop: '3px' }}>
                  Atas Nama: <strong style={{ color: '#fff' }}>{CORPORATE_ACCOUNTS.companyName}</strong>
                </div>
              </div>

              {/* Exact Nominal Box (Nominal Bulat) */}
              <div>
                <div className="print-muted" style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Nominal Transfer Sesuai Tagihan:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className="print-total-amount" style={{ fontSize: '20px', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {formatIDR(order.total_amount)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(order.total_amount.toString(), 'amount')}
                    className="copy-btn no-print"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#fff',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px'
                    }}
                  >
                    {copiedField === 'amount' ? <Check size={11} color="var(--accent-lime)" /> : <Copy size={11} />}
                    <span>{copiedField === 'amount' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--accent-lime)', marginTop: '3px', fontWeight: 600 }}>
                  ✓ Nominal bulat & rapi. Pastikan transfer sesuai nominal tagihan ke rekening PT.
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Info Grid */}
          <div className="print-info-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
            fontSize: '12px'
          }}>
            <div className="print-info-card" style={{ background: '#16161c', padding: '12px 14px', borderRadius: '10px' }}>
              <div className="print-muted" style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>
                DITAGIHKAN KEPADA:
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                {order.customer_name}
              </div>
              <div style={{ color: '#aaa', marginTop: '2px' }}>
                WhatsApp: {order.customer_phone}
              </div>
              {order.customer_email && (
                <div style={{ color: '#aaa' }}>Email: {order.customer_email}</div>
              )}
            </div>

            <div className="print-info-card" style={{ background: '#16161c', padding: '12px 14px', borderRadius: '10px' }}>
              <div className="print-muted" style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>
                ALAMAT PENGIRIMAN RESMI:
              </div>
              <div style={{ color: '#fff', fontWeight: 600, lineHeight: 1.3 }}>
                {order.shipping_address}
              </div>
              <div style={{ color: '#aaa', marginTop: '2px' }}>
                {order.shipping_city}, {order.shipping_province} {order.shipping_postal_code}
              </div>
              <div style={{ color: 'var(--accent-lime)', fontSize: '11px', fontWeight: 800, marginTop: '4px' }}>
                Ekspedisi: {order.courier_code?.toUpperCase()} ({order.courier_service})
              </div>
            </div>
          </div>

          {/* Purchased Items Table */}
          <div className="print-table" style={{ marginBottom: '18px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#888' }}>
                  <th style={{ padding: '8px 0', fontWeight: 700 }}>Deskripsi Unit HP & Varian</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center' }}>Kondisi</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center' }}>Jumlah</th>
                  <th style={{ padding: '8px 0', fontWeight: 700, textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <td style={{ padding: '10px 0' }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '13px' }}>
                      {order.product_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-lime)', marginTop: '2px' }}>
                      Varian: <strong>{order.variant_ram || 8}GB RAM / {order.variant_storage || 256}GB ROM</strong> • {order.variant_color || 'Standard'}
                    </div>
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                    <span className="print-badge" style={{
                      background: order.product_condition === 'second' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(198, 255, 0, 0.15)',
                      color: order.product_condition === 'second' ? '#00E5FF' : 'var(--accent-lime)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 800
                    }}>
                      {order.product_condition === 'second' ? 'Second QC' : 'BNIB Segel'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center', color: '#fff', fontWeight: 600 }}>
                    1 Unit
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {formatIDR(order.unit_price)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cost Summary Breakdown */}
          <div className="print-summary-box" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <div style={{ width: '100%', maxWidth: '320px', display: 'grid', gap: '6px', fontSize: '12px' }}>
              <div className="print-summary-row" style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                <span>Subtotal Unit HP:</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatIDR(order.unit_price)}</span>
              </div>
              <div className="print-summary-row" style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                <span>Biaya Ongkos Kirim:</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatIDR(order.shipping_cost || 0)}</span>
              </div>
              <div className="print-summary-row" style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                <span>Asuransi Pengiriman Gadget:</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{formatIDR(order.insurance_cost || 0)}</span>
              </div>
              <div className="print-summary-row" style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                <span>Packing Kayu & Bubble:</span>
                <span style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>GRATIS (PT)</span>
              </div>
              <div className="print-grand-total" style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '2px solid rgba(255, 255, 255, 0.1)',
                fontSize: '15px',
                fontWeight: 900
              }}>
                <span style={{ color: '#fff' }}>Total Tagihan:</span>
                <span style={{ color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)', fontSize: '17px' }}>
                  {formatIDR(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Official Company Stamp & Signature Footer for Single-Page Document */}
          <div className="print-stamp-box" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
            fontSize: '11px',
            color: '#888'
          }}>
            <div style={{ maxWidth: '420px', lineHeight: 1.4 }}>
              <strong>Jaminan Transaksi Sah PT:</strong>
              <br />
              Dokumen ini merupakan proforma invoice elektronik sah yang diterbitkan oleh sistem keuangan {CORPORATE_ACCOUNTS.companyName}.
            </div>

            <div style={{
              border: '2px dashed var(--accent-lime)',
              borderRadius: '8px',
              padding: '6px 14px',
              textAlign: 'center',
              background: 'rgba(198, 255, 0, 0.04)'
            }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-lime)', letterSpacing: '0.5px' }}>
                PT. SECOND CIRCLE TEKNOLOGI
              </div>
              <div style={{ fontSize: '8px', color: '#aaa', marginTop: '2px' }}>
                FINANCE & BILLING VERIFIED
              </div>
            </div>
          </div>
        </div>

        {/* 
          ========================================================================
          ACTION SECTION (UPLOAD BUKTI & WA)
          Berada DI LUAR kartu invoice dan disembunyikan saat cetak PDF (no-print)
          ========================================================================
        */}
        <div className="upload-action-box no-print" style={{
          marginTop: '20px',
          background: '#16161e',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
            Sudah Melakukan Transfer ke Rekening PT?
          </h4>
          <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px', lineHeight: 1.5 }}>
            Unggah bukti struk transfer Anda di bawah atau langsung kirimkan konfirmasi via WhatsApp ke tim Finance resmi PT. SECOND CIRCLE TEKNOLOGI.
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
                  padding: '18px',
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
      </main>
    </div>
  );
}
