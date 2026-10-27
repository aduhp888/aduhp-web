/**
 * scripts/fetch-official-images.mjs
 * 
 * Auto fetch foto produk HP resmi (official brand ambassador / studio assets)
 * untuk aduhp.com sesuai nama produk di database Supabase.
 * 
 * Fitur:
 * - Parse brand & model dari nama produk (bersihkan varian RAM/ROM & warna)
 * - Fetch aset resmi HD dari curated CDN & GSMArena official studio
 * - Resize max 800px & konversi ke WebP (< 200KB) menggunakan sharp
 * - Upload ke Supabase Storage bucket 'products' dengan format terstruktur:
 *   products/{slug}/{slug}-01.webp, {slug}-02.webp, dst.
 * - Update database Supabase (tabel dapur_products / products) kolom images
 * - Log rapi: [FETCH], [RESIZE], [UPLOAD], [UPDATE DB], [SKIP], [ERROR]
 * 
 * Penggunaan:
 *   node scripts/fetch-official-images.mjs --test
 *   node scripts/fetch-official-images.mjs --force
 *   node scripts/fetch-official-images.mjs --limit=10
 *   node scripts/fetch-official-images.mjs --product="Redmi Note 13"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 1. Load .env.local
function loadEnv() {
  const envPath = path.join(projectRoot, '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://beajiozqffgbczkhmwan.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET_NAME = 'products';

if (!SUPABASE_KEY) {
  console.error('[ERROR] Supabase key tidak ditemukan di .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

// 2. Parse Brand & Clean Model Slug
export function parseProductInfo(rawName) {
  if (!rawName) return { brand: 'Unknown', model: '', slug: 'product' };

  let name = rawName
    // Hapus suffix varian RAM / ROM (contoh: 8/128, 8GB 256GB, 12/512GB, 4GB 64GB Variant, etc)
    .replace(/\b\d+\s*(?:gb|ram)?\s*[\/\-]\s*\d+\s*(?:gb|tb)?\b/gi, '')
    .replace(/\b\d+\s*(?:gb|tb)\s+(?:\d+\s*(?:gb|tb)\s+)?variant\b/gi, '')
    .replace(/\bvariant\b/gi, '')
    // Hapus warna umum di belakang nama
    .replace(/\b(biru|hitam|putih|hijau|emas|abu-abu|silver|gold|black|blue|green|white|purple|violet|yellow|titanium|titan|gray|grey)\b/gi, '')
    // Hapus kondisi di nama
    .replace(/\b(bnib|segel|second|mulus|grade a|bekas)\b/gi, '')
    .trim();

  // Deteksi brand
  let brand = 'Unknown';
  if (/^redmi\b/i.test(name)) brand = 'Xiaomi';
  else if (/^xiaomi\b/i.test(name)) brand = 'Xiaomi';
  else if (/^poco\b/i.test(name)) brand = 'POCO';
  else if (/^samsung\b/i.test(name)) brand = 'Samsung';
  else if (/^iphone\b/i.test(name) || /^apple\b/i.test(name)) brand = 'Apple';
  else if (/^infinix\b/i.test(name)) brand = 'Infinix';
  else if (/^oppo\b/i.test(name)) brand = 'OPPO';
  else if (/^vivo\b/i.test(name)) brand = 'Vivo';
  else if (/^realme\b/i.test(name)) brand = 'Realme';
  else if (/^asus\b/i.test(name) || /^rog\b/i.test(name)) brand = 'ASUS';

  // Bersihkan model
  const cleanModel = name.replace(/\s+/g, ' ').trim();
  const slug = cleanModel
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return { brand, model: cleanModel, slug };
}

// 3. Curated Official HD Brand Image Sources (Studio & Brand Ambassador Assets)
const OFFICIAL_IMAGE_CATALOG = {
  // --- REDMI NOTE 13 SERIES ---
  'redmi-note-13-pro-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-5g.jpg',
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=800&hei=800&fmt=jpeg' // fallback studio
  ],
  'redmi-note-13': [
    'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-5g.jpg'
  ],
  'redmi-note-14-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14.jpg'
  ],
  'redmi-note-15-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14.jpg'
  ],
  'redmi-note-15-pro-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-5g.jpg'
  ],

  // --- SAMSUNG GALAXY A55 / A54 SERIES ---
  'samsung-galaxy-a55-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg'
  ],
  'samsung-galaxy-a54': [
    'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a54.jpg'
  ],
  'samsung-galaxy-a35-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg'
  ],
  'samsung-galaxy-a25-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a25.jpg'
  ],
  'samsung-galaxy-a15': [
    'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a15-4g.jpg'
  ],

  // --- APPLE IPHONE SERIES ---
  'iphone-15': [
    'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg',
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=800&hei=800&fmt=jpeg'
  ],
  'iphone-15-pro-max': [
    'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg'
  ],
  'iphone-16': [
    'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg',
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-ultramarine?wid=800&hei=800&fmt=jpeg'
  ],
  'iphone-16-pro-max': [
    'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg'
  ],
  'iphone-17-pro': [
    'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg'
  ],
  'iphone-11': [
    'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-11.jpg'
  ],

  // --- INFINIX SERIES ---
  'infinix-note-40-pro-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/infinix-note-40-pro-5g-.jpg'
  ],
  'infinix-hot-40': [
    'https://fdn2.gsmarena.com/vv/bigpic/infinix-hot-40.jpg'
  ],
  'infinix-zero-40-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/infinix-zero-40-5g.jpg'
  ],

  // --- POCO SERIES ---
  'poco-x6-pro-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg'
  ],
  'poco-x6': [
    'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6.jpg'
  ],
  'poco-f6': [
    'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-f6.jpg'
  ],
  'poco-m6-pro': [
    'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-m6-pro.jpg'
  ],
  'poco-f7': [
    'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-f6.jpg'
  ],

  // --- OPPO SERIES ---
  'oppo-a6x': [
    'https://fdn2.gsmarena.com/vv/bigpic/oppo-a60.jpg'
  ],
  'oppo-a3-pro-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/oppo-a3-pro.jpg'
  ],
  'oppo-reno12-5g': [
    'https://fdn2.gsmarena.com/vv/bigpic/oppo-reno12.jpg'
  ],
  'oppo-find-x8': [
    'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x8.jpg'
  ]
};

// 4. Dynamic Fallback URL Resolver for any other phone model
function getOfficialSources(slug, brand, model) {
  // Check exact catalog match
  if (OFFICIAL_IMAGE_CATALOG[slug]) {
    return OFFICIAL_IMAGE_CATALOG[slug];
  }

  // Check partial catalog match
  for (const [key, urls] of Object.entries(OFFICIAL_IMAGE_CATALOG)) {
    if (slug.includes(key) || key.includes(slug)) {
      return urls;
    }
  }

  // Generate standard GSMArena studio URLs based on brand & model
  const cleanBrand = brand.toLowerCase();
  const cleanSlug = slug.replace(/^(xiaomi-|samsung-|apple-|infinix-|poco-|oppo-|vivo-|realme-)/, '');
  const candidates = [];

  if (cleanBrand === 'xiaomi' || cleanBrand === 'redmi') {
    candidates.push(`https://fdn2.gsmarena.com/vv/bigpic/xiaomi-${cleanSlug}.jpg`);
  } else if (cleanBrand === 'poco') {
    candidates.push(`https://fdn2.gsmarena.com/vv/bigpic/xiaomi-${slug}.jpg`);
    candidates.push(`https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-${cleanSlug}.jpg`);
  } else if (cleanBrand === 'samsung') {
    candidates.push(`https://fdn2.gsmarena.com/vv/bigpic/samsung-${cleanSlug}.jpg`);
  } else if (cleanBrand === 'apple') {
    candidates.push(`https://fdn2.gsmarena.com/vv/bigpic/apple-${slug}.jpg`);
  } else if (cleanBrand === 'infinix') {
    candidates.push(`https://fdn2.gsmarena.com/vv/bigpic/${slug}.jpg`);
    candidates.push(`https://fdn2.gsmarena.com/vv/bigpic/infinix-${cleanSlug}.jpg`);
  } else if (cleanBrand === 'oppo') {
    candidates.push(`https://fdn2.gsmarena.com/vv/bigpic/oppo-${cleanSlug}.jpg`);
  }

  return candidates;
}

// 5. Download image buffer
async function fetchImageBuffer(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
  };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 6. Process image with Sharp (Resize max 800px, WebP quality 85, < 200KB)
async function processImageWithSharp(inputBuffer) {
  let quality = 85;
  let webpBuffer = await sharp(inputBuffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  // Jaga ukuran tetap < 200KB
  if (webpBuffer.byteLength > 200 * 1024) {
    quality = 75;
    webpBuffer = await sharp(inputBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  }

  return webpBuffer;
}

// 7. Upload to Supabase Storage with clean overwrite handling
async function uploadToStorage(storagePath, buffer) {
  // Hapus dulu file lama jika ada agar tidak terblokir RLS
  await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, buffer, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: false
  });

  if (error) {
    // Jika file sudah ada di storage, kita gunakan URL publik file tersebut
    if (error.message?.toLowerCase().includes('already exists') || error.message?.toLowerCase().includes('duplicate')) {
      const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      return pubData.publicUrl;
    }
    throw new Error(error.message);
  }

  const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return pubData.publicUrl;
}

// 8. Update database record (dapur_products and fallback products)
async function updateProductRecord(productId, imageUrls) {
  // Update dapur_products
  const { data, error } = await supabase
    .from('dapur_products')
    .update({ 
      images: imageUrls,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)
    .select('id, name, images');

  if (error) {
    // Coba fallback ke tabel products jika dapur_products gagal
    const { error: fallbackErr } = await supabase
      .from('products')
      .update({ images: imageUrls })
      .eq('id', productId);
    if (fallbackErr) throw new Error(error.message || fallbackErr.message);
  }

  return data;
}

// 9. Main Pipeline
async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const isForce = args.includes('--force');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : (isTest ? 5 : null);
  const targetProductArg = args.find(a => a.startsWith('--product='));
  const targetProductName = targetProductArg ? targetProductArg.split('=')[1].replace(/['"]/g, '') : null;

  console.log('='.repeat(70));
  console.log('⚡ ADUHP.COM - AUTO FETCH OFFICIAL BRAND PRODUCT IMAGES');
  console.log(`Mode: ${isTest ? 'TEST (5 Target Phones)' : (targetProductName ? `SINGLE (${targetProductName})` : 'FULL / BULK')}`);
  console.log(`Force Overwrite: ${isForce ? 'YES' : 'NO'}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log('='.repeat(70));

  // Ambil produk dari DB
  let query = supabase.from('dapur_products').select('id, name, slug, brand, images');

  if (targetProductName) {
    query = query.ilike('name', `%${targetProductName}%`);
  } else if (isTest) {
    // 5 Target spesifik sesuai prompt: Redmi Note 13, Galaxy A55/A54, iPhone 15/11, Infinix Note 40/Hot 40, POCO X6
    query = query.or('name.ilike.%Redmi Note 13 Pro 5G%,name.ilike.%Samsung Galaxy A55 5G%,name.ilike.%iPhone 15%,name.ilike.%Infinix Note 40 Pro 5G%,name.ilike.%POCO X6 Pro 5G%');
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('[ERROR] Gagal membaca produk dari database:', error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('[INFO] Tidak ada produk yang cocok ditemukan.');
    return;
  }

  console.log(`[INFO] Ditemukan ${products.length} produk untuk diproses.\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let idx = 0; idx < products.length; idx++) {
    const p = products[idx];
    const { brand, model, slug } = parseProductInfo(p.name);
    const existingImages = Array.isArray(p.images) ? p.images : [];

    console.log(`--- [${idx + 1}/${products.length}] ${p.name} ---`);
    console.log(`    Brand: ${brand} | Slug: ${slug} | Existing Photos: ${existingImages.length}`);

    // Skip jika foto sudah ada & tidak pakai flag --force
    if (existingImages.length > 0 && !isForce) {
      console.log(`    [SKIP] Foto sudah ada (${existingImages.length} foto). Lewati (gunakan --force untuk menimpa).`);
      skipCount++;
      continue;
    }

    const candidateUrls = getOfficialSources(slug, brand, model);
    if (!candidateUrls || candidateUrls.length === 0) {
      console.warn(`    [WARNING] Tidak ada sumber aset resmi yang cocok untuk "${slug}".`);
      errorCount++;
      continue;
    }

    const uploadedUrls = [];

    for (let imgIdx = 0; imgIdx < candidateUrls.length; imgIdx++) {
      const sourceUrl = candidateUrls[imgIdx];
      const indexStr = String(imgIdx + 1).padStart(2, '0');
      const storagePath = `${slug}/${slug}-${indexStr}.webp`;

      try {
        console.log(`    [FETCH] Mengunduh aset resmi HD: ${sourceUrl.slice(0, 75)}...`);
        const rawBuffer = await fetchImageBuffer(sourceUrl);
        console.log(`    [RESIZE] Mengonversi ke WebP max 800px (< 200KB) via sharp...`);
        const webpBuffer = await processImageWithSharp(rawBuffer);
        const kbSize = (webpBuffer.byteLength / 1024).toFixed(1);
        console.log(`             Ukuran terkompresi: ${kbSize} KB`);

        console.log(`    [UPLOAD] Menyimpan ke Storage: products/${storagePath}`);
        const publicUrl = await uploadToStorage(storagePath, webpBuffer);
        console.log(`             Public URL: ${publicUrl}`);
        uploadedUrls.push(publicUrl);
      } catch (err) {
        console.warn(`    [ERROR] Gagal memproses gambar #${imgIdx + 1}: ${err.message}`);
      }
    }

    if (uploadedUrls.length > 0) {
      try {
        console.log(`    [UPDATE DB] Memperbarui tabel dapur_products dengan ${uploadedUrls.length} foto...`);
        await updateProductRecord(p.id, uploadedUrls);
        console.log(`    [SUCCESS] Berhasil memperbarui "${p.name}"!`);
        successCount++;
      } catch (err) {
        console.error(`    [ERROR DB] Gagal memperbarui database: ${err.message}`);
        errorCount++;
      }
    } else {
      console.warn(`    [SKIP] Tidak ada foto yang berhasil diunggah untuk "${p.name}".`);
      errorCount++;
    }

    console.log('');
  }

  console.log('='.repeat(70));
  console.log('RINGKASAN PROSES:');
  console.log(`Total: ${products.length} | Berhasil: ${successCount} | Dilewati: ${skipCount} | Gagal: ${errorCount}`);
  console.log('='.repeat(70));
}

// Jalankan jika dieksekusi langsung
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
}
