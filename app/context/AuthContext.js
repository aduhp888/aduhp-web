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
  refreshProfile: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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
        setUser(currentUser);
        if (currentUser?.id) {
          await fetchProfile(currentUser.id);
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
      setUser(currentUser);
      if (currentUser?.id) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 3. Kirim Kode OTP (bisa via Email atau WhatsApp / No. HP)
  const sendOtp = async ({ email, phone, displayName }) => {
    const cleanEmail = email ? email.trim() : null;
    let cleanPhone = null;

    if (phone) {
      cleanPhone = phone.trim().replace(/[-\s]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '+62' + cleanPhone.slice(1);
      } else if (cleanPhone.startsWith('62')) {
        cleanPhone = '+' + cleanPhone;
      } else if (!cleanPhone.startsWith('+')) {
        cleanPhone = '+62' + cleanPhone;
      }
    }

    const options = {
      shouldCreateUser: true,
      data: {
        display_name: displayName || undefined,
        full_name: displayName || undefined,
        phone: cleanPhone || undefined
      }
    };

    if (cleanEmail) {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options
      });
      if (error) throw error;
      return { success: true, method: 'email', target: cleanEmail, data };
    } else if (cleanPhone) {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: cleanPhone,
        options
      });
      if (error) throw error;
      return { success: true, method: 'phone', target: cleanPhone, data };
    }

    throw new Error('Harap masukkan alamat Email atau Nomor WhatsApp aktif.');
  };

  // 4. Verifikasi Kode OTP (6 digit)
  const verifyOtp = async ({ email, phone, token, displayName, whatsappNumber }) => {
    const cleanToken = token ? token.trim().replace(/\s/g, '') : '';
    if (!cleanToken || cleanToken.length < 6) {
      throw new Error('Kode OTP harus terdiri dari 6 digit.');
    }

    let params = {
      token: cleanToken
    };

    let targetEmail = null;
    let targetPhone = null;

    if (email) {
      targetEmail = email.trim();
      params.email = targetEmail;
      params.type = 'email';
    } else if (phone) {
      let cleanPhone = phone.trim().replace(/[-\s]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '+62' + cleanPhone.slice(1);
      else if (cleanPhone.startsWith('62')) cleanPhone = '+' + cleanPhone;
      else if (!cleanPhone.startsWith('+')) cleanPhone = '+62' + cleanPhone;

      targetPhone = cleanPhone;
      params.phone = cleanPhone;
      params.type = 'sms';
    } else {
      throw new Error('Target verifikasi (Email atau No. WhatsApp) tidak ditemukan.');
    }

    const { data, error } = await supabase.auth.verifyOtp(params);
    if (error) throw error;

    // Sinkronisasi data ke public.users
    if (data?.user) {
      const finalName = displayName || data.user.user_metadata?.display_name || data.user.user_metadata?.full_name || '';
      const finalPhone = targetPhone || whatsappNumber || data.user.phone || data.user.user_metadata?.phone || '';

      try {
        await supabase.from('users').upsert({
          id: data.user.id,
          display_name: finalName || null,
          email: data.user.email || targetEmail || null,
          whatsapp_number: finalPhone || null,
          is_guest: data.user.is_anonymous || false
        }, { onConflict: 'id' });
      } catch (syncErr) {
        console.warn('Sync to public.users error:', syncErr);
      }

      await fetchProfile(data.user.id);
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
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    if (error) throw error;
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
      refreshProfile
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
