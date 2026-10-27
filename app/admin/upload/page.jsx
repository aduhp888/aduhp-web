'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Layers,
  RefreshCw,
  ArrowRight,
  Lock,
  ExternalLink,
  Smartphone,
  Eye,
  FileCheck
} from 'lucide-react';

// Helper kompresi WebP di browser via HTML5 Canvas (max 800px, quality 85%, <200KB)
function compressToWebP(file, maxWidth = 800, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas gagal menghasilkan blob'));
              return;
            }
            // Jika lebih dari 200KB, turunkan kualitas ke 72%
            if (blob.size > 200 * 1024) {
              canvas.toBlob(
                (blob2) => resolve(blob2 || blob),
                'image/webp',
                0.72
              );
            } else {
              resolve(blob);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Helper auto-match nama file ke produk
function detectProductMatch(fileName, products) {
  if (!fileName || !products || products.length === 0) return null;

  // Bersihkan ekstensi, nomor urut, dan kata-kata atribut warna/varian
  const cleanName = fileName
    .toLowerCase()
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/\b(front|back|side|angle|hero|01|02|03|04|05|1|2|3|4|5)\b/g, '')
    .replace(/\b(biru|hitam|putih|hijau|emas|black|blue|green|white|gold|silver|purple|yellow)\b/g, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  const words = cleanName.split(/\s+/).filter(w => w.length > 1);

  let bestMatch = null;
  let highestScore = 0;

  for (const p of products) {
    const pName = (p.name || '').toLowerCase();
    const pSlug = (p.slug || '').toLowerCase().replace(/[-_]+/g, ' ');
    let score = 0;

    for (const w of words) {
      if (pName.includes(w)) score += 2;
      if (pSlug.includes(w)) score += 1;
    }

    if (score > highestScore && score >= 2) {
      highestScore = score;
      bestMatch = p;
    }
  }

  return bestMatch;
}

export default function AdminUploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Admin access state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [authError, setAuthError] = useState('');

  // Products catalog from Supabase
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Drag & drop file queue
  const [fileItems, setFileItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState(null);

  // Cek otentikasi login
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setIsAdminUnlocked(true);
      }
    }
  }, [user, authLoading]);

  // Fetch daftar produk dari dapur_products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoadingProducts(true);
        const { data, error } = await supabase
          .from('dapur_products')
          .select('id, name, slug, brand, images')
          .order('name', { ascending: true });

        if (!error && data) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, []);

  function handleUnlock(e) {
    e.preventDefault();
    if (adminPin === 'aduhp888' || adminPin === 'admin123' || adminPin === 'aduhp2026') {
      setIsAdminUnlocked(true);
      setAuthError('');
    } else {
      setAuthError('Kunci akses admin salah. Masukkan PIN yang valid.');
    }
  }

  // Handle Drag & Drop
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }

  function handleFileSelect(e) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  }

  function addFiles(files) {
    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) return;

    const newItems = validImages.map((file, idx) => {
      const matched = detectProductMatch(file.name, products);
      return {
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        selectedProductId: matched ? matched.id : (products[0]?.id || ''),
        status: 'ready', // 'ready' | 'compressing' | 'uploading' | 'success' | 'error'
        errorMessage: null,
        uploadedUrl: null
      };
    });

    setFileItems(prev => [...prev, ...newItems]);
  }

  function removeFileItem(id) {
    setFileItems(prev => {
      const target = prev.find(item => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  }

  function updateItemProduct(itemId, productId) {
    setFileItems(prev =>
      prev.map(item => item.id === itemId ? { ...item, selectedProductId: productId } : item)
    );
  }

  // Proses Upload & Sinkronkan
  async function handleUploadAndSync() {
    if (fileItems.length === 0 || uploading) return;

    setUploading(true);
    setUploadProgress(0);
    setSyncStatus(null);

    let completed = 0;
    const total = fileItems.length;
    const productsToUpdate = {}; // { [productId]: [newUrls] }

    for (let i = 0; i < fileItems.length; i++) {
      const item = fileItems[i];
      if (item.status === 'success') {
        completed++;
        setUploadProgress(Math.round((completed / total) * 100));
        continue;
      }

      const prod = products.find(p => p.id === item.selectedProductId);
      if (!prod) {
        setFileItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'error', errorMessage: 'Produk tidak dipilih' } : it));
        completed++;
        continue;
      }

      try {
        // 1. Status Compressing
        setFileItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'compressing' } : it));
        const webpBlob = await compressToWebP(item.file, 800, 0.85);

        // 2. Tentukan Slug & Path
        const slug = prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existingCount = (prod.images || []).length + (productsToUpdate[prod.id] || []).length;
        const indexStr = String(existingCount + 1).padStart(2, '0');
        const storagePath = `${slug}/${slug}-${indexStr}.webp`;

        // 3. Status Uploading
        setFileItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'uploading' } : it));
        
        // Hapus file lama jika ada agar tidak terblokir RLS
        await supabase.storage.from('products').remove([storagePath]);

        const { data, error: upError } = await supabase.storage.from('products').upload(storagePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: false
        });

        let finalUrl = '';
        if (upError) {
          if (upError.message?.toLowerCase().includes('already exists') || upError.message?.toLowerCase().includes('duplicate')) {
            const { data: pubData } = supabase.storage.from('products').getPublicUrl(storagePath);
            finalUrl = pubData.publicUrl;
          } else {
            throw new Error(upError.message);
          }
        } else {
          const { data: pubData } = supabase.storage.from('products').getPublicUrl(storagePath);
          finalUrl = pubData.publicUrl;
        }

        // Simpan ke antrean update DB
        if (!productsToUpdate[prod.id]) {
          productsToUpdate[prod.id] = [...(prod.images || [])];
        }
        productsToUpdate[prod.id].push(finalUrl);

        setFileItems(prev => prev.map(it => it.id === item.id ? {
          ...it,
          status: 'success',
          uploadedUrl: finalUrl
        } : it));

      } catch (err) {
        console.error('Upload item failed:', err);
        setFileItems(prev => prev.map(it => it.id === item.id ? {
          ...it,
          status: 'error',
          errorMessage: err.message || 'Gagal mengunggah foto'
        } : it));
      }

      completed++;
      setUploadProgress(Math.round((completed / total) * 100));
    }

    // 4. Update Database dapur_products untuk semua produk terkait
    let updateSuccessCount = 0;
    for (const [productId, imagesArray] of Object.entries(productsToUpdate)) {
      try {
        const { error: dbErr } = await supabase
          .from('dapur_products')
          .update({
            images: imagesArray,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (!dbErr) {
          updateSuccessCount++;
          // Update local state produk
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, images: imagesArray } : p));
        }
      } catch (e) {
        console.error('DB update failed for ' + productId, e);
      }
    }

    setUploading(false);
    setSyncStatus({
      type: 'success',
      message: `Berhasil mengunggah dan menyinkronkan foto ke ${updateSuccessCount} produk di database Supabase!`
    });
  }

  // Screen Proteksi Admin jika belum unlocked
  if (!isAdminUnlocked) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          background: '#121217',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '36px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 255, 136, 0.12)',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--accent-lime, #00ff88)'
            }}>
              <ShieldCheck size={28} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
              Portal Admin Unggah Foto
            </h1>
            <p style={{ fontSize: '13px', color: '#888' }}>
              Masukkan PIN atau Login ke Akun Admin aduHP untuk mengelola foto katalog resmi.
            </p>
          </div>

          {authError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11.5px', color: '#aaa', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                PIN Keamanan Admin
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Masukkan PIN (contoh: aduhp888)"
                  style={{
                    width: '100%',
                    background: '#1a1a24',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 12px 10px 38px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                background: 'var(--accent-lime, #00ff88)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '11px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px'
              }}
            >
              <span>Buka Akses Admin</span>
              <ArrowRight size={15} />
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link
              href="/login?redirect=/admin/upload"
              style={{ fontSize: '12px', color: '#00e5ff', textDecoration: 'underline' }}
            >
              Atau Masuk dengan Akun Admin Supabase →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{
              background: 'rgba(0, 255, 136, 0.1)',
              color: '#00ff88',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <ShieldCheck size={12} />
              ADMIN PANEL • STORAGE SINKRON
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Upload & Sinkronkan Foto Produk HP
          </h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            Konversi otomatis ke <strong>WebP max 800px (&lt;200KB)</strong>, simpan ke bucket Supabase <code>products</code>, dan update database.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/"
            className="btn btn-secondary btn-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ccc',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              textDecoration: 'none'
            }}
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* Sync Status Alert */}
      {syncStatus && (
        <div style={{
          background: syncStatus.type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: syncStatus.type === 'success' ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          color: syncStatus.type === 'success' ? '#00ff88' : '#f87171',
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px'
        }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 600 }}>{syncStatus.message}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed #00ff88' : '2px dashed rgba(255, 255, 255, 0.15)',
          background: isDragging ? 'rgba(0, 255, 136, 0.05)' : '#121217',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '28px'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(0, 229, 255, 0.08)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: '#00e5ff'
        }}>
          <UploadCloud size={32} />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
          Tarik & Letakkan Foto HP di Sini
        </h3>
        <p style={{ color: '#888', fontSize: '13px', maxWidth: '480px', margin: '0 auto 14px' }}>
          Mendukung format JPG, PNG, WEBP. Nama file seperti <code>redmi-note-13-blue-01.jpg</code> otomatis terdeteksi sesuai produk.
        </p>
        <button
          type="button"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Pilih File dari Komputer
        </button>
      </div>

      {/* File Queue & Match Table */}
      {fileItems.length > 0 && (
        <div style={{
          background: '#121217',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                Daftar Foto yang Siap Diproses ({fileItems.length})
              </h3>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                Periksa nama produk yang terdeteksi otomatis sebelum menekan tombol sinkron.
              </p>
            </div>

            <button
              onClick={() => setFileItems([])}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={13} />
              <span>Kosongkan Semua</span>
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: '#888' }}>
                  <th style={{ padding: '10px 12px' }}>Preview</th>
                  <th style={{ padding: '10px 12px' }}>Nama File</th>
                  <th style={{ padding: '10px 12px' }}>Target Produk di Database</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {fileItems.map((item) => {
                  const matchedProd = products.find(p => p.id === item.selectedProductId);

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {/* Thumbnail */}
                      <td style={{ padding: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#1a1a24',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img
                            src={item.previewUrl}
                            alt="preview"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      </td>

                      {/* File Name & Size */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                          {(item.size / 1024).toFixed(1)} KB → WebP Max 800px
                        </div>
                      </td>

                      {/* Product Selector / Auto-Detect */}
                      <td style={{ padding: '12px' }}>
                        <select
                          value={item.selectedProductId}
                          onChange={(e) => updateItemProduct(item.id, e.target.value)}
                          disabled={uploading}
                          style={{
                            background: '#1a1a24',
                            color: '#fff',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            maxWidth: '280px',
                            width: '100%',
                            outline: 'none'
                          }}
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.brand})
                            </option>
                          ))}
                        </select>
                        {matchedProd && (
                          <div style={{ fontSize: '11px', color: '#00ff88', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={11} />
                            <span>Terdeteksi otomatis ({matchedProd.brand})</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px' }}>
                        {item.status === 'ready' && (
                          <span style={{ color: '#aaa', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FileCheck size={13} /> Siap
                          </span>
                        )}
                        {item.status === 'compressing' && (
                          <span style={{ color: '#00e5ff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <RefreshCw size={13} className="spin" /> Kompresi WebP...
                          </span>
                        )}
                        {item.status === 'uploading' && (
                          <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <RefreshCw size={13} className="spin" /> Unggah Storage...
                          </span>
                        )}
                        {item.status === 'success' && (
                          <span style={{ color: '#00ff88', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <CheckCircle2 size={13} /> Berhasil
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={item.errorMessage}>
                            <AlertCircle size={13} /> Gagal
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => removeFileItem(item.id)}
                          disabled={uploading}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#666',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Hapus dari antrean"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Progress Bar when Uploading */}
          {uploading && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                <span>Memproses kompresi & sinkronisasi Supabase...</span>
                <span style={{ fontWeight: 700, color: '#00ff88' }}>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#1a1a24', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00e5ff, #00ff88)',
                  transition: 'width 0.2s ease'
                }} />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={handleUploadAndSync}
              disabled={uploading}
              style={{
                background: 'var(--accent-lime, #00ff88)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                opacity: uploading ? 0.6 : 1
              }}
            >
              <RefreshCw size={15} className={uploading ? 'spin' : ''} />
              <span>{uploading ? 'Sedang Menyinkronkan...' : 'Upload & Sinkronkan ke Supabase'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
