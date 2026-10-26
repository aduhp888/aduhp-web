// Data Wilayah & Tarif Pengiriman Resmi Indonesia (aduHP Logistics Engine)

export const INDONESIA_PROVINCES = [
  { id: 'DKI Jakarta', name: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'Jawa Barat', name: 'Jawa Barat', zone: 'jawa_barat' },
  { id: 'Banten', name: 'Banten', zone: 'banten' },
  { id: 'Jawa Tengah', name: 'Jawa Tengah', zone: 'jawa_tengah' },
  { id: 'DI Yogyakarta', name: 'DI Yogyakarta', zone: 'diy' },
  { id: 'Jawa Timur', name: 'Jawa Timur', zone: 'jawa_timur' },
  { id: 'Bali', name: 'Bali', zone: 'bali' },
  { id: 'Sumatera Utara', name: 'Sumatera Utara', zone: 'sumatera_1' },
  { id: 'Sumatera Barat', name: 'Sumatera Barat', zone: 'sumatera_2' },
  { id: 'Riau', name: 'Riau', zone: 'sumatera_2' },
  { id: 'Kepulauan Riau', name: 'Kepulauan Riau', zone: 'sumatera_2' },
  { id: 'Sumatera Selatan', name: 'Sumatera Selatan', zone: 'sumatera_1' },
  { id: 'Lampung', name: 'Lampung', zone: 'sumatera_1' },
  { id: 'Kalimantan Timur', name: 'Kalimantan Timur', zone: 'kalimantan' },
  { id: 'Kalimantan Barat', name: 'Kalimantan Barat', zone: 'kalimantan' },
  { id: 'Kalimantan Selatan', name: 'Kalimantan Selatan', zone: 'kalimantan' },
  { id: 'Sulawesi Selatan', name: 'Sulawesi Selatan', zone: 'sulawesi' },
  { id: 'Sulawesi Utara', name: 'Sulawesi Utara', zone: 'sulawesi' },
  { id: 'Nusa Tenggara Barat', name: 'Nusa Tenggara Barat', zone: 'ntb' },
  { id: 'Nusa Tenggara Timur', name: 'Nusa Tenggara Timur', zone: 'ntt' },
  { id: 'Papua', name: 'Papua', zone: 'papua' },
];

export const CITIES_BY_PROVINCE = {
  'DKI Jakarta': [
    'Jakarta Selatan',
    'Jakarta Pusat',
    'Jakarta Barat',
    'Jakarta Timur',
    'Jakarta Utara',
    'Kepulauan Seribu'
  ],
  'Jawa Barat': [
    'Kota Bandung',
    'Kab. Bandung',
    'Kota Bekasi',
    'Kab. Bekasi',
    'Kota Bogor',
    'Kab. Bogor',
    'Kota Depok',
    'Kota Cimahi',
    'Kab. Cirebon',
    'Kota Cirebon',
    'Kab. Karawang',
    'Kab. Sukabumi',
    'Kota Tasikmalaya'
  ],
  'Banten': [
    'Kota Tangerang',
    'Kota Tangerang Selatan',
    'Kab. Tangerang',
    'Kota Serang',
    'Kota Cilegon',
    'Kab. Lebak'
  ],
  'Jawa Tengah': [
    'Kota Semarang',
    'Kota Surakarta (Solo)',
    'Kab. Banyumas (Purwokerto)',
    'Kota Magelang',
    'Kab. Kudus',
    'Kota Tegal',
    'Kab. Cilacap',
    'Kab. Klaten'
  ],
  'DI Yogyakarta': [
    'Kota Yogyakarta',
    'Kab. Sleman',
    'Kab. Bantul',
    'Kab. Kulon Progo',
    'Kab. Gunungkidul'
  ],
  'Jawa Timur': [
    'Kota Surabaya',
    'Kota Malang',
    'Kab. Sidoarjo',
    'Kab. Gresik',
    'Kota Kediri',
    'Kab. Jember',
    'Kota Madiun',
    'Kab. Banyuwangi'
  ],
  'Bali': [
    'Kota Denpasar',
    'Kab. Badung (Kuta/Canggu)',
    'Kab. Gianyar (Ubud)',
    'Kab. Buleleng',
    'Kab. Tabanan'
  ],
  'Sumatera Utara': [
    'Kota Medan',
    'Kota Binjai',
    'Kab. Deli Serdang',
    'Kota Pematangsiantar'
  ],
  'Sumatera Barat': [
    'Kota Padang',
    'Kota Bukittinggi',
    'Kota Payakumbuh'
  ],
  'Riau': [
    'Kota Pekanbaru',
    'Kota Dumai',
    'Kab. Kampar'
  ],
  'Kepulauan Riau': [
    'Kota Batam',
    'Kota Tanjungpinang'
  ],
  'Sumatera Selatan': [
    'Kota Palembang',
    'Kota Prabumulih',
    'Kab. Ogan Ilir'
  ],
  'Lampung': [
    'Kota Bandar Lampung',
    'Kota Metro',
    'Kab. Lampung Selatan'
  ],
  'Kalimantan Timur': [
    'Kota Balikpapan',
    'Kota Samarinda',
    'Kota Bontang'
  ],
  'Kalimantan Barat': [
    'Kota Pontianak',
    'Kota Singkawang'
  ],
  'Kalimantan Selatan': [
    'Kota Banjarmasin',
    'Kota Banjarbaru'
  ],
  'Sulawesi Selatan': [
    'Kota Makassar',
    'Kab. Gowa',
    'Kota Parepare'
  ],
  'Sulawesi Utara': [
    'Kota Manado',
    'Kota Bitung',
    'Kota Tomohon'
  ],
  'Nusa Tenggara Barat': [
    'Kota Mataram',
    'Kab. Lombok Barat',
    'Kab. Sumbawa'
  ],
  'Nusa Tenggara Timur': [
    'Kota Kupang',
    'Kab. Manggarai Barat (Labuan Bajo)'
  ],
  'Papua': [
    'Kota Jayapura',
    'Kab. Merauke',
    'Kab. Mimika (Timika)'
  ]
};

// Base Ongkir Per Zona (Asumsi Paket 1 Kg HP + Bubble Wrap + Box Kayu Pengaman)
export const ZONE_BASE_RATES = {
  jabodetabek: { reg: 11000, express: 18000, instant: 35000, etaReg: '1-2 Hari', etaExp: 'Besok Sampai (YES)' },
  jawa_barat: { reg: 14000, express: 22000, instant: null, etaReg: '1-2 Hari', etaExp: '1 Hari' },
  banten: { reg: 13000, express: 20000, instant: null, etaReg: '1-2 Hari', etaExp: '1 Hari' },
  jawa_tengah: { reg: 18000, express: 28000, instant: null, etaReg: '2-3 Hari', etaExp: '1 Hari' },
  diy: { reg: 18000, express: 28000, instant: null, etaReg: '2-3 Hari', etaExp: '1 Hari' },
  jawa_timur: { reg: 20000, express: 32000, instant: null, etaReg: '2-3 Hari', etaExp: '1 Hari' },
  bali: { reg: 26000, express: 42000, instant: null, etaReg: '2-3 Hari', etaExp: '1-2 Hari' },
  sumatera_1: { reg: 28000, express: 45000, instant: null, etaReg: '2-3 Hari', etaExp: '1-2 Hari' },
  sumatera_2: { reg: 34000, express: 52000, instant: null, etaReg: '3-4 Hari', etaExp: '1-2 Hari' },
  kalimantan: { reg: 38000, express: 58000, instant: null, etaReg: '3-4 Hari', etaExp: '2 Hari' },
  sulawesi: { reg: 42000, express: 65000, instant: null, etaReg: '3-4 Hari', etaExp: '2 Hari' },
  ntb: { reg: 32000, express: 50000, instant: null, etaReg: '3-4 Hari', etaExp: '2 Hari' },
  ntt: { reg: 48000, express: 75000, instant: null, etaReg: '4-5 Hari', etaExp: '2-3 Hari' },
  papua: { reg: 85000, express: 125000, instant: null, etaReg: '4-6 Hari', etaExp: '3-4 Hari' },
};

export const COURIERS = [
  { id: 'jne', name: 'JNE Express', code: 'JNE', logo: '📦', defaultService: 'REG' },
  { id: 'sicepat', name: 'SiCepat Ekspres', code: 'SICEPAT', logo: '⚡', defaultService: 'SIUNTUNG' },
  { id: 'jnt', name: 'J&T Express', code: 'J&T', logo: '🚀', defaultService: 'EZ' },
  { id: 'paxel', name: 'Paxel Gadget Safe', code: 'PAXEL', logo: '🛡️', defaultService: 'SAMEDAY/NEXTDAY' }
];

export function getShippingRate(provinceName, courierId, serviceType = 'reg') {
  const prov = INDONESIA_PROVINCES.find(p => p.name === provinceName);
  const zoneKey = prov?.zone || 'jabodetabek';
  const zoneRates = ZONE_BASE_RATES[zoneKey] || ZONE_BASE_RATES.jabodetabek;

  let multiplier = 1.0;
  if (courierId === 'sicepat') multiplier = 0.98;
  if (courierId === 'jnt') multiplier = 1.02;
  if (courierId === 'paxel') multiplier = 1.15;

  const baseRate = serviceType === 'express' ? zoneRates.express : zoneRates.reg;
  const eta = serviceType === 'express' ? zoneRates.etaExp : zoneRates.etaReg;

  return {
    cost: Math.round((baseRate * multiplier) / 1000) * 1000,
    eta,
    zone: zoneKey
  };
}

// Perhitungan Asuransi Gadget Resmi: 0.2% dari Harga HP + Biaya Polis Admin Rp 5.000
export function calculateGadgetInsurance(productPrice) {
  if (!productPrice || productPrice <= 0) return 10000;
  const premium = Math.round(productPrice * 0.002);
  return Math.max(5000, premium + 5000);
}
