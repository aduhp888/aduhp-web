'use client';

import { useState, useEffect, Suspense } from 'react';
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
  KeyRound,
  Sparkles,
  RefreshCw,
  MessageCircle,
  HelpCircle,
  UserCheck
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { sendOtp, verifyOtp, signIn, signUp, signInAsGuest, user } = useAuth();

  // If already logged in, redirect immediately
  useEffect(() => {
    if (user) {
      router.replace(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  // Main Auth Tab: 'otp' (default) | 'password' | 'register'
  const [activeTab, setActiveTab] = useState('otp');

  // OTP State
  const [otpChannel, setOtpChannel] = useState('email'); // 'email' | 'phone'
  const [otpStep, setOtpStep] = useState('input'); // 'input' | 'verify'
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpDisplayName, setOtpDisplayName] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 1. Handle Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (otpChannel === 'email' && !otpEmail.trim()) {
      setErrorMsg('Harap masukkan alamat Email Anda.');
      return;
    }
    if (otpChannel === 'phone' && (!otpPhone.trim() || otpPhone.length < 9)) {
      setErrorMsg('Harap masukkan Nomor WhatsApp aktif (minimal 9 digit).');
      return;
    }

    setLoading(true);
    try {
      await sendOtp({
        email: otpChannel === 'email' ? otpEmail.trim() : null,
        phone: otpChannel === 'phone' ? otpPhone.trim() : null,
        displayName: otpDisplayName.trim() || undefined
      });

      const target = otpChannel === 'email' ? otpEmail.trim() : otpPhone.trim();
      setSuccessMsg(`✓ Kode OTP 6 digit telah dikirim ke ${target}. Silakan cek kotak masuk.`);
      setOtpStep('verify');
      setResendCooldown(60);
    } catch (err) {
      console.error('Send OTP error:', err);
      let msg = err.message || 'Gagal mengirim kode OTP.';

      if (msg.includes('phone_provider_disabled') || msg.includes('Unsupported phone provider')) {
        msg = 'Penyedia SMS/WhatsApp OTP belum diaktifkan di dashboard Supabase (Authentication > Providers > Phone). Silakan gunakan OTP Email di bawah ini yang sudah langsung aktif.';
        setOtpChannel('email');
      } else if (msg.includes('rate limit')) {
        msg = 'Terlalu banyak permintaan OTP. Harap tunggu beberapa saat sebelum mencoba kembali.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otpToken.trim() || otpToken.trim().length < 6) {
      setErrorMsg('Harap masukkan 6 digit kode OTP verifikasi.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({
        email: otpChannel === 'email' ? otpEmail.trim() : null,
        phone: otpChannel === 'phone' ? otpPhone.trim() : null,
        token: otpToken.trim(),
        displayName: otpDisplayName.trim() || undefined,
        whatsappNumber: otpPhone.trim() || undefined
      });

      setSuccessMsg('✓ Verifikasi OTP berhasil! Anda sedang dialihkan...');
      setTimeout(() => {
        router.push(redirectUrl);
      }, 700);
    } catch (err) {
      console.error('Verify OTP error:', err);
      let msg = err.message || 'Kode OTP tidak valid atau telah kadaluarsa.';
      if (msg.includes('Token has expired') || msg.includes('otp_expired')) {
        msg = 'Kode OTP telah kadaluarsa. Silakan minta kode baru.';
      } else if (msg.includes('invalid') || msg.includes('Token is invalid')) {
        msg = 'Kode OTP yang Anda masukkan salah. Periksa kembali 6 digit kode Anda.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Harap masukkan email dan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      await signIn(loginEmail.trim(), loginPassword);
      setSuccessMsg('✓ Login berhasil! Mengalihkan ke halaman tujuan...');
      setTimeout(() => {
        router.push(redirectUrl);
      }, 600);
    } catch (err) {
      console.error('Login error:', err);
      let msg = err.message || 'Gagal login. Periksa email dan kata sandi Anda.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Email atau kata sandi yang Anda masukkan salah.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Password Register
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
        displayName: regFullName.trim(),
        fullName: regFullName.trim(),
        phone: regPhone.trim()
      });
      setSuccessMsg('✓ Pendaftaran berhasil! Akun Anda telah aktif...');
      setTimeout(() => {
        router.push(redirectUrl);
      }, 700);
    } catch (err) {
      console.error('Register error:', err);
      let msg = err.message || 'Pendaftaran gagal.';
      if (msg.includes('User already registered')) {
        msg = 'Email ini sudah terdaftar. Silakan login menggunakan OTP atau kata sandi.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Guest Quick Login
  const handleGuestLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const guestName = otpDisplayName.trim() || 'Pembeli Tamu aduHP';
      await signInAsGuest(guestName, otpPhone.trim() || null);
      setSuccessMsg('✓ Berhasil masuk sebagai Tamu! Mengalihkan ke checkout...');
      setTimeout(() => {
        router.push(redirectUrl);
      }, 600);
    } catch (err) {
      setErrorMsg('Login tamu tidak diizinkan di pengaturan Supabase. Silakan gunakan OTP Email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 20%, rgba(198, 255, 0, 0.07) 0%, #0d0d12 100%)',
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
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#000',
            border: '1px solid rgba(198, 255, 0, 0.4)',
            boxShadow: '0 0 16px rgba(198, 255, 0, 0.25)'
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="AduHP Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            adu<span style={{ color: 'var(--accent-lime)' }}>HP</span>
          </span>
        </Link>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '6px' }}>
          Platform E-Commerce & Perbandingan Smartphone Resmi Indonesia
        </p>
      </div>

      {/* Main Auth Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#14141a',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)'
      }}>

        {/* Back Link if from checkout */}
        {redirectUrl && redirectUrl !== '/' && (
          <div style={{ marginBottom: '18px' }}>
            <Link
              href={redirectUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#aaa',
                fontSize: '12px',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Checkout Pesanan</span>
            </Link>
          </div>
        )}

        {/* Tab Selection */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('otp'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'otp' ? 'var(--accent-lime)' : 'transparent',
              color: activeTab === 'otp' ? '#000' : '#aaa',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <KeyRound size={15} />
            <span>Login OTP (Cepat)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('password'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'password' ? 'var(--accent-lime)' : 'transparent',
              color: activeTab === 'password' ? '#000' : '#aaa',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Lock size={15} />
            <span>Kata Sandi</span>
          </button>
        </div>

        {/* Alerts (Error / Success) */}
        {errorMsg && (
          <div style={{
            background: 'rgba(255, 69, 58, 0.12)',
            border: '1px solid rgba(255, 69, 58, 0.35)',
            padding: '12px 16px',
            borderRadius: '12px',
            color: '#FF6B6B',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '20px',
            lineHeight: 1.45
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(198, 255, 0, 0.12)',
            border: '1px solid rgba(198, 255, 0, 0.4)',
            padding: '12px 16px',
            borderRadius: '12px',
            color: 'var(--accent-lime)',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '20px',
            lineHeight: 1.45
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: LOGIN DENGAN KODE OTP (EMAIL / WHATSAPP)          */}
        {/* ======================================================== */}
        {activeTab === 'otp' && (
          <div>
            {otpStep === 'input' ? (
              <form onSubmit={handleSendOtp} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                    Masuk Tanpa Kata Sandi
                  </div>
                  <p style={{ fontSize: '12px', color: '#888', margin: 0, lineHeight: 1.4 }}>
                    Kami akan mengirimkan 6 digit kode OTP verifikasi resmi ke kontak Anda.
                  </p>
                </div>

                {/* OTP Channel Selector: Email vs WhatsApp */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setOtpChannel('email'); setErrorMsg(''); }}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: otpChannel === 'email' ? '2px solid var(--accent-lime)' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: otpChannel === 'email' ? 'rgba(198, 255, 0, 0.08)' : '#1a1a22',
                      color: otpChannel === 'email' ? 'var(--accent-lime)' : '#aaa',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Mail size={15} />
                    <span>OTP Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtpChannel('phone'); setErrorMsg(''); }}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: otpChannel === 'phone' ? '2px solid #25D366' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: otpChannel === 'phone' ? 'rgba(37, 211, 102, 0.08)' : '#1a1a22',
                      color: otpChannel === 'phone' ? '#25D366' : '#aaa',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>OTP WhatsApp</span>
                  </button>
                </div>

                {/* Display Name Input (Saved to public.users.display_name) */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#aaa', marginBottom: '6px' }}>
                    Nama Lengkap / Panggilan (Opsional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#666" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={otpDisplayName}
                      onChange={(e) => setOtpDisplayName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '10.5px', color: '#666', marginTop: '4px', display: 'block' }}>
                    Akan otomatis tersimpan di tabel profil akun Anda.
                  </span>
                </div>

                {/* Email or Phone Input */}
                {otpChannel === 'email' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#aaa', marginBottom: '6px' }}>
                      Alamat Email <span style={{ color: '#FF453A' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} color="#666" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="email"
                        required
                        placeholder="nama@example.com"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#aaa', marginBottom: '6px' }}>
                      Nomor WhatsApp / HP Aktif <span style={{ color: '#FF453A' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} color="#666" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="tel"
                        required
                        placeholder="Contoh: 081234567890"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#666', marginTop: '4px', display: 'block' }}>
                      Awali dengan 08... atau +628...
                    </span>
                  </div>
                )}

                {/* Submit Send OTP */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'var(--accent-lime)',
                    border: 'none',
                    color: '#000',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 20px rgba(198, 255, 0, 0.25)',
                    marginTop: '8px'
                  }}
                >
                  {loading ? (
                    <span>Mengirim Kode OTP...</span>
                  ) : (
                    <>
                      <span>Kirim Kode OTP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Input 6-Digit OTP Code */
              <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: '18px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                    Masukkan 6 Digit Kode OTP
                  </div>
                  <p style={{ fontSize: '12px', color: '#888', margin: 0, lineHeight: 1.4 }}>
                    Kode verifikasi telah dikirim ke{' '}
                    <strong style={{ color: '#fff' }}>
                      {otpChannel === 'email' ? otpEmail : otpPhone}
                    </strong>
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#aaa', marginBottom: '8px' }}>
                    Kode OTP 6 Digit <span style={{ color: '#FF453A' }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="• • • • • •"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid var(--accent-lime)',
                      borderRadius: '12px',
                      color: 'var(--accent-lime)',
                      fontSize: '24px',
                      fontWeight: 900,
                      textAlign: 'center',
                      letterSpacing: '12px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpToken.length < 6}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: otpToken.length === 6 ? 'var(--accent-lime)' : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: otpToken.length === 6 ? '#000' : '#888',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: loading || otpToken.length < 6 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <span>Memverifikasi...</span>
                  ) : (
                    <>
                      <span>Verifikasi & Masuk Akun</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Resend OTP & Change Contact */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setOtpStep('input'); setOtpToken(''); setErrorMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Ganti Nomor / Email
                  </button>

                  {resendCooldown > 0 ? (
                    <span style={{ color: '#666' }}>
                      Kirim ulang ({resendCooldown}s)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-lime)', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Kirim Ulang Kode
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LOGIN DENGAN KATA SANDI (EMAIL & PASSWORD)        */}
        {/* ======================================================== */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                Masuk dengan Kata Sandi
              </div>
              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                Gunakan email dan kata sandi yang telah Anda daftarkan sebelumnya.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#aaa', marginBottom: '6px' }}>
                Alamat Email <span style={{ color: '#FF453A' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#666" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="budi@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#aaa', marginBottom: '6px' }}>
                Kata Sandi <span style={{ color: '#FF453A' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#666" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--accent-lime)',
                border: 'none',
                color: '#000',
                fontSize: '14px',
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(198, 255, 0, 0.25)',
                marginTop: '8px'
              }}
            >
              {loading ? (
                <span>Memproses Masuk...</span>
              ) : (
                <>
                  <span>Masuk Akun</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Link to Register Tab */}
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12.5px', color: '#888' }}>
              Belum punya kata sandi?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-lime)', cursor: 'pointer', fontWeight: 700 }}
              >
                Daftar Akun Baru
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DAFTAR AKUN BARU DENGAN SANDI                     */}
        {/* ======================================================== */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'grid', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                Daftar Akun Baru
              </div>
              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                Lengkapi profil Anda untuk kemudahan faktur transaksi resmi PT.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#aaa', marginBottom: '6px' }}>
                Nama Lengkap Penerima <span style={{ color: '#FF453A' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#aaa', marginBottom: '6px' }}>
                Nomor WhatsApp Aktif <span style={{ color: '#FF453A' }}>*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#aaa', marginBottom: '6px' }}>
                Alamat Email <span style={{ color: '#FF453A' }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="budi@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#aaa', marginBottom: '6px' }}>
                Kata Sandi Baru <span style={{ color: '#FF453A' }}>*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--accent-lime)',
                border: 'none',
                color: '#000',
                fontSize: '14px',
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(198, 255, 0, 0.25)',
                marginTop: '8px'
              }}
            >
              {loading ? (
                <span>Mendaftarkan Akun...</span>
              ) : (
                <>
                  <span>Daftar Sekarang</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12.5px', color: '#888' }}>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('otp'); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-lime)', cursor: 'pointer', fontWeight: 700 }}
              >
                Masuk via OTP
              </button>
            </div>
          </form>
        )}

        {/* Security & Legal Guarantee Note */}
        <div style={{
          marginTop: '28px',
          paddingTop: '18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'grid',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#aaa' }}>
            <ShieldCheck size={14} color="var(--accent-lime)" />
            <span>Data terlindungi enkripsi SSL 256-bit berbadan hukum resmi PT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#888' }}>
            <UserCheck size={14} color="#00E5FF" />
            <span>Faktur transaksi sah diterbitkan a.n. PT. SECOND CIRCLE TEKNOLOGI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d12' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(198,255,0,0.2)', borderTopColor: 'var(--accent-lime)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
