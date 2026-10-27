'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  session: null,
  loading: true,
  sendOtp: async () => {},
  verifyOtp: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signInAsGuest: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
  setWaSession: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set sesi user WhatsApp (disimpan ke state & localStorage agar terdeteksi di seluruh web)
  const setWaSession = (waUser, waProfile = null) => {
    setUser(waUser);
    if (waProfile) {
      setProfile(waProfile);
    }
    if (typeof window !== 'undefined') {
      if (waUser) {
        localStorage.setItem('aduhp_auth_user', JSON.stringify(waUser));
        if (waProfile) {
          localStorage.setItem('aduhp_auth_profile', JSON.stringify(waProfile));
        }
      } else {
        localStorage.removeItem('aduhp_auth_user');
        localStorage.removeItem('aduhp_auth_profile');
      }
    }
  };

  // Fetch profil dari tabel public.users
  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.warn('Error fetching public.users profile:', err);
    }
  };

  useEffect(() => {
    // 1. Ambil session aktif saat startup
    async function getInitialSession() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        if (currentUser) {
          setUser(currentUser);
          if (currentUser?.id) {
            await fetchProfile(currentUser.id);
          }
        } else {
          // Cek fallback sesi WhatsApp di localStorage jika login via OTP WhatsApp
          if (typeof window !== 'undefined') {
            const savedWaUser = localStorage.getItem('aduhp_auth_user');
            const savedWaProfile = localStorage.getItem('aduhp_auth_profile');
            if (savedWaUser) {
              try {
                const parsedUser = JSON.parse(savedWaUser);
                setUser(parsedUser);
                if (savedWaProfile) {
                  setProfile(JSON.parse(savedWaProfile));
                } else if (parsedUser?.id) {
                  await fetchProfile(parsedUser.id);
                }
              } catch (e) {
                console.warn('Error parsing saved WA user session:', e);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching initial Supabase session:', err);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    // 2. Listener event perubahan auth state (login OTP, password, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        if (currentUser?.id) {
          await fetchProfile(currentUser.id);
        }
      } else {
        // Jangan hapus user jika sesi WhatsApp sedang aktif di localStorage
        const hasWaUser = typeof window !== 'undefined' ? localStorage.getItem('aduhp_auth_user') : null;
        if (!hasWaUser) {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 3. Kirim Kode OTP (bisa via Email atau WhatsApp / No. HP)
  const sendOtp = async ({ method = 'email', email, phone, displayName }) => {
    const isEmail = method === 'email' || (!phone && email);
    const nama = displayName ? displayName.trim() : '';

    if (isEmail) {
      if (!email || !email.trim()) {
        throw new Error('Harap masukkan alamat Email Anda.');
      }
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          data: {
            display_name: nama || undefined,
            full_name: nama || undefined
          }
        }
      });
      if (error) throw error;
      return { success: true, method: 'email', target: cleanEmail, data };
    } else {
      // WhatsApp Method
      if (!phone || !phone.trim()) {
        throw new Error('Harap masukkan Nomor WhatsApp aktif Anda.');
      }
      const rawWa = phone.trim().replace(/\D/g, '');
      const waClean = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : (rawWa.startsWith('62') ? rawWa : '62' + rawWa);

      // Panggil Supabase Edge Function 'send-wa-otp'
      try {
        const { data, error } = await supabase.functions.invoke('send-wa-otp', {
          body: {
            phone: waClean,
            display_name: nama || undefined
          }
        });

        if (error) {
          console.warn('send-wa-otp edge function warning:', error);
          // Fallback ke Supabase Phone Auth jika Edge Function belum aktif
          const { data: phoneData, error: phoneError } = await supabase.auth.signInWithOtp({
            phone: '+' + waClean,
            options: {
              data: {
                display_name: nama || undefined,
                full_name: nama || undefined,
                phone: waClean
              }
            }
          });
          if (phoneError) throw (error || phoneError);
          return { success: true, method: 'whatsapp', target: waClean, data: phoneData };
        }

        return { success: true, method: 'whatsapp', target: waClean, data };
      } catch (err) {
        console.warn('Fallback error for WhatsApp OTP:', err);
        const { data: phoneData, error: phoneError } = await supabase.auth.signInWithOtp({
          phone: '+' + waClean,
          options: {
            data: {
              display_name: nama || undefined,
              full_name: nama || undefined,
              phone: waClean
            }
          }
        });
        if (phoneError) throw (err || phoneError);
        return { success: true, method: 'whatsapp', target: waClean, data: phoneData };
      }
    }
  };

  // 4. Verifikasi Kode OTP (6 digit)
  const verifyOtp = async ({ method = 'email', email, phone, token, displayName, whatsappNumber }) => {
    const cleanToken = token ? token.trim().replace(/\s/g, '') : '';
    if (!cleanToken || cleanToken.length < 6) {
      throw new Error('Kode OTP harus terdiri dari 6 digit.');
    }

    const nama = displayName ? displayName.trim() : '';
    let targetEmail = email ? email.trim() : null;
    let targetPhone = null;

    if (phone) {
      const rawWa = phone.trim().replace(/\D/g, '');
      targetPhone = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : (rawWa.startsWith('62') ? rawWa : '62' + rawWa);
    }

    let authUser = null;
    let data = null;

    if (method === 'email' || targetEmail) {
      const res = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: cleanToken,
        type: 'email'
      });
      if (res.error) throw res.error;
      data = res.data;
      authUser = data?.user;
    } else {
      // WhatsApp OTP verification
      try {
        const efRes = await supabase.functions.invoke('verify-wa-otp', {
          body: {
            phone: targetPhone,
            token: cleanToken,
            display_name: nama || undefined
          }
        });
        if (efRes.data && efRes.data.user) {
          data = efRes.data;
          authUser = data.user;
        } else {
          const res = await supabase.auth.verifyOtp({
            phone: '+' + targetPhone,
            token: cleanToken,
            type: 'sms'
          });
          if (res.error) throw (efRes.error || res.error);
          data = res.data;
          authUser = data?.user;
        }
      } catch (err) {
        const res = await supabase.auth.verifyOtp({
          phone: '+' + targetPhone,
          token: cleanToken,
          type: 'sms'
        });
        if (res.error) throw (err || res.error);
        data = res.data;
        authUser = data?.user;
      }
    }

    // Sinkronisasi data ke public.users
    // Mencegah duplikasi baris dan mengisi kolom whatsapp_number / display_name yang tadinya NULL
    if (authUser) {
      const finalName = nama || authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || null;
      const finalPhone = targetPhone || whatsappNumber || authUser.phone || null;

      try {
        await supabase.from('users').upsert({
          id: authUser.id,
          display_name: finalName,
          email: authUser.email || targetEmail || null,
          whatsapp_number: finalPhone,
          is_guest: authUser.is_anonymous || false
        }, { onConflict: 'id' });
      } catch (syncErr) {
        console.warn('Sync to public.users error:', syncErr);
      }

      await fetchProfile(authUser.id);
    }

    return data;
  };

  // 5. Login dengan Email & Password biasa
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    if (data?.user) {
      await fetchProfile(data.user.id);
    }
    return data;
  };

  // 6. Daftar Akun Baru dengan Password
  const signUp = async (email, password, metadata = {}) => {
    const dName = metadata.displayName || metadata.fullName || '';
    const phone = metadata.phone || '';

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: dName,
          full_name: dName,
          phone: phone,
          address: metadata.address || ''
        }
      }
    });
    if (error) throw error;

    if (data?.user) {
      try {
        await supabase.from('users').upsert({
          id: data.user.id,
          display_name: dName || null,
          email: email.trim(),
          whatsapp_number: phone || null,
          is_guest: false
        }, { onConflict: 'id' });
      } catch (syncErr) {
        console.warn('Sync to public.users on signup error:', syncErr);
      }
      await fetchProfile(data.user.id);
    }

    return data;
  };

  // 7. Login Cepat sebagai Tamu (Anonymous Guest)
  const signInAsGuest = async (displayName, phone) => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            display_name: displayName || 'Pembeli Tamu',
            phone: phone || ''
          }
        }
      });
      if (error) throw error;
      if (data?.user) {
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            display_name: displayName || 'Pembeli Tamu',
            whatsapp_number: phone || null,
            is_guest: true
          }, { onConflict: 'id' });
        } catch (e) {}
        await fetchProfile(data.user.id);
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  // 8. Keluar / Logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut warning:', e);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aduhp_auth_user');
      localStorage.removeItem('aduhp_auth_profile');
    }
  };

  // 9. Update profil & metadata
  const updateProfile = async (updates) => {
    const dName = updates.displayName || updates.display_name;
    const wPhone = updates.whatsappNumber || updates.whatsapp_number || updates.phone;

    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: dName,
        full_name: dName,
        phone: wPhone
      }
    });
    if (error) throw error;

    if (user?.id) {
      try {
        await supabase.from('users').update({
          display_name: dName || undefined,
          whatsapp_number: wPhone || undefined,
        }).eq('id', user.id);
        await fetchProfile(user.id);
      } catch (e) {}
    }

    return data;
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      sendOtp,
      verifyOtp,
      signIn,
      signUp,
      signInAsGuest,
      signOut,
      updateProfile,
      refreshProfile,
      setWaSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
