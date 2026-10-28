// Utility Functions & Corporate PT Information (aduHP Platform)

export function formatIDR(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ADU-${dateStr}-${randomSuffix}`;
}

export function normalizeAntutu(antutu) {
  if (!antutu) {
    return { version: 'v10', total: 0, cpu: 0, gpu: 0, memory: 0, ux: 0, tier: '-' };
  }

  let total = 0;
  let cpu = 0;
  let gpu = 0;
  let memory = 0;
  let ux = 0;
  let tier = '';
  let version = 'v10';

  if (typeof antutu === 'number' || (typeof antutu === 'string' && !isNaN(Number(antutu)))) {
    total = Number(antutu) || 0;
  } else if (typeof antutu === 'object') {
    total = Number(antutu.total) || 0;
    cpu = Number(antutu.cpu) || 0;
    gpu = Number(antutu.gpu) || 0;
    memory = Number(antutu.memory) || 0;
    ux = Number(antutu.ux) || 0;
    tier = antutu.tier || '';

    // Detect benchmark version (default to v10 if omitted)
    const rawVersion = String(antutu.version || '').toLowerCase();
    if (rawVersion.includes('11') || rawVersion === 'v11') {
      version = 'v11';
    } else {
      version = 'v10';
    }
  }

  // Auto-estimate missing breakdown if total is present but subscores are missing / zero
  if (total > 0) {
    if (cpu === 0 && gpu === 0 && memory === 0 && ux === 0) {
      cpu = Math.round(total * 0.35);
      gpu = Math.round(total * 0.25);
      memory = Math.round(total * 0.20);
      ux = total - cpu - gpu - memory;
    } else if (memory === 0 && ux === 0) {
      const remaining = Math.max(0, total - cpu - gpu);
      memory = Math.round(remaining * 0.5);
      ux = remaining - memory;
    }
  }

  // Tier categorization based on version
  if (!tier && total > 0) {
    if (version === 'v11') {
      if (total >= 1800000) tier = 'Raja Flagship (v11)';
      else if (total >= 1100000) tier = 'Flagship Killer (v11)';
      else if (total >= 550000) tier = 'Mid-Range Value Tier (v11)';
      else tier = 'Entry Level Hemat (v11)';
    } else {
      if (total >= 1500000) tier = 'Raja Flagship';
      else if (total >= 900000) tier = 'Flagship Killer';
      else if (total >= 450000) tier = 'Mid-Range Value Tier';
      else tier = 'Entry Level Hemat';
    }
  }

  return {
    version,
    total,
    cpu,
    gpu,
    memory,
    ux,
    tier: tier || '-'
  };
}

export const CORPORATE_ACCOUNTS = {
  companyName: 'PT. SECOND CIRCLE TEKNOLOGI',
  legalEntity: 'Perseroan Terbatas Berbadan Hukum Resmi RI',
  nib: '0220202619881',
  ahyuNumber: 'AHU-0029102.AH.01.01.TAHUN 2024',
  financeWhatsapp: '6281234567890',
  address: 'aduHP Technology Tower Lt. 18, Jl. TB Simatupang No. 88, Jakarta Selatan 12520',
  banks: [
    {
      id: 'bca',
      bankName: 'BCA (Bank Central Asia)',
      code: '014',
      accountName: 'PT. SECOND CIRCLE TEKNOLOGI',
      accountNumber: '8830 9291 88',
      type: 'Rekening Giro Perusahaan (Corporate)',
      badge: 'Verifikasi Otomatis',
      color: '#005CA9'
    },
    {
      id: 'mandiri',
      bankName: 'Bank Mandiri',
      code: '008',
      accountName: 'PT. SECOND CIRCLE TEKNOLOGI',
      accountNumber: '137-00-882910-4',
      type: 'Rekening Giro Perusahaan (Corporate)',
      badge: 'Verifikasi Otomatis',
      color: '#002855'
    },
    {
      id: 'bni',
      bankName: 'BNI (Bank Negara Indonesia)',
      code: '009',
      accountName: 'PT. SECOND CIRCLE TEKNOLOGI',
      accountNumber: '099-281-7721',
      type: 'Rekening Giro Perusahaan (Corporate)',
      badge: 'Verifikasi Otomatis',
      color: '#005E54'
    },
    {
      id: 'qris',
      bankName: 'QRIS Nasional (NMID: ID102026889100)',
      code: 'QRIS',
      accountName: 'PT. SECOND CIRCLE TEKNOLOGI',
      accountNumber: 'NMID: ID102026889100',
      type: 'Semua E-Wallet & Mobile Banking',
      badge: 'Scan Langsung',
      color: '#E02424'
    }
  ]
};

// Default fallback photo slots bila data upload belum lengkap
export const PHOTO_SLOT_DESCRIPTIONS = [
  { index: 0, title: 'Tampak Depan (Layar & Bodi)', desc: 'Foto utama cover depan, layar menyala mulus tanpa dead pixel' },
  { index: 1, title: 'Tampak Belakang & Modul Kamera', desc: 'Back cover bodi, modul lensa kamera & logo brand' },
  { index: 2, title: 'Box BNIB Segel Resmi / Fisik', desc: 'Segel pabrik Green Peel / unit fisik utuh belum tergores' },
  { index: 3, title: 'Kartu Garansi & Barcode IMEI', desc: 'Label distributor resmi Indonesia & validitas IMEI Kemenperin' },
  { index: 4, title: 'Sisi Frame, Port USB-C & Aksesoris', desc: 'Sisi samping, kabel Type-C & kelengkapan kotak original' }
];

export function getColorHex(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('plum') || n.includes('purple') || n.includes('violet') || n.includes('ungu')) return '#7B3F61';
  if (n.includes('black') || n.includes('hitam') || n.includes('dark') || n.includes('space')) return '#1C1C1E';
  if (n.includes('silver') || n.includes('titanium') || n.includes('perak') || n.includes('grey') || n.includes('gray')) return '#A2A2A8';
  if (n.includes('white') || n.includes('putih') || n.includes('pearl')) return '#EBEBEB';
  if (n.includes('blue') || n.includes('biru') || n.includes('ocean')) return '#1E3A8A';
  if (n.includes('green') || n.includes('hijau') || n.includes('mint') || n.includes('emerald')) return '#10B981';
  if (n.includes('gold') || n.includes('emas') || n.includes('cream')) return '#D4AF37';
  if (n.includes('red') || n.includes('merah') || n.includes('rose')) return '#E11D48';
  return '#3B82F6';
}

export function getProductVariants(product) {
  // Bila produk sudah mendefinisikan variants di specs JSON (dari input Dapur aduHP)
  if (product?.specs?.variants && Array.isArray(product.specs.variants) && product.specs.variants.length > 0) {
    return product.specs.variants.map((v, idx) => ({
      ram: Number(v.ram) || 0,
      storage: Number(v.storage) || 0,
      label: v.label || `${v.ram || 0}GB / ${v.storage || 0}GB`,
      price: Number(v.price) || Number(product.price) || 0,
      stock: v.stock !== undefined && v.stock !== null ? Number(v.stock) : 0,
      color_stocks: Array.isArray(v.color_stocks) ? v.color_stocks : [],
      isDefault: v.isDefault ?? v.is_default ?? (idx === 0)
    }));
  }

  const baseRam = Number(product?.ram_gb) || 8;
  const baseStorage = Number(product?.storage_gb) || 256;
  const basePrice = Number(product?.price) || 3000000;
  // STOCK REAL DARI DATABASE
  const realStock = product?.stock !== undefined && product?.stock !== null ? Number(product.stock) : 0;

  // Jika produk Certified Second: unit fisik spesifik bersertifikat QC
  if (product?.condition === 'second') {
    return [
      {
        ram: baseRam,
        storage: baseStorage,
        label: `${baseRam}GB / ${baseStorage}GB`,
        price: basePrice,
        stock: realStock,
        isDefault: true
      }
    ];
  }

  // Jika HP Baru BNIB: Varian default menggunakan stok riil database. Varian alternatif opsional jika belum ada stok di gudang bernilai 0 (Habis)
  if (basePrice >= 8000000) {
    // Flagship Tier
    return [
      { ram: baseRam, storage: baseStorage, label: `${baseRam}GB / ${baseStorage}GB`, price: basePrice, stock: realStock, isDefault: true },
      { ram: baseRam + 4, storage: baseStorage >= 512 ? 1024 : 512, label: `${baseRam + 4}GB / ${baseStorage >= 512 ? '1TB' : '512GB'}`, price: basePrice + 1500000, stock: 0, isDefault: false }
    ];
  } else if (basePrice >= 2500000) {
    // Mid-Range Tier (seperti OPPO A6x)
    const upgradeRam = baseRam <= 6 ? 8 : (baseRam + 4);
    const upgradeStorage = baseStorage <= 128 ? 256 : (baseStorage * 2);
    return [
      { ram: baseRam, storage: baseStorage, label: `${baseRam}GB / ${baseStorage}GB`, price: basePrice, stock: realStock, isDefault: true },
      { ram: upgradeRam, storage: upgradeStorage, label: `${upgradeRam}GB / ${upgradeStorage}GB`, price: basePrice + 450000, stock: 0, isDefault: false }
    ];
  } else {
    // Entry Level (< 2.5 Juta)
    return [
      { ram: baseRam, storage: baseStorage, label: `${baseRam}GB / ${baseStorage}GB`, price: basePrice, stock: realStock, isDefault: true },
      { ram: baseRam + 2, storage: baseStorage === 64 ? 128 : 256, label: `${baseRam + 2}GB / ${baseStorage === 64 ? 128 : 256}GB`, price: basePrice + 300000, stock: 0, isDefault: false }
    ];
  }
}

export function getProductColors(product) {
  // Bila produk sudah mendefinisikan varian warna di specs JSON (dari input Dapur aduHP)
  if (product?.specs?.colors && Array.isArray(product.specs.colors) && product.specs.colors.length > 0) {
    return product.specs.colors.map((c, idx) => ({
      name: c.name || `Warna ${idx + 1}`,
      hex: c.hex || getColorHex(c.name),
      isDefault: c.isDefault ?? c.is_default ?? (idx === 0)
    }));
  }

  const rawColor = product?.color || '';
  // Split beberapa nama warna bila dipisahkan garis miring '/', koma ',', atau '&' (misal: 'Plum Purple / Violet Purple')
  const splitNames = rawColor
    .split(/\s*(?:\/|,|&|\batau\b|\bor\b)\s*/i)
    .map(s => s.trim())
    .filter(Boolean);

  const colors = [];
  if (splitNames.length > 0) {
    splitNames.forEach((name, idx) => {
      colors.push({
        name,
        hex: getColorHex(name),
        isDefault: idx === 0
      });
    });
  }

  // Jika hanya ada 1 warna terdaftar, sertakan 1 pilihan warna alternatif elegan
  if (colors.length === 1) {
    const primary = colors[0].name.toLowerCase();
    if (!primary.includes('black') && !primary.includes('hitam')) {
      colors.push({ name: 'Midnight Black', hex: '#1C1C1E', isDefault: false });
    } else {
      colors.push({ name: 'Titanium Silver', hex: '#A2A2A8', isDefault: false });
    }
  } else if (colors.length === 0) {
    colors.push(
      { name: 'Midnight Black', hex: '#1C1C1E', isDefault: true },
      { name: 'Titanium Silver', hex: '#A2A2A8', isDefault: false },
      { name: 'Ocean Blue', hex: '#1E3A8A', isDefault: false }
    );
  }

  return colors;
}

export function getColorStockForVariant(variant, colorName) {
  if (!variant) return 0;
  if (Array.isArray(variant.color_stocks) && variant.color_stocks.length > 0) {
    const target = (colorName || '').trim().toLowerCase();
    const matched = variant.color_stocks.find(
      c => (c.name || '').trim().toLowerCase() === target
    );
    if (matched) {
      return Math.max(0, Number(matched.stock) || 0);
    }
  }
  // Fallback to variant total stock if color_stocks array is not provided
  return Math.max(0, Number(variant.stock) || 0);
}
