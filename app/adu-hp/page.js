'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowLeft, 
  RefreshCw, 
  Award, 
  Flame, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  Cpu, 
  Gauge, 
  Search, 
  X, 
  MessageCircle, 
  TrendingUp, 
  Zap, 
  Layers, 
  Activity, 
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Check,
  Lock,
  Trophy,
  Radio,
  Play
} from 'lucide-react';
import { ALL_PHONES, PRICE_TIERS, BRAND_OPTIONS } from '../data/entryPhones';

function formatIDR(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Preset Head-to-Head Derby Aduan per Kategori Harga
const PRESET_DERBIES = [
  {
    id: 'derby-flagship',
    label: '👑 Raja Flagship (AnTuTu 2 Juta+)',
    tier: 'flagship',
    desc: 'Galaxy S24 Ultra vs iPhone 16 Pro Max vs Xiaomi 14 Ultra',
    phoneIds: ['samsung-galaxy-s24-ultra', 'iphone-16-pro-max', 'xiaomi-14-ultra']
  },
  {
    id: 'derby-flagship-killer',
    label: '🚀 Flagship Killer (Rp 4 - 8 Juta)',
    tier: '4-8-jt',
    desc: 'Poco F6 vs Galaxy A55 vs Xiaomi 14T Leica',
    phoneIds: ['poco-f6', 'samsung-galaxy-a55', 'xiaomi-14t']
  },
  {
    id: 'derby-2jt',
    label: '⚡ Mid-Range Best Value (Rp 2 - 4 Juta)',
    tier: '2-4-jt',
    desc: 'Infinix Hot 50 Pro+ vs Galaxy A15 vs Poco X6 5G',
    phoneIds: ['infinix-hot-50-pro-plus', 'samsung-galaxy-a15', 'poco-x6-5g']
  },
  {
    id: 'derby-1jt',
    label: '💰 Entry Level Hemat (Rp 1 - 2 Juta)',
    tier: '1-2-jt',
    desc: 'Redmi 14C (120Hz) vs Galaxy A06 (Knox) vs Poco M6 (108MP)',
    phoneIds: ['redmi-14c', 'samsung-galaxy-a06', 'poco-m6']
  },
  {
    id: 'derby-cross-tier',
    label: '⚔️ Duel Lintas Kelas (Entry vs Mid vs Flagship)',
    tier: 'all',
    desc: 'Redmi 14C (Rp 1.3jt) vs Poco F6 (Rp 5.4jt) vs S24 Ultra (Rp 21.9jt)',
    phoneIds: ['redmi-14c', 'poco-f6', 'samsung-galaxy-s24-ultra']
  }
];

export default function AduHpDedicatedPage() {
  // Active Main Price Tier Filter
  const [activeMainPriceTier, setActiveMainPriceTier] = useState('all');

  // Current active phones in the 3 battle slots (Default: Lintas Kelas)
  const [selectedPhoneIds, setSelectedPhoneIds] = useState([
    'infinix-hot-50-pro-plus',
    'poco-f6',
    'samsung-galaxy-s24-ultra'
  ]);

  // Battle state: 'idle' (waiting for user to click Start) | 'battling' (running simulation) | 'ready' (results revealed)
  const [battleState, setBattleState] = useState('idle');
  const [battleProgress, setBattleProgress] = useState(0);
  const [battlePhaseText, setBattlePhaseText] = useState('Mengunci spesifikasi hardware...');
  const [liveTickerNumber, setLiveTickerNumber] = useState(850000);

  // Modal selector state
  const [swapSlotIndex, setSwapSlotIndex] = useState(null); // 0, 1, or 2
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Semua Brand');
  const [selectedPriceTier, setSelectedPriceTier] = useState('all');
  const [activeTab, setActiveTab] = useState('antutu'); // 'antutu' | 'gaming' | 'specs' | 'verdict'
  const [activeDerby, setActiveDerby] = useState('derby-cross-tier');
  const [showToast, setShowToast] = useState(null);

  // Get full phone objects
  const slotPhones = useMemo(() => {
    return selectedPhoneIds.map(id => {
      return ALL_PHONES.find(p => p.id === id) || ALL_PHONES[0];
    });
  }, [selectedPhoneIds]);

  // Find max scores dynamically from the current slot phones for high-contrast comparative bars
  const maxAnTuTu = useMemo(() => {
    return Math.max(...slotPhones.map(p => p.antutu.total), 1);
  }, [slotPhones]);

  const maxCPU = useMemo(() => {
    return Math.max(...slotPhones.map(p => p.antutu.cpu), 1);
  }, [slotPhones]);

  const maxGPU = useMemo(() => {
    return Math.max(...slotPhones.map(p => p.antutu.gpu), 1);
  }, [slotPhones]);

  const maxMemory = useMemo(() => {
    return Math.max(...slotPhones.map(p => p.antutu.memory), 1);
  }, [slotPhones]);

  const maxUX = useMemo(() => {
    return Math.max(...slotPhones.map(p => p.antutu.ux), 1);
  }, [slotPhones]);

  // Determine the highest AnTuTu score among current compared slots
  const highestAnTuTuSlotIdx = useMemo(() => {
    let max = -1;
    let maxIdx = 0;
    slotPhones.forEach((phone, idx) => {
      if (phone.antutu.total > max) {
        max = phone.antutu.total;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [slotPhones]);

  // Calculate AnTuTu value score (points per Rp 1.000)
  function getVfmScore(phone) {
    if (!phone?.price) return 0;
    return (phone.antutu.total / (phone.price / 1000)).toFixed(1);
  }

  // Filter phones for swap modal
  const filteredCatalog = useMemo(() => {
    return ALL_PHONES.filter(phone => {
      const matchSearch = phone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          phone.specs.chipset.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBrand = selectedBrand === 'Semua Brand' || phone.brand.toLowerCase() === selectedBrand.toLowerCase();
      const matchTier = selectedPriceTier === 'all' || phone.price_tier === selectedPriceTier;
      return matchSearch && matchBrand && matchTier;
    });
  }, [searchQuery, selectedBrand, selectedPriceTier]);

  function handleStartBattle() {
    setBattleState('battling');
    setBattleProgress(0);
    setBattlePhaseText('📡 Mengunci arsitektur chipset, fabrikasi nm & clock speed...');

    const startTime = Date.now();
    const duration = 2200; // 2.2 seconds simulation

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.round((elapsed / duration) * 100), 100);
      setBattleProgress(progress);

      // Random dynamic rolling AnTuTu score ticker
      setLiveTickerNumber(Math.floor(450000 + Math.random() * 1650000));

      if (progress < 25) {
        setBattlePhaseText('📡 Memindai arsitektur chipset, fabrikasi nm & sensor...');
      } else if (progress < 55) {
        setBattlePhaseText('🔥 Stress test CPU multi-core & render 3D AnTuTu v10...');
      } else if (progress < 80) {
        setBattlePhaseText('🎮 Menguji frame-rate (FPS) Mobile Legends, PUBG & Genshin...');
      } else if (progress < 100) {
        setBattlePhaseText('👑 Mengkalkulasi stabilitas thermal & menentukan sang juara...');
      } else {
        clearInterval(interval);
        setBattleState('ready');
        triggerToast('🏆 Adu HP Selesai! Hasil Benchmark & Gaming Terbuka!');
      }
    }, 40);
  }

  function handleResetBattle() {
    setBattleState('idle');
    setBattleProgress(0);
    triggerToast('Arena di-reset. Pilih petarung lalu tekan Start!');
  }

  function handleSwapPhone(newPhoneId) {
    if (swapSlotIndex === null) return;
    setSelectedPhoneIds(prev => {
      const next = [...prev];
      next[swapSlotIndex] = newPhoneId;
      return next;
    });
    setSwapSlotIndex(null);
    setBattleState('idle'); // Hide results until Start is clicked
    triggerToast('HP baru masuk arena! Tekan Start untuk mengadu.');
  }

  function handleSelectDerby(derby) {
    setActiveDerby(derby.id);
    setSelectedPhoneIds(derby.phoneIds);
    if (derby.tier) {
      setActiveMainPriceTier(derby.tier);
    }
    setBattleState('idle'); // Hide results until Start is clicked
    triggerToast(`Pilihan ${derby.label} siap. Tekan Start untuk mengadu!`);
  }

  function handleSelectMainTier(tierId) {
    setActiveMainPriceTier(tierId);
    setSelectedPriceTier(tierId);
    if (tierId === '1-2-jt') {
      setSelectedPhoneIds(['redmi-14c', 'samsung-galaxy-a06', 'poco-m6']);
      setActiveDerby('derby-1jt');
      triggerToast('Memuat HP Pilihan Kelas Rp 1 - 2 Jutaan. Tekan Start untuk mengadu!');
    } else if (tierId === '2-4-jt') {
      setSelectedPhoneIds(['infinix-hot-50-pro-plus', 'samsung-galaxy-a15', 'poco-x6-5g']);
      setActiveDerby('derby-2jt');
      triggerToast('Memuat HP Pilihan Kelas Rp 2 - 4 Jutaan. Tekan Start untuk mengadu!');
    } else if (tierId === '4-8-jt') {
      setSelectedPhoneIds(['poco-f6', 'samsung-galaxy-a55', 'xiaomi-14t']);
      setActiveDerby('derby-flagship-killer');
      triggerToast('Memuat HP Pilihan Kelas Rp 4 - 8 Jutaan. Tekan Start untuk mengadu!');
    } else if (tierId === 'flagship') {
      setSelectedPhoneIds(['samsung-galaxy-s24-ultra', 'iphone-16-pro-max', 'xiaomi-14-ultra']);
      setActiveDerby('derby-flagship');
      triggerToast('Memuat HP Pilihan Di Atas Rp 8 Juta (Ultra Flagship). Tekan Start!');
    } else {
      setSelectedPhoneIds(['infinix-hot-50-pro-plus', 'poco-f6', 'samsung-galaxy-s24-ultra']);
      setActiveDerby('derby-cross-tier');
      triggerToast('Menampilkan Semua Kategori HP. Tekan Start untuk mengadu!');
    }
    setBattleState('idle'); // Hide results until Start is clicked
  }

  function triggerToast(msg) {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 2800);
  }

  function makeWhatsAppUrl(phone) {
    const text = encodeURIComponent(
      `Halo Tim Official aduHP! Saya ingin order unit Baru BNIB dari Menu Adu HP:\n\n` +
      `📱 Model: ${phone.name}\n` +
      `📦 Kondisi: 100% Baru Segel (BNIB Resmi)\n` +
      `🛡️ Garansi: ${phone.official_distributor}\n` +
      `⚡ Skor AnTuTu v10: ${phone.antutu.total.toLocaleString('id-ID')} Poin\n` +
      `💰 Harga Promo: ${formatIDR(phone.price)}\n\n` +
      `Mohon info kesiapan unit & pengiriman dengan packing kayu asuransi.`
    );
    return `https://wa.me/6281234567890?text=${text}`;
  }

  return (
    <>
      {/* 1. Header Navbar */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="brand-wrapper">
              <div className="brand-vs-box">
                VS
              </div>
              <div className="brand-meta">
                <div className="brand-title-row">
                  <span className="brand-name">AduHP</span>
                  <span className="brand-mvp-badge">ARENA ADU</span>
                </div>
                <span className="brand-tagline">Menu Khusus Adu HP Baru & Skor AnTuTu</span>
              </div>
            </Link>

            <nav className="nav-menu">
              <Link href="/" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} />
                <span>Beranda</span>
              </Link>

              <button 
                className="nav-link active"
                style={{
                  background: 'rgba(198, 255, 0, 0.12)',
                  borderColor: 'var(--accent-lime)',
                  color: 'var(--accent-lime)',
                  fontWeight: 800
                }}
              >
                <span>⚔️</span>
                <span>Menu Adu HP</span>
              </button>

              <button 
                onClick={() => setSwapSlotIndex(0)} 
                className="nav-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Smartphone size={14} />
                <span>Ganti Model</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#121212',
          border: '1px solid var(--accent-lime)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(198, 255, 0, 0.25)',
          borderRadius: '12px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 700
        }}>
          <Sparkles size={16} color="var(--accent-lime)" />
          <span>{showToast}</span>
        </div>
      )}

      <main className="page-wrapper" style={{ paddingTop: '20px' }}>
        <div className="container">
          
          {/* 2. Hero Section Header for Adu HP */}
          <div className="adu-page-header">
            <div className="adu-badge-hero">
              <Sparkles size={14} />
              <span>100% HANDPHONE BARU BNIB • BENCHMARK ANTUTU v10 • LENGKAP ENTRY S/D FLAGSHIP</span>
            </div>

            <h1 className="adu-title">
              Menu Adu HP Baru & <span className="adu-title-accent">Skor Benchmark AnTuTu</span>
            </h1>

            <p className="adu-subtitle">
              Pilih tier harga: <strong>Rp 1 - 2 Jutaan</strong>, <strong>Rp 2 - 4 Jutaan</strong>, <strong>Rp 4 - 8 Jutaan</strong>, hingga <strong>Ultra Flagship (8 Juta+)</strong>. Telusuri skor AnTuTu v10 asli, performa gaming FPS, efisiensi chipset, hingga rasio nilai per rupiah!
            </p>

            {/* Pilihan Kategori Harga HP: 1-2 Juta, 2-4 Juta, 4-8 Juta, Flagship */}
            <div className="price-tier-selector-container">
              <div className="price-tier-header-label">
                <SlidersHorizontal size={14} color="var(--accent-lime)" />
                <span>PILIH TIER HARGA HANDPHONE:</span>
              </div>
              <div className="price-tier-pills-row">
                {PRICE_TIERS.map(tier => {
                  const isSelected = activeMainPriceTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => handleSelectMainTier(tier.id)}
                      className={`price-tier-pill-btn ${isSelected ? 'active' : ''}`}
                      style={{
                        border: isSelected ? `1.5px solid ${tier.color}` : '1px solid var(--border-subtle)',
                        boxShadow: isSelected ? `0 0 20px ${tier.color}33` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13.5px', color: isSelected ? tier.color : '#fff' }}>
                          {tier.label}
                        </span>
                        {tier.badge && (
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            background: isSelected ? tier.color : 'rgba(255,255,255,0.08)',
                            color: isSelected ? '#000' : '#888',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {tier.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: isSelected ? '#eee' : '#777' }}>
                        {tier.range}
                      </div>
                      {tier.antutuAvg && (
                        <div style={{ fontSize: '10px', color: isSelected ? tier.color : '#555', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                          AnTuTu {tier.antutuAvg}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Match / Derby Presets */}
            <div className="preset-matches-wrapper">
              <div className="preset-title">
                <Flame size={14} color="#FF9100" />
                <span>Pilih Aduan Populer (1-Klik Langsung Duel):</span>
              </div>
              <div className="preset-pills-row">
                {PRESET_DERBIES.map(derby => (
                  <button
                    key={derby.id}
                    onClick={() => handleSelectDerby(derby)}
                    className={`preset-pill-btn ${activeDerby === derby.id ? 'active' : ''}`}
                    title={derby.desc}
                  >
                    <span>{derby.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Meja Aduan 3 Slots Grid */}
          {/* 3. Meja Aduan 3 Slots Grid */}
          <div className="adu-slots-grid">
            {slotPhones.map((phone, idx) => {
              const isHighestAnTuTu = idx === highestAnTuTuSlotIdx;
              const vfm = getVfmScore(phone);

              return (
                <div 
                  key={phone.id + '-' + idx} 
                  className={`adu-slot-card ${battleState === 'ready' && isHighestAnTuTu ? 'slot-winner' : ''} ${battleState === 'battling' ? 'slot-scanning-active' : ''}`}
                >
                  {/* Top Bar Label */}
                  <div className="slot-top-row">
                    <div className="slot-label">
                      <span>SLOT {idx + 1}</span>
                      {battleState === 'ready' && isHighestAnTuTu && (
                        <span style={{ 
                          color: 'var(--accent-lime)', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontWeight: 800
                        }}>
                          <Award size={12} />
                          <span>TERKENCANG</span>
                        </span>
                      )}
                    </div>
                    <div className="slot-new-badge">
                      100% BARU (BNIB)
                    </div>
                  </div>

                  {/* Phone Image Container */}
                  <div className="slot-image-box">
                    <img src={phone.images[0]} alt={phone.name} />
                  </div>

                  {/* Distributor Resmi Tag */}
                  <div className="slot-distributor-badge">
                    <ShieldCheck size={13} />
                    <span>{phone.official_distributor}</span>
                  </div>

                  {/* Phone Title */}
                  <h2 className="slot-title">{phone.name}</h2>

                  {/* Price */}
                  <div className="slot-price-row">
                    <span className="slot-price-current">{formatIDR(phone.price)}</span>
                    {phone.original_price && (
                      <span className="slot-price-old">{formatIDR(phone.original_price)}</span>
                    )}
                  </div>

                  {/* CONDITIONAL: AnTuTu Box (Revealed only when battle completed) vs Locked Placeholder (Idle/Battling) */}
                  {battleState === 'ready' ? (
                    <>
                      {/* AnTuTu Spotlight Card */}
                      <div className="antutu-spotlight-card" style={{ animation: 'revealFadeIn 0.5s ease' }}>
                        <div className="antutu-spotlight-header">
                          <div className="antutu-badge-mini">
                            <Flame size={11} />
                            <span>ANTUTU v10</span>
                          </div>
                          <span className="antutu-tier-label">{phone.antutu.tier}</span>
                        </div>

                        <div className="antutu-score-huge">
                          {phone.antutu.total.toLocaleString('id-ID')}
                          <span style={{ fontSize: '13px', color: '#999', fontWeight: 600, marginLeft: '6px' }}>Poin</span>
                        </div>

                        <div className="antutu-subscores-grid">
                          <div className="subscore-item">
                            <span className="subscore-label">CPU (Proses)</span>
                            <span className="subscore-value" style={{ color: '#60a5fa' }}>
                              {phone.antutu.cpu.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="subscore-item">
                            <span className="subscore-label">GPU (Gaming)</span>
                            <span className="subscore-value" style={{ color: '#f87171' }}>
                              {phone.antutu.gpu.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="subscore-item">
                            <span className="subscore-label">Memory (RAM/ROM)</span>
                            <span className="subscore-value" style={{ color: '#fbbf24' }}>
                              {phone.antutu.memory.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="subscore-item">
                            <span className="subscore-label">UX (Kelancaran)</span>
                            <span className="subscore-value" style={{ color: '#34d399' }}>
                              {phone.antutu.ux.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Value for Money Index */}
                      <div className="vfm-badge-row">
                        <span className="vfm-label">⚡ Rasio Nilai (Poin/Rp 1.000):</span>
                        <span className="vfm-value">{vfm} Poin</span>
                      </div>
                    </>
                  ) : (
                    /* Locked Benchmark Box when idle or during battle simulation */
                    <div className="slot-locked-box">
                      <div className="locked-icon-badge">
                        <Lock size={12} />
                        <span>{battleState === 'battling' ? 'SEDANG MEMINDAI' : 'SKOR DIKUNCI'}</span>
                      </div>
                      <div className="locked-chipset-highlight">
                        <Cpu size={13} color="#60a5fa" />
                        <span>{phone.specs.chipset}</span>
                      </div>
                      <p className="locked-hint">
                        {battleState === 'battling' 
                          ? 'Menganalisis clock speed, fabrikasi & render 3D AnTuTu...' 
                          : 'Tekan tombol "MULAI ADU HP" di bawah untuk melihat skor & gaming FPS!'}
                      </p>
                      <div className="locked-meter-placeholder">
                        <div className="meter-placeholder-bar"></div>
                        <div className="meter-placeholder-bar short"></div>
                      </div>
                    </div>
                  )}

                  {/* Specs Quick Pill */}
                  <div style={{
                    fontSize: '11.5px',
                    color: '#888',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div>💻 <strong>Chipset:</strong> {phone.specs.chipset}</div>
                    <div>📱 <strong>Layar:</strong> {phone.specs.display}</div>
                    <div>🔋 <strong>Baterai:</strong> {phone.specs.battery}</div>
                  </div>

                  {/* Slot Actions */}
                  <div className="slot-actions">
                    <button
                      onClick={() => setSwapSlotIndex(idx)}
                      className="btn-slot-swap"
                    >
                      <RefreshCw size={13} />
                      <span>Ganti HP</span>
                    </button>

                    <a
                      href={makeWhatsAppUrl(phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-slot-order"
                    >
                      <MessageCircle size={14} />
                      <span>Beli Baru</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BATTLE LAUNCHER & SIMULATION HUD CONTROLLER */}
          <div className="battle-launcher-wrapper">
            {battleState === 'idle' && (
              <div className="battle-launcher-box">
                <div className="battle-ready-indicator">
                  <Flame size={13} />
                  <span>3 HANDPHONE TERPILIH SIAP DIADU</span>
                </div>
                <h3 className="battle-launcher-title">Mulai Duel Performa & Benchmark</h3>
                <p className="battle-launcher-desc">
                  Tekan tombol Start di bawah untuk menjalankan simulasi AnTuTu Benchmark v10 resmi, uji gaming FPS riil, dan penentuan juara!
                </p>
                <button 
                  onClick={handleStartBattle}
                  className="btn-start-battle-epic"
                  id="btn-start-adu"
                >
                  <Flame size={24} color="#000" />
                  <div className="btn-text-block">
                    <span className="btn-main-label">⚡ MULAI ADU HP SEKARANG!</span>
                    <span className="btn-sub-label">START ANTUTU v10 & GAMING FPS SIMULATION</span>
                  </div>
                  <Zap size={24} color="#000" />
                </button>
              </div>
            )}

            {battleState === 'battling' && (
              <div className="battle-sim-hud">
                <div className="sim-hud-header">
                  <div className="sim-hud-status">
                    <Radio size={16} />
                    <span>SIMULASI BENCHMARK SEDANG BERJALAN...</span>
                  </div>
                  <div className="sim-hud-ticker-label">
                    LIVE TELEMETRY: <strong>{liveTickerNumber.toLocaleString('id-ID')} PTS</strong>
                  </div>
                </div>

                <div className="sim-progress-track">
                  <div className="sim-progress-bar" style={{ width: `${battleProgress}%` }}></div>
                </div>

                <div className="sim-telemetry-row">
                  <div className="sim-phase-text">
                    <Cpu size={16} color="var(--accent-lime)" />
                    <span>{battlePhaseText}</span>
                  </div>
                  <div className="sim-percentage">{battleProgress}%</div>
                </div>

                <div className="sim-equalizer-bars">
                  <div className="sim-eq-bar"></div>
                  <div className="sim-eq-bar"></div>
                  <div className="sim-eq-bar"></div>
                  <div className="sim-eq-bar"></div>
                  <div className="sim-eq-bar"></div>
                  <div className="sim-eq-bar"></div>
                  <div className="sim-eq-bar"></div>
                  <div className="sim-eq-bar"></div>
                </div>
              </div>
            )}

            {battleState === 'ready' && (
              <div className="battle-winner-banner" style={{ width: '100%' }}>
                <div className="winner-banner-left">
                  <div className="winner-trophy-badge">
                    <Trophy size={32} />
                  </div>
                  <div className="winner-banner-meta">
                    <h3>
                      <span>👑 JUARA PERFORMA DITETAPKAN:</span>
                      <span className="winner-champion-name">{slotPhones[highestAnTuTuSlotIdx].name}</span>
                    </h3>
                    <p>
                      Mencetak skor tertinggi <strong>{slotPhones[highestAnTuTuSlotIdx].antutu.total.toLocaleString('id-ID')} Poin</strong> AnTuTu v10 dengan chipset <strong>{slotPhones[highestAnTuTuSlotIdx].specs.chipset}</strong>!
                    </p>
                  </div>
                </div>

                <div className="winner-banner-actions">
                  <button 
                    onClick={handleStartBattle}
                    className="btn-battle-replay"
                    title="Jalankan animasi duel lagi"
                  >
                    <RefreshCw size={14} />
                    <span>Adu Ulang</span>
                  </button>
                  <button 
                    onClick={() => setSwapSlotIndex(0)}
                    className="btn-battle-replay"
                    style={{ borderColor: 'var(--accent-lime)', color: 'var(--accent-lime)' }}
                  >
                    <Smartphone size={14} />
                    <span>Ganti Lawan</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Tab Navigation for Deep Dive Comparison */}
          {battleState === 'ready' ? (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
            gap: '10px',
            marginBottom: '32px',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'antutu', label: '📊 Perbandingan Skor AnTuTu v10', icon: Gauge },
              { id: 'gaming', label: '🎮 Uji Performa Game & FPS', icon: Activity },
              { id: 'specs', label: '📑 Matriks Spesifikasi Lengkap', icon: Layers },
              { id: 'verdict', label: '💡 Rekomendasi & Kesimpulan AI', icon: Sparkles },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isActive ? '1px solid var(--accent-lime)' : '1px solid var(--border-medium)',
                    background: isActive ? 'rgba(198, 255, 0, 0.12)' : '#141414',
                    color: isActive ? 'var(--accent-lime)' : '#aaa',
                    boxShadow: isActive ? '0 4px 20px rgba(198, 255, 0, 0.15)' : 'none'
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: ANTUTU DEEP DIVE */}
          {activeTab === 'antutu' && (
            <section className="antutu-deep-dive-section">
              <div className="section-headline">
                <div>
                  <h3 className="section-headline-title">
                    <Flame size={24} color="#FF9100" />
                    <span>Visualisasi Skor AnTuTu Benchmark v10</span>
                  </h3>
                  <p className="section-headline-desc">
                    Perbandingan visual matematis untuk mengukur kekuatan prosesor, kartu grafis, kecepatan memori, dan kelancaran sistem operasi.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255, 145, 0, 0.1)',
                  border: '1px solid rgba(255, 145, 0, 0.3)',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#FFB74D',
                  fontWeight: 700
                }}>
                  Standar Uji: AnTuTu v10 Official Lab
                </div>
              </div>

              <div className="antutu-bars-container">
                {/* 1. TOTAL SCORE */}
                <div className="metric-bar-group">
                  <div className="metric-group-header">
                    <div className="metric-group-title">
                      <Zap size={16} color="var(--accent-lime)" />
                      <span>Total Skor AnTuTu v10 (Semakin tinggi semakin kencang)</span>
                    </div>
                    <span className="metric-group-desc">Kombinasi CPU + GPU + MEM + UX</span>
                  </div>

                  {slotPhones.map((phone, i) => {
                    const pct = Math.round((phone.antutu.total / maxAnTuTu) * 100);
                    const isWin = i === highestAnTuTuSlotIdx;
                    return (
                      <div key={phone.id} className="phone-bar-row">
                        <div className="phone-bar-name" title={phone.name}>
                          {phone.name}
                        </div>
                        <div className="phone-bar-track">
                          <div 
                            className="phone-bar-fill" 
                            style={{ 
                              width: `${pct}%`,
                              background: isWin 
                                ? 'linear-gradient(90deg, #FF6D00, #C6FF00)' 
                                : 'linear-gradient(90deg, #444, #777)'
                            }}
                          >
                            <span className="phone-bar-number">{pct}%</span>
                          </div>
                        </div>
                        <div className="phone-bar-val-outside" style={{ color: isWin ? 'var(--accent-lime)' : '#fff' }}>
                          {phone.antutu.total.toLocaleString('id-ID')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. CPU SCORE */}
                <div className="metric-bar-group">
                  <div className="metric-group-header">
                    <div className="metric-group-title">
                      <Cpu size={16} color="#60a5fa" />
                      <span>CPU Score — Kecepatan Pemrosesan & Buka Aplikasi</span>
                    </div>
                    <span className="metric-group-desc">Arsitektur Core & Fabrikasi (nm)</span>
                  </div>

                  {slotPhones.map(phone => {
                    const pct = Math.round((phone.antutu.cpu / maxCPU) * 100);
                    return (
                      <div key={phone.id} className="phone-bar-row">
                        <div className="phone-bar-name" title={phone.name}>
                          {phone.name}
                        </div>
                        <div className="phone-bar-track">
                          <div 
                            className="phone-bar-fill" 
                            style={{ 
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, #1e40af, #60a5fa)'
                            }}
                          >
                            <span className="phone-bar-number">{pct}%</span>
                          </div>
                        </div>
                        <div className="phone-bar-val-outside" style={{ color: '#93c5fd' }}>
                          {phone.antutu.cpu.toLocaleString('id-ID')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. GPU SCORE */}
                <div className="metric-bar-group">
                  <div className="metric-group-header">
                    <div className="metric-group-title">
                      <Gauge size={16} color="#f87171" />
                      <span>GPU Score — Pengolahan Grafis 3D & Gaming FPS</span>
                    </div>
                    <span className="metric-group-desc">Kekuatan Render Grafis Game Berat</span>
                  </div>

                  {slotPhones.map(phone => {
                    const pct = Math.round((phone.antutu.gpu / maxGPU) * 100);
                    return (
                      <div key={phone.id} className="phone-bar-row">
                        <div className="phone-bar-name" title={phone.name}>
                          {phone.name}
                        </div>
                        <div className="phone-bar-track">
                          <div 
                            className="phone-bar-fill" 
                            style={{ 
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, #991b1b, #f87171)'
                            }}
                          >
                            <span className="phone-bar-number">{pct}%</span>
                          </div>
                        </div>
                        <div className="phone-bar-val-outside" style={{ color: '#fca5a5' }}>
                          {phone.antutu.gpu.toLocaleString('id-ID')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 4. MEMORY & UX GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="metric-bar-group">
                    <div className="metric-group-header">
                      <div className="metric-group-title">
                        <Layers size={16} color="#fbbf24" />
                        <span>Memory (RAM & Storage)</span>
                      </div>
                    </div>
                    {slotPhones.map(phone => {
                      const pct = Math.round((phone.antutu.memory / maxMemory) * 100);
                      return (
                        <div key={phone.id} className="phone-bar-row">
                          <div className="phone-bar-name">{phone.brand} {phone.name.split(' ')[1]}</div>
                          <div className="phone-bar-track">
                            <div className="phone-bar-fill" style={{ width: `${pct}%`, background: '#fbbf24' }}></div>
                          </div>
                          <div className="phone-bar-val-outside" style={{ color: '#fde68a' }}>
                            {phone.antutu.memory.toLocaleString('id-ID')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="metric-bar-group">
                    <div className="metric-group-header">
                      <div className="metric-group-title">
                        <TrendingUp size={16} color="#34d399" />
                        <span>UX (Kelancaran Antarmuka)</span>
                      </div>
                    </div>
                    {slotPhones.map(phone => {
                      const pct = Math.round((phone.antutu.ux / maxUX) * 100);
                      return (
                        <div key={phone.id} className="phone-bar-row">
                          <div className="phone-bar-name">{phone.brand} {phone.name.split(' ')[1]}</div>
                          <div className="phone-bar-track">
                            <div className="phone-bar-fill" style={{ width: `${pct}%`, background: '#34d399' }}></div>
                          </div>
                          <div className="phone-bar-val-outside" style={{ color: '#a7f3d0' }}>
                            {phone.antutu.ux.toLocaleString('id-ID')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* AnTuTu Performance Delta Banner */}
              <div style={{
                background: 'rgba(0, 229, 255, 0.05)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  background: 'rgba(0, 229, 255, 0.15)',
                  color: '#00E5FF',
                  padding: '12px',
                  borderRadius: '12px',
                  display: 'flex'
                }}>
                  <Zap size={22} />
                </div>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                    Fakta Head-to-Head AnTuTu:
                  </div>
                  <p style={{ fontSize: '13px', color: '#ccc', lineHeight: 1.5 }}>
                    <strong>{slotPhones[highestAnTuTuSlotIdx].name}</strong> memimpin duel ini dengan total <strong>{slotPhones[highestAnTuTuSlotIdx].antutu.total.toLocaleString('id-ID')} poin</strong> ({slotPhones[highestAnTuTuSlotIdx].antutu.efficiency_rating}). 
                    Sementara <strong>{slotPhones[0].name}</strong> memberikan rasio nilai ekonomis terbaik sebesar <strong>{getVfmScore(slotPhones[0])} poin per seribu rupiah</strong>.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: GAMING FPS TESTS */}
          {activeTab === 'gaming' && (
            <section className="specs-table-section">
              <div className="section-headline">
                <div>
                  <h3 className="section-headline-title">
                    <Activity size={24} color="#00E5FF" />
                    <span>Uji Real Game Populer & Perkiraan FPS</span>
                  </h3>
                  <p className="section-headline-desc">
                    Estimasi kelancaran bermain game di ruangan suhu normal 25°C - 30°C tanpa cooler tambahan.
                  </p>
                </div>
              </div>

              <div className="gaming-matrix-grid">
                {/* 1. Mobile Legends */}
                <div className="game-test-card">
                  <div className="game-test-icon">⚔️</div>
                  <div className="game-test-title">Mobile Legends: Bang Bang</div>
                  {slotPhones.map(phone => (
                    <div key={phone.id} className="game-fps-phone-item">
                      <span className="game-fps-name">{phone.name}</span>
                      <span className="game-fps-val">{phone.gaming_fps.mlbb}</span>
                    </div>
                  ))}
                </div>

                {/* 2. Free Fire */}
                <div className="game-test-card">
                  <div className="game-test-icon">🔫</div>
                  <div className="game-test-title">Free Fire MAX</div>
                  {slotPhones.map(phone => (
                    <div key={phone.id} className="game-fps-phone-item">
                      <span className="game-fps-name">{phone.name}</span>
                      <span className="game-fps-val">{phone.gaming_fps.freefire}</span>
                    </div>
                  ))}
                </div>

                {/* 3. PUBG Mobile */}
                <div className="game-test-card">
                  <div className="game-test-icon">🎯</div>
                  <div className="game-test-title">PUBG Mobile</div>
                  {slotPhones.map(phone => (
                    <div key={phone.id} className="game-fps-phone-item">
                      <span className="game-fps-name">{phone.name}</span>
                      <span className="game-fps-val">{phone.gaming_fps.pubg}</span>
                    </div>
                  ))}
                </div>

                {/* 4. Genshin Impact */}
                <div className="game-test-card">
                  <div className="game-test-icon">🐉</div>
                  <div className="game-test-title">Genshin Impact (Heavy 3D)</div>
                  {slotPhones.map(phone => (
                    <div key={phone.id} className="game-fps-phone-item">
                      <span className="game-fps-name">{phone.name}</span>
                      <span className="game-fps-val" style={{ color: '#FFB74D' }}>
                        {phone.gaming_fps.genshin}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: FULL SPECS MATRIX */}
          {activeTab === 'specs' && (
            <section className="specs-table-section">
              <div className="section-headline">
                <div>
                  <h3 className="section-headline-title">
                    <Layers size={24} color="var(--accent-lime)" />
                    <span>Matriks Spesifikasi Lengkap Head-to-Head</span>
                  </h3>
                  <p className="section-headline-desc">
                    Setiap detail komponen diteliti secara objektif dari data resmi distributor.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="specs-comparison-table">
                  <thead>
                    <tr>
                      <th>Komponen Hardware</th>
                      {slotPhones.map((phone, i) => (
                        <th key={phone.id}>
                          <div style={{ fontSize: '11px', color: 'var(--accent-lime)', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Slot {i + 1}
                          </div>
                          <div>{phone.name}</div>
                          <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 600, marginTop: '2px' }}>
                            {formatIDR(phone.price)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Category: Performa & Chipset */}
                    <tr className="spec-category-row">
                      <td colSpan={slotPhones.length + 1}>1. Otak & Performa Chipset</td>
                    </tr>
                    <tr>
                      <td className="spec-key-label">Model Chipset & Fabrikasi</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell spec-highlight-good">
                          {phone.specs.chipset}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-key-label">Arsitektur CPU</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell">
                          {phone.specs.cpu_cores}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-key-label">GPU Render</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell">
                          {phone.specs.gpu}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-key-label">Skor AnTuTu v10</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell" style={{ fontWeight: 800, color: '#FF9100' }}>
                          {phone.antutu.total.toLocaleString('id-ID')} Poin
                        </td>
                      ))}
                    </tr>

                    {/* Category: Layar & Tampilan */}
                    <tr className="spec-category-row">
                      <td colSpan={slotPhones.length + 1}>2. Layar & Tampilan Visual</td>
                    </tr>
                    <tr>
                      <td className="spec-key-label">Tipe Layar & Hz</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell">
                          {phone.specs.display}
                        </td>
                      ))}
                    </tr>

                    {/* Category: Baterai & Daya */}
                    <tr className="spec-category-row">
                      <td colSpan={slotPhones.length + 1}>3. Baterai & Pengisian Daya</td>
                    </tr>
                    <tr>
                      <td className="spec-key-label">Kapasitas & Watt Charger</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell spec-highlight-good">
                          {phone.specs.battery}
                        </td>
                      ))}
                    </tr>

                    {/* Category: Kamera */}
                    <tr className="spec-category-row">
                      <td colSpan={slotPhones.length + 1}>4. Kamera Utama & Selfie</td>
                    </tr>
                    <tr>
                      <td className="spec-key-label">Kamera Belakang</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell">
                          {phone.specs.camera_main}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-key-label">Kamera Depan (Selfie)</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell">
                          {phone.specs.camera_selfie}
                        </td>
                      ))}
                    </tr>

                    {/* Category: Fitur Penting Entry Level */}
                    <tr className="spec-category-row">
                      <td colSpan={slotPhones.length + 1}>5. Fitur Penting (NFC, Audio, Sensor)</td>
                    </tr>
                    <tr>
                      <td className="spec-key-label">NFC (Cek Saldo e-Toll)</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell">
                          {phone.specs.nfc.includes('Ada') ? (
                            <span style={{ color: '#34d399', fontWeight: 800 }}>✓ {phone.specs.nfc}</span>
                          ) : (
                            <span style={{ color: '#888' }}>✕ {phone.specs.nfc}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-key-label">Sistem Speaker</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell">
                          {phone.specs.speakers}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-key-label">Sensor Gyroscope</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell">
                          {phone.specs.gyro}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-key-label">Garansi Distributor Resmi</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell" style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>
                          {phone.official_distributor}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-key-label">Dukungan Sistem Operasi</td>
                      {slotPhones.map(phone => (
                        <td key={phone.id} className="spec-val-cell">
                          {phone.specs.os}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 4: AI VERDICT & RECOMMENDATIONS */}
          {activeTab === 'verdict' && (
            <section className="ai-verdict-box">
              <div className="ai-verdict-header">
                <div className="ai-verdict-badge">Kesimpulan AI Objektif</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                  Siapa yang Paling Cocok Beli Masing-Masing HP Ini?
                </h3>
              </div>

              <div className="ai-verdict-grid">
                {slotPhones.map(phone => (
                  <div key={phone.id} className="ai-verdict-card">
                    <div className="ai-verdict-for">
                      PILIH {phone.name.toUpperCase()} JIKA:
                    </div>
                    <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      {phone.pros.map((pro, i) => (
                        <li key={i} className="ai-verdict-text" style={{ listStyleType: 'disc' }}>
                          {pro}
                        </li>
                      ))}
                    </ul>

                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#ff7043', fontWeight: 700, marginBottom: '4px' }}>
                        Catatan Kekurangan:
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {phone.cons.join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Consultation & Checkout Banner */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(198, 255, 0, 0.1) 0%, rgba(20, 20, 20, 0.9) 100%)',
            border: '1px solid var(--border-lime)',
            borderRadius: '20px',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            marginBottom: '60px'
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-lime)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                <CheckCircle2 size={16} />
                <span>Jaminan Garansi Resmi 100% Baru BNIB Segel Pabrik</span>
              </div>
              <h4 style={{ fontSize: '19px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>
                Sudah Menemukan HP Pemenang Aduan Lu?
              </h4>
              <p style={{ fontSize: '13.5px', color: '#aaa', maxWidth: '650px' }}>
                Pesan langsung unit baru resmi bergaransi TAM, SEIN, Carlcare, Realme, atau Vivo Indonesia. Dilengkapi jaminan IMEI terdaftar Kemenperin & asuransi packing kayu aman se-Indonesia.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSwapSlotIndex(0)}
                className="btn-secondary-dark"
                style={{ padding: '12px 20px', fontSize: '13.5px' }}
              >
                <RefreshCw size={15} />
                <span>Ganti Model Lain</span>
              </button>

              <a
                href={makeWhatsAppUrl(slotPhones[0])}
                target="_blank"
                rel="noreferrer"
                className="btn-primary-lime"
                style={{ padding: '12px 24px', fontSize: '13.5px' }}
              >
                <MessageCircle size={16} />
                <span>Order via WhatsApp Resmi</span>
              </a>
            </div>
          </div>
            </>
          ) : (
            <div className="battle-idle-notice">
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(198, 255, 0, 0.08)',
                border: '1px solid rgba(198, 255, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                color: 'var(--accent-lime)'
              }}>
                <Gauge size={32} />
              </div>
              <h4>Hasil Analisis Lengkap & Benchmark Terkunci</h4>
              <p>
                Pilih model handphone di atas, lalu tekan tombol <strong>"MULAI ADU HP SEKARANG!"</strong> untuk mengungkap perbandingan visual skor AnTuTu v10, matriks FPS gaming, dan rekomendasi spesifikasi.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* 6. Phone Selector Modal for Swapping Slots */}
      {swapSlotIndex !== null && (
        <div className="modal-overlay" onClick={() => setSwapSlotIndex(null)}>
          <div 
            className="modal-content-box" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '850px', maxHeight: '88vh' }}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(198, 255, 0, 0.12)',
                  color: 'var(--accent-lime)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '14px'
                }}>
                  {swapSlotIndex + 1}
                </div>
                <div>
                  <h3 className="modal-title">Pilih Handphone Baru untuk Slot {swapSlotIndex + 1}</h3>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    Katalog HP Baru Entry Level Resmi Indonesia (Rp 1jt - 3jt)
                  </div>
                </div>
              </div>
              <button onClick={() => setSwapSlotIndex(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Search & Filters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Ketik model HP atau chipset (contoh: Helio G100, Infinix, Poco, Samsung)..."
                    style={{
                      width: '100%',
                      background: '#0a0a0a',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '10px',
                      padding: '12px 14px 12px 42px',
                      color: '#fff',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Price Tier Filter Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRICE_TIERS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedPriceTier(opt.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: selectedPriceTier === opt.id ? `1.5px solid ${opt.color}` : '1px solid var(--border-subtle)',
                        background: selectedPriceTier === opt.id ? `${opt.color}15` : '#161616',
                        color: selectedPriceTier === opt.id ? opt.color : '#aaa',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Brand Filter Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {BRAND_OPTIONS.map(b => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        border: selectedBrand === b ? '1px solid #00E5FF' : '1px solid var(--border-subtle)',
                        background: selectedBrand === b ? 'rgba(0, 229, 255, 0.12)' : '#121212',
                        color: selectedBrand === b ? '#00E5FF' : '#888',
                        cursor: 'pointer'
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Catalog Phones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredCatalog.map(phone => {
                  const isSelectedInCurrentSlot = selectedPhoneIds[swapSlotIndex] === phone.id;

                  return (
                    <div
                      key={phone.id}
                      onClick={() => handleSwapPhone(phone.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isSelectedInCurrentSlot ? 'rgba(198, 255, 0, 0.08)' : '#141414',
                        border: isSelectedInCurrentSlot ? '1px solid var(--accent-lime)' : '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '12px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        gap: '14px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          background: '#0a0a0a',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px'
                        }}>
                          <img 
                            src={phone.images[0]} 
                            alt={phone.name} 
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, color: '#fff', fontSize: '14.5px' }}>{phone.name}</span>
                            <span style={{
                              background: 'rgba(0, 229, 255, 0.1)',
                              color: '#00E5FF',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {phone.badge}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                            {phone.specs.chipset} • {phone.specs.display} • {phone.official_distributor}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* AnTuTu Badge in Modal */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(255, 145, 0, 0.12)',
                            color: '#FF9100',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)'
                          }}>
                            <Flame size={12} />
                            <span>{phone.antutu.total.toLocaleString('id-ID')} Poin</span>
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#777', marginTop: '3px' }}>
                            {phone.antutu.tier}
                          </div>
                        </div>

                        {/* Price & Select Button */}
                        <div style={{ textAlign: 'right', minWidth: '110px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-lime)', fontFamily: 'var(--font-mono)' }}>
                            {formatIDR(phone.price)}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwapPhone(phone.id);
                            }}
                            className={isSelectedInCurrentSlot ? 'btn-primary-lime' : 'btn-secondary-dark'}
                            style={{ padding: '6px 14px', fontSize: '11.5px', marginTop: '4px' }}
                          >
                            {isSelectedInCurrentSlot ? 'Dipilih ✓' : '+ Masukkan Meja'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-copy">
              © {new Date().getFullYear()} aduHP Indonesia. Semua HP diadu 100% Baru BNIB Garansi Resmi SEIN, TAM, Carlcare, Realme & Vivo.
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '12.5px' }}>
                Beranda
              </Link>
              <Link href="/adu-hp" style={{ color: 'var(--accent-lime)', textDecoration: 'none', fontSize: '12.5px', fontWeight: 700 }}>
                ⚔️ Menu Adu HP
              </Link>
              <a 
                href="https://dapur.aduhp.com" 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: '#555', textDecoration: 'none', fontSize: '12px' }}
                title="Buka Admin Panel dapur.aduhp.com"
              >
                dapur.aduhp.com ↗
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
