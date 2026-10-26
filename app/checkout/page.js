'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Truck, 
  Building2, 
  CreditCard, 
  Lock, 
  AlertCircle, 
  ChevronRight, 
  Smartphone,
  Copy,
  Check,
  PackageCheck,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  formatIDR, 
  CORPORATE_ACCOUNTS, 
  generateOrderNumber 
} from '../lib/utils';
import { 
  INDONESIA_PROVINCES, 
  CITIES_BY_PROVINCE, 
  COURIERS, 
  getShippingRate, 
  calculateGadgetInsurance 
} from '../data/indonesiaShipping';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params from product detail
  const productId = searchParams.get('productId') || '';
  const productName = searchParams.get('name') || 'Smartphone Flagship Killer';
  const initialPrice = Number(searchParams.get('price')) || 5499000;
  const variantRam = searchParams.get('ram') || '12';
  const variantStorage = searchParams.get('storage') || '512';
  const variantColor = searchParams.get('color') || 'Black';
  const condition = searchParams.get('condition') || 'baru';
  const productImage = searchParams.get('image') || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80';

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Shipping Destination State
  const [selectedProvince, setSelectedProvince] = useState('DKI Jakarta');
  const [selectedCity, setSelectedCity] = useState('Jakarta Selatan');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressDetails, setAddressDetails] = useState('');

  // Logistics / Courier State
  const [selectedCourier, setSelectedCourier] = useState('jne');
  const [serviceType, setServiceType] = useState('reg'); // 'reg' | 'express'
  const [useInsurance, setUseInsurance] = useState(true);

  // Corporate Payment Bank Selection
  const [selectedBankId, setSelectedBankId] = useState('bca');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update cities when province changes
  useEffect(() => {
    const availableCities = CITIES_BY_PROVINCE[selectedProvince] || [];
    if (availableCities.length > 0 && !availableCities.includes(selectedCity)) {
      setSelectedCity(availableCities[0]);
    }
  }, [selectedProvince, selectedCity]);

  // Calculate dynamic shipping cost
  const shippingCalculation = useMemo(() => {
    return getShippingRate(selectedProvince, selectedCourier, serviceType);
  }, [selectedProvince, selectedCourier, serviceType]);

  // Calculate insurance
  const insuranceCost = useMemo(() => {
    return useInsurance ? calculateGadgetInsurance(initialPrice) : 0;
  }, [initialPrice, useInsurance]);

  // Grand Total Calculation (Tanpa Kode Unik - Nominal Bulat & Rapi)
  const subtotal = initialPrice;
  const shippingCost = shippingCalculation.cost;
  const grandTotal = subtotal + shippingCost + insuranceCost;

  // Selected Bank Object
  const selectedBank = useMemo(() => {
    return CORPORATE_ACCOUNTS.banks.find(b => b.id === selectedBankId) || CORPORATE_ACCOUNTS.banks[0];
  }, [selectedBankId]);

  // Submit Order to PT
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Harap isi Nama Lengkap Penerima.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 9) {
      setErrorMessage('Harap masukkan Nomor WhatsApp aktif untuk konfirmasi pengiriman.');
      return;
    }
    if (!addressDetails.trim()) {
      setErrorMessage('Harap isi Alamat Lengkap pengiriman.');
      return;
    }

    setSubmitting(true);

    const orderNumber = generateOrderNumber();
    const orderData = {
      order_number: orderNumber,
      product_id: productId && productId.length > 10 ? productId : null,
      product_name: productName,
      product_condition: condition,
      product_image: productImage,
      variant_ram: Number(variantRam) || null,
      variant_storage: Number(variantStorage) || null,
      variant_color: variantColor,
      unit_price: subtotal,
      quantity: 1,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      shipping_province: selectedProvince,
      shipping_city: selectedCity,
      shipping_district: district,
      shipping_postal_code: postalCode,
      shipping_address: addressDetails,
      courier_code: selectedCourier,
      courier_service: serviceType.toUpperCase(),
      shipping_cost: shippingCost,
      insurance_cost: insuranceCost,
      unique_code: 0,
      total_amount: grandTotal,
      payment_method: 'bank_transfer_pt',
      bank_name: selectedBank.bankName,
      bank_account_name: CORPORATE_ACCOUNTS.companyName,
      bank_account_number: selectedBank.accountNumber,
      payment_status: 'menunggu_pembayaran',
      notes: notes || null,
      created_at: new Date().toISOString()
    };

    try {
      // 1. Try to persist to Supabase dapur_orders table
      const { data, error } = await supabase
        .from('dapur_orders')
        .insert([orderData])
        .select()
        .single();

      const savedId = data?.id || orderNumber;

      // 2. Also save to localStorage as backup/offline resilience
      try {
        localStorage.setItem(`aduhp_order_${savedId}`, JSON.stringify(orderData));
        localStorage.setItem(`aduhp_order_${orderNumber}`, JSON.stringify(orderData));
      } catch (storageErr) {
        // Ignore quota errors
      }

      // 3. Redirect to invoice page
      router.push(`/invoice/${savedId}`);
    } catch (err) {
      console.warn('Fallback saving order:', err);
      // Fallback: save to localStorage and proceed
      localStorage.setItem(`aduhp_order_${orderNumber}`, JSON.stringify(orderData));
      router.push(`/invoice/${orderNumber}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* 1. Checkout Top Navbar */}
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
                <span>Batal / Kembali</span>
              </button>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>
                Checkout & Pengiriman Resmi
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#aaa' }}>
              <Lock size={14} color="var(--accent-lime)" />
              <span>Enkripsi Transaksi SSL 256-bit</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Checkout Form & Summary */}
      <main className="container" style={{ marginTop: '28px' }}>
        <form onSubmit={handleCreateOrder}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px',
            alignItems: 'start'
          }}>
            {/* LEFT COLUMN: CUSTOMER DATA, ADDRESS & LOGISTICS */}
            <div>
              {/* Error Alert */}
              {errorMessage && (
                <div style={{
                  background: 'rgba(255, 69, 58, 0.12)',
                  border: '1px solid rgba(255, 69, 58, 0.4)',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  color: '#FF6B6B',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px'
                }}>
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Section: Data Penerima */}
              <div style={{
                background: '#121216',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👤</span> 1. Data Penerima & Kontak
                </h3>

                <div style={{ display: 'grid', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: 600 }}>
                      Nama Lengkap Penerima <span style={{ color: '#FF453A' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: 600 }}>
                        No. WhatsApp Aktif <span style={{ color: '#FF453A' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Contoh: 08123456789"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#777', marginTop: '4px', display: 'block' }}>
                        Nomor resi & invoice akan dikirim ke WhatsApp ini.
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: 600 }}>
                        Email (Opsional)
                      </label>
                      <input
                        type="email"
                        placeholder="budi@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Section: Alamat Pengiriman */}
              <div style={{
                background: '#121216',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍</span> 2. Alamat Lengkap Tujuan
                </h3>

                <div style={{ display: 'grid', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: 600 }}>
                        Provinsi
                      </label>
                      <select
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: '#1a1a22',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#fff',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        {INDONESIA_PROVINCES.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: 600 }}>
                        Kota / Kabupaten
                      </label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: '#1a1a22',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#fff',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        {(CITIES_BY_PROVINCE[selectedProvince] || []).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: 600 }}>
                        Kecamatan / Kelurahan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Kec. Pasar Minggu, Kel. Pejaten Barat"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: 600 }}>
                        Kode Pos
                      </label>
                      <input
                        type="text"
                        placeholder="12510"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '6px', fontWeight: 600 }}>
                      Nama Jalan, No. Rumah, RT/RW, Patokan <span style={{ color: '#FF453A' }}>*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Contoh: Jl. Kemang Raya No. 45 RT 02/05 (Pagar putih, samping Indomaret)"
                      value={addressDetails}
                      onChange={(e) => setAddressDetails(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Section: Ekspedisi & Ongkos Kirim (Ongkir) */}
              <div style={{
                background: '#121216',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={18} color="var(--accent-lime)" /> 3. Pilihan Ekspedisi & Biaya Ongkir
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--accent-lime)', fontWeight: 700 }}>
                    Tujuan: {selectedCity}
                  </span>
                </div>

                {/* Courier Selection Chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  {COURIERS.map((c) => {
                    const isSelected = selectedCourier === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCourier(c.id)}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          background: isSelected ? 'rgba(198, 255, 0, 0.08)' : '#1a1a22',
                          border: isSelected ? '2px solid var(--accent-lime)' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{c.logo}</div>
                        <div style={{ fontSize: '13px', fontWeight: 800 }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Standar Gadget Box</div>
                      </button>
                    );
                  })}
                </div>

                {/* Service Type (Reguler vs Express) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  <button
                    type="button"
                    onClick={() => setServiceType('reg')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: serviceType === 'reg' ? 'rgba(255, 255, 255, 0.08)' : '#16161c',
                      border: serviceType === 'reg' ? '2px solid var(--accent-lime)' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800 }}>Layanan Reguler</span>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--accent-lime)' }}>
                        {formatIDR(getShippingRate(selectedProvince, selectedCourier, 'reg').cost)}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                      Estimasi: {getShippingRate(selectedProvince, selectedCourier, 'reg').eta}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('express')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: serviceType === 'express' ? 'rgba(255, 255, 255, 0.08)' : '#16161c',
                      border: serviceType === 'express' ? '2px solid var(--accent-lime)' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800 }}>Layanan Kilat (YES)</span>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--accent-lime)' }}>
                        {formatIDR(getShippingRate(selectedProvince, selectedCourier, 'express').cost)}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                      Estimasi: {getShippingRate(selectedProvince, selectedCourier, 'express').eta}
                    </div>
                  </button>
                </div>

                {/* Gadget Insurance Checkbox */}
                <div style={{
                  background: 'rgba(198, 255, 0, 0.04)',
                  border: '1px solid rgba(198, 255, 0, 0.25)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="insurance"
                      checked={useInsurance}
                      onChange={(e) => setUseInsurance(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-lime)' }}
                    />
                    <label htmlFor="insurance" style={{ cursor: 'pointer' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} color="var(--accent-lime)" />
                        <span>Proteksi Asuransi Pengiriman Gadget (Direkomendasikan)</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                        Penggantian 100% dari PT jika paket hilang / rusak fisik selama di perjalanan ekspedisi.
                      </div>
                    </label>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                    +{formatIDR(calculateGadgetInsurance(initialPrice))}
                  </div>
                </div>

                {/* Free Wooden Packing Notice */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#888', marginTop: '12px' }}>
                  <PackageCheck size={14} color="var(--accent-lime)" />
                  <span>Packing kayu tebal & bubble wrap gratis ditanggung oleh PT ADU HP INDONESIA.</span>
                </div>
              </div>

              {/* 4. Section: Pilihan Rekening Pembayaran PT */}
              <div style={{
                background: '#121216',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={18} color="var(--accent-lime)" /> 4. Rekening Pembayaran Resmi PT
                  </h3>
                  <p style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                    Pembayaran transaksi sah <strong>hanya ditujukan ke rekening berbadan hukum PT ADU HP INDONESIA</strong>. Kami tidak pernah meminta transfer ke rekening atas nama perorangan/pribadi.
                  </p>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {CORPORATE_ACCOUNTS.banks.map((bank) => {
                    const isSelected = selectedBankId === bank.id;
                    return (
                      <div
                        key={bank.id}
                        onClick={() => setSelectedBankId(bank.id)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(198, 255, 0, 0.06)' : '#16161c',
                          border: isSelected ? '2px solid var(--accent-lime)' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            background: bank.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            color: '#fff',
                            fontSize: '12px'
                          }}>
                            {bank.id.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                              {bank.bankName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#aaa' }}>
                              a.n. <strong style={{ color: '#eee' }}>{bank.accountName}</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            background: isSelected ? 'rgba(198, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            color: isSelected ? 'var(--accent-lime)' : '#aaa',
                            padding: '4px 10px',
                            borderRadius: '100px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {bank.badge}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY & SUBMIT */}
            <div style={{ position: 'sticky', top: '90px' }}>
              <div style={{
                background: '#14141a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
                  Ringkasan Pesanan HP
                </h3>

                {/* Product Card Snippet */}
                <div style={{
                  display: 'flex',
                  gap: '14px',
                  paddingBottom: '18px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '18px'
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productImage}
                    alt={productName}
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '10px',
                      objectFit: 'contain',
                      background: '#1c1c24',
                      padding: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: condition === 'second' ? '#00E5FF' : 'var(--accent-lime)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {condition === 'second' ? 'Certified Second QC' : '100% Baru BNIB Segel'}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginTop: '2px' }}>
                      {productName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                      Varian: <strong>{variantRam}GB / {variantStorage}GB</strong> • {variantColor}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                      {formatIDR(subtotal)}
                    </div>
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div style={{ display: 'grid', gap: '10px', fontSize: '13px', color: '#aaa', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal Harga Unit ({variantRam}GB/{variantStorage}GB):</span>
                    <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{formatIDR(subtotal)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ongkos Kirim ({COURIERS.find(c => c.id === selectedCourier)?.name} - {serviceType.toUpperCase()}):</span>
                    <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{formatIDR(shippingCost)}</span>
                  </div>

                  {useInsurance && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Asuransi Gadget Resmi:</span>
                      <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{formatIDR(insuranceCost)}</span>
                    </div>
                  )}
                </div>

                {/* Total Payment Amount */}
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888' }}>Grand Total Tagihan:</div>
                      <div style={{ fontSize: '11px', color: 'var(--accent-lime)' }}>Include Ongkir & Asuransi</div>
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      color: 'var(--accent-lime)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {formatIDR(grandTotal)}
                    </div>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '15px',
                    fontWeight: 900,
                    background: 'var(--accent-lime)',
                    color: '#000',
                    justifyContent: 'center',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    boxShadow: '0 8px 24px rgba(198, 255, 0, 0.25)'
                  }}
                >
                  {submitting ? 'Memproses Pesanan...' : 'Buat Pesanan & Bayar ke Rekening PT'}
                </button>

                {/* Legal Guarantee Badge */}
                <div style={{
                  marginTop: '18px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  fontSize: '11px',
                  color: '#888',
                  lineHeight: 1.5,
                  textAlign: 'center'
                }}>
                  🔒 Dengan melanjutkan, pesanan Anda terlindungi oleh <strong>Garansi Pembayaran PT ADU HP INDONESIA</strong>. Stok unit Anda akan dikunci selama masa transfer.
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Memuat halaman checkout...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
