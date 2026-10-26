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

export const CORPORATE_ACCOUNTS = {
  companyName: 'PT ADU HP INDONESIA',
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
      accountName: 'PT ADU HP INDONESIA',
      accountNumber: '8830 9291 88',
      type: 'Rekening Giro Perusahaan (Corporate)',
      badge: 'Verifikasi Otomatis',
      color: '#005CA9'
    },
    {
      id: 'mandiri',
      bankName: 'Bank Mandiri',
      code: '008',
      accountName: 'PT ADU HP INDONESIA',
      accountNumber: '137-00-882910-4',
      type: 'Rekening Giro Perusahaan (Corporate)',
      badge: 'Verifikasi Otomatis',
      color: '#002855'
    },
    {
      id: 'bni',
      bankName: 'BNI (Bank Negara Indonesia)',
      code: '009',
      accountName: 'PT ADU HP INDONESIA',
      accountNumber: '099-281-7721',
      type: 'Rekening Giro Perusahaan (Corporate)',
      badge: 'Verifikasi Otomatis',
      color: '#005E54'
    },
    {
      id: 'qris',
      bankName: 'QRIS Nasional (NMID: ID102026889100)',
      code: 'QRIS',
      accountName: 'PT ADU HP INDONESIA',
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

export function getProductVariants(product) {
  // Bila produk sudah mendefinisikan variants di JSON
  if (product?.specs?.variants && Array.isArray(product.specs.variants) && product.specs.variants.length > 0) {
    return product.specs.variants;
  }

  // Jika produk memiliki kolom ram_gb & storage_gb tunggal, bangun varian realistis
  const baseRam = Number(product?.ram_gb) || 8;
  const baseStorage = Number(product?.storage_gb) || 256;
  const basePrice = Number(product?.price) || 3000000;

  // Jika HP Flagship
  if (basePrice >= 8000000) {
    return [
      { ram: baseRam, storage: baseStorage, label: `${baseRam}GB / ${baseStorage}GB`, price: basePrice, isDefault: true, stock: 5 },
      { ram: baseRam + 4, storage: baseStorage * 2, label: `${baseRam + 4}GB / ${baseStorage * 2}GB`, price: basePrice + 1500000, stock: 3 },
      { ram: baseRam + 8, storage: 1024, label: `${baseRam + 8}GB / 1TB`, price: basePrice + 3500000, stock: 2 }
    ];
  }

  // Jika HP Mid-Range (2 - 8 Juta)
  if (basePrice >= 2500000) {
    return [
      { ram: baseRam, storage: Math.max(128, baseStorage === 256 ? 128 : baseStorage), label: `${baseRam}GB / ${Math.max(128, baseStorage === 256 ? 128 : baseStorage)}GB`, price: Math.max(2000000, basePrice - 400000), stock: 8 },
      { ram: baseRam, storage: 256, label: `${baseRam}GB / 256GB`, price: basePrice, isDefault: true, stock: 12 },
      { ram: baseRam + 4, storage: 512, label: `${baseRam + 4}GB / 512GB`, price: basePrice + 600000, stock: 4 }
    ];
  }

  // Entry Level (1 - 2 Juta)
  return [
    { ram: Math.max(4, baseRam - 2), storage: 128, label: `${Math.max(4, baseRam - 2)}GB / 128GB`, price: Math.max(1200000, basePrice - 250000), stock: 15 },
    { ram: baseRam, storage: baseStorage, label: `${baseRam}GB / ${baseStorage}GB`, price: basePrice, isDefault: true, stock: 10 }
  ];
}

export function getProductColors(product) {
  if (product?.specs?.colors && Array.isArray(product.specs.colors) && product.specs.colors.length > 0) {
    return product.specs.colors;
  }
  const defaultColors = [
    { name: 'Midnight Black', hex: '#1C1C1E' },
    { name: 'Titanium Silver', hex: '#B0B0B5' },
    { name: 'Ocean Blue', hex: '#204060' }
  ];
  if (product?.color) {
    return [{ name: product.color, hex: '#222222' }, ...defaultColors.slice(0, 2)];
  }
  return defaultColors;
}
