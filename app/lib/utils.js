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

export function getProductVariants(product) {
  // Bila produk sudah mendefinisikan variants di specs JSON (dari input Dapur aduHP)
  if (product?.specs?.variants && Array.isArray(product.specs.variants) && product.specs.variants.length > 0) {
    return product.specs.variants.map((v, idx) => ({
      ram: Number(v.ram) || 0,
      storage: Number(v.storage) || 0,
      label: v.label || `${v.ram || 0}GB / ${v.storage || 0}GB`,
      price: Number(v.price) || Number(product.price) || 0,
      stock: v.stock !== undefined && v.stock !== null ? Number(v.stock) : 0,
      isDefault: v.isDefault ?? v.is_default ?? (idx === 0)
    }));
  }

  // Jika produk belum memiliki daftar varian di specs, gunakan data tunggal produk murni dari database (1 varian riil)
  const baseRam = Number(product?.ram_gb) || 8;
  const baseStorage = Number(product?.storage_gb) || 256;
  const basePrice = Number(product?.price) || 0;
  const baseStock = product?.stock !== undefined && product?.stock !== null ? Number(product.stock) : 0;

  return [
    {
      ram: baseRam,
      storage: baseStorage,
      label: `${baseRam}GB / ${baseStorage}GB`,
      price: basePrice,
      stock: baseStock,
      isDefault: true
    }
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
