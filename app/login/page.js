'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  ArrowLeft,
  Smartphone
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { signIn, signUp, user } = useAuth();

  // If already logged in, redirect immediately
  if (user) {
    router.replace(redirectUrl);
  }

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Harap masukkan email dan password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(loginEmail.trim(), loginPassword);
      setSuccessMsg('Login berhasil! Mengalihkan ke halaman tujuan...');
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      let msg = err.message || 'Gagal login. Periksa email dan kata sandi Anda.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Email atau password yang Anda masukkan salah.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regFullName.trim()) {
      setErrorMsg('Harap isi Nama Lengkap penerima.');
      return;
    }
    if (!regPhone.trim() || regPhone.length < 9) {
      setErrorMsg('Harap isi Nomor WhatsApp aktif.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Harap isi alamat Email.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      await signUp(regEmail.trim(), regPassword, {
        fullName: regFullName.trim(),
        phone: regPhone.trim()
      });
      setSuccessMsg('Pendaftaran akun berhasil! Anda langsung diarahkan ke tujuan...');
      setTimeout(() => {
        router.push(redirectUrl);
      }, 700);
    } catch (err) {
      console.error('Register error:', err);
      let msg = err.message || 'Pendaftaran gagal.';
      if (msg.includes('User already registered')) {
        msg = 'Email ini sudah terdaftar. Silakan login pada tab Masuk.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 20%, rgba(198, 255, 0, 0.06) 0%, #0d0d12 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px'
    }}>
      
      {/* Top Brand Logo */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#000',
            border: '1px solid rgba(198, 255, 0, 0.4)',
            boxShadow: '0 0 16px rgba(198, 255, 0, 0.25)'
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="AduHP Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            adu<span style={{ color: 'var(--accent-lime)' }}>HP</span>
          </span>
        </Link>
        <p style={{ color: '#888', fontSize: '12.5px', marginTop: '6px' }}>
          Platform E-Commerce & Duel Spek Smartphone Resmi Indonesia
        </p>
      </div>

      {/* Main Auth Box */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#14141c',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)'
      }}>
        
        {/* Notice Why Login is Required */}
        {redirectUrl.includes('/checkout') && (
          <div style={{
            background: 'rgba(198, 255, 0, 0.08)',
            border: '1px solid rgba(198, 255, 0, 0.25)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <ShieldCheck size={18} color="var(--accent-lime)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.5 }}>
              <strong style={{ color: '#fff' }}>Login Diperlukan Sebelum Pembayaran</strong>
              <p style={{ margin: '2px 0 0 0', color: '#aaa' }}>
                Untuk keamanan pencatatan legalitas faktur, jaminan garansi resmi distributor, dan nomor rekening PT.
              </p>
            </div>
          </div>
        )}

        {/* Tab Header: Masuk vs Daftar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'login' ? 'var(--accent-lime)' : 'transparent',
              color: activeTab === 'login' ? '#000' : '#888',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'register' ? 'var(--accent-lime)' : 'transparent',
              color: activeTab === 'register' ? '#000' : '#888',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div style={{
            background: 'rgba(255, 69, 58, 0.1)',
            border: '1px solid rgba(255, 69, 58, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#FF8888'
          }}>
            <AlertCircle size={16} color="#FF453A" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(52, 199, 89, 0.1)',
            border: '1px solid rgba(52, 199, 89, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#70E890'
          }}>
            <CheckCircle2 size={16} color="#34C759" style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: FORM LOGIN */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ccc', marginBottom: '6px' }}>
                Alamat Email:
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '12px 14px 12px 38px',
                    color: '#fff',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ccc', marginBottom: '6px' }}>
                Kata Sandi:
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '12px 14px 12px 38px',
                    color: '#fff',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '14.5px',
                fontWeight: 900,
                background: 'var(--accent-lime)',
                color: '#000',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 16px rgba(198, 255, 0, 0.25)'
              }}
            >
              {loading ? 'Memproses Masuk...' : 'Masuk ke Akun'}
            </button>
          </form>
        ) : (
          /* TAB 2: FORM REGISTER */
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ccc', marginBottom: '6px' }}>
                Nama Lengkap Penerima:
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
                <input
                  type="text"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="Nama Lengkap (sesuai penerima paket)"
                  required
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '11px 14px 11px 38px',
                    color: '#fff',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ccc', marginBottom: '6px' }}>
                Nomor WhatsApp Aktif:
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  required
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '11px 14px 11px 38px',
                    color: '#fff',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ccc', marginBottom: '6px' }}>
                Alamat Email:
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '11px 14px 11px 38px',
                    color: '#fff',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#ccc', marginBottom: '6px' }}>
                Buat Kata Sandi:
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  style={{
                    width: '100%',
                    background: '#0d0d12',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '11px 14px 11px 38px',
                    color: '#fff',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '14.5px',
                fontWeight: 900,
                background: 'var(--accent-lime)',
                color: '#000',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 16px rgba(198, 255, 0, 0.25)'
              }}
            >
              {loading ? 'Mendaftarkan Akun...' : 'Daftar Akun & Lanjut'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#888', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={13} />
            <span>Kembali ke Beranda aduHP</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d12' }}>
        <p style={{ color: '#aaa' }}>Memuat halaman masuk...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
