'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Headphones, 
  ExternalLink, 
  Clock, 
  Check, 
  CheckCheck, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatIDR } from '../lib/utils';

// Nomor WhatsApp resmi fallback sesuai arahan (+621511843450)
const WA_NUMBER = '621511843450';

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio autoplay policy fallback
  }
}

export default function StockChatWidget({
  product,
  selectedRam,
  selectedStorage,
  selectedColor,
  currentStock,
  displayPrice,
  themeColor = '#C6FF00',
  isOpen,
  onClose,
  user
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [guestSessionId, setGuestSessionId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isDbReady, setIsDbReady] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Init guest session ID
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let sId = localStorage.getItem('aduhp_chat_session_id');
    if (!sId) {
      sId = 'guest_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      localStorage.setItem('aduhp_chat_session_id', sId);
    }
    setGuestSessionId(sId);

    const savedName = localStorage.getItem('aduhp_chat_user_name') || (user?.email ? user.email.split('@')[0] : 'Calon Pembeli');
    setCustomerName(savedName);
  }, [user]);

  // Load existing room or prepare conversation
  useEffect(() => {
    if (!isOpen || !guestSessionId || !product?.id) return;

    let isMounted = true;

    async function initChatRoom() {
      setLoading(true);
      setErrorMsg(null);
      try {
        // Cari room yang masih aktif untuk session ini dan produk ini
        const { data: existingRooms, error: findError } = await supabase
          .from('dapur_chat_rooms')
          .select('*')
          .eq('session_id', guestSessionId)
          .eq('product_id', product.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (findError) {
          // Jika tabel belum dibuat di Supabase, set fallback state
          console.warn('Chat DB status:', findError.message);
          setIsDbReady(false);
          setLoading(false);
          return;
        }

        let activeRoom = existingRooms && existingRooms.length > 0 ? existingRooms[0] : null;

        if (!activeRoom) {
          // Buat room baru
          const variantInfo = {
            ram: selectedRam,
            storage: selectedStorage,
            color: selectedColor,
            stock: currentStock,
            price: displayPrice
          };

          const { data: newRoom, error: createError } = await supabase
            .from('dapur_chat_rooms')
            .insert({
              session_id: guestSessionId,
              customer_name: customerName || (user?.email ? user.email.split('@')[0] : 'Calon Pembeli'),
              customer_email: user?.email || null,
              product_id: product.id,
              product_name: product.name,
              product_image: (product.images && product.images[0]) || '',
              variant_info: variantInfo,
              status: 'active',
              last_message: 'Membuka tanya stok produk',
              last_sender_role: 'customer',
              unread_admin_count: 1,
              unread_customer_count: 0
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating chat room:', createError);
            setErrorMsg(createError.message);
          } else {
            activeRoom = newRoom;
          }
        }

        if (activeRoom && isMounted) {
          setRoomId(activeRoom.id);

          // Ambil riwayat pesan
          const { data: messageList, error: msgError } = await supabase
            .from('dapur_chat_messages')
            .select('*')
            .eq('room_id', activeRoom.id)
            .order('created_at', { ascending: true });

          if (!msgError && messageList) {
            // Jika pesan masih kosong, tambahkan auto welcome message
            if (messageList.length === 0) {
              const defaultMsg = {
                id: 'welcome-bot',
                room_id: activeRoom.id,
                sender_role: 'admin',
                sender_name: 'CS Dapur AduHP',
                message: `Halo kak! 👋 Ada yang bisa kami bantu seputar stok ${product.name} varian ${selectedRam}GB/${selectedStorage}GB (${selectedColor})? Tim kami siap cek fisik unit langsung di gudang.`,
                created_at: new Date().toISOString()
              };
              setMessages([defaultMsg]);
            } else {
              setMessages(messageList);
            }
          }
        }
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initChatRoom();

    return () => {
      isMounted = false;
    };
  }, [isOpen, guestSessionId, product?.id, selectedRam, selectedStorage, selectedColor]);

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat_room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dapur_chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            // Cegah duplikasi jika sudah di-push optimistically
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Bunyikan notifikasi jika pengirim adalah admin
          if (newMsg.sender_role === 'admin') {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Handle Send Message
  const handleSendMessage = async (customText = null) => {
    const textToSend = (typeof customText === 'string' ? customText : inputMessage).trim();
    if (!textToSend || !roomId) return;

    if (!customText) {
      setInputMessage('');
    }

    const tempId = 'temp_' + Date.now();
    const optimisticMessage = {
      id: tempId,
      room_id: roomId,
      sender_role: 'customer',
      sender_name: customerName || 'Saya',
      message: textToSend,
      created_at: new Date().toISOString(),
      is_read: false
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('dapur_chat_messages')
        .insert({
          room_id: roomId,
          sender_role: 'customer',
          sender_name: customerName || 'Saya',
          message: textToSend,
          product_snapshot: {
            product_name: product.name,
            variant: `${selectedRam}GB/${selectedStorage}GB - ${selectedColor}`,
            price: displayPrice,
            stock: currentStock
          }
        })
        .select()
        .single();

      if (!error && data) {
        // Ganti pesan optimistik dengan data asli
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));

        // Update info room
        await supabase
          .from('dapur_chat_rooms')
          .update({
            last_message: textToSend,
            last_sender_role: 'customer',
            last_message_at: new Date().toISOString(),
            unread_admin_count: 1
          })
          .eq('id', roomId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // WhatsApp Fallback Link Builder
  const buildWaUrl = () => {
    const text = `Halo Admin aduHP! 📱\nSaya mau tanya ketersediaan stok produk:\n\n*${product?.name}*\n• Varian: ${selectedRam}GB / ${selectedStorage}GB\n• Warna: ${selectedColor}\n• Harga: ${formatIDR(displayPrice)}\n• Info Stok Web: ${currentStock} Unit\n\nApakah stok unit ini siap kirim sekarang? Terima kasih!`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      padding: '16px'
    }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '620px',
          maxHeight: '90vh',
          background: 'linear-gradient(180deg, #13141a 0%, #0a0b0e 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75), 0 0 20px rgba(198, 255, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatModalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(198, 255, 0, 0.12)',
              border: '1px solid rgba(198, 255, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C6FF00'
            }}>
              <Headphones size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                  Live CS Dapur aduHP
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#C6FF00',
                  background: 'rgba(198, 255, 0, 0.15)',
                  padding: '2px 7px',
                  borderRadius: '20px'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#C6FF00',
                    boxShadow: '0 0 6px #C6FF00'
                  }} />
                  ONLINE
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#888' }}>
                Terkoneksi langsung ke admin panel (dapur.aduhp.com)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#aaa',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Tutup Chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTEXT CARD: PRODUK & VARIAN YANG DITANYAKAN */}
        <div style={{
          padding: '12px 18px',
          background: 'rgba(198, 255, 0, 0.04)',
          borderBottom: '1px solid rgba(198, 255, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {product?.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={product.images[0]} 
                alt={product.name} 
                style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', background: '#000', border: '1px solid rgba(255, 255, 255, 0.1)' }} 
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={20} color="#888" />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {product?.name}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#C6FF00', fontWeight: 700 }}>{selectedRam}GB/{selectedStorage}GB</span>
                <span>•</span>
                <span style={{ color: '#fff' }}>{selectedColor}</span>
                <span>•</span>
                <span style={{ color: '#00E5FF', fontWeight: 700 }}>{formatIDR(displayPrice)}</span>
              </div>
            </div>
          </div>

          <div style={{
            textAlign: 'right',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: currentStock > 0 ? 'rgba(198, 255, 0, 0.15)' : 'rgba(255, 75, 75, 0.15)',
              color: currentStock > 0 ? '#C6FF00' : '#FF6B6B',
              fontWeight: 800
            }}>
              {currentStock > 0 ? `Stok: ${currentStock} Unit` : 'Habis'}
            </span>
          </div>
        </div>

        {/* WHATSAPP FALLBACK BANNER */}
        <div style={{
          padding: '8px 18px',
          background: 'rgba(37, 211, 102, 0.08)',
          borderBottom: '1px solid rgba(37, 211, 102, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <span style={{ fontSize: '11.5px', color: '#25D366', fontWeight: 600 }}>
            ⚡ Butuh respon instan atau admin offline?
          </span>
          <a
            href={buildWaUrl()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '6px',
              background: '#25D366',
              color: '#000',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              flexShrink: 0
            }}
          >
            <span>Chat WhatsApp</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {!isDbReady && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 145, 0, 0.1)',
              border: '1px solid rgba(255, 145, 0, 0.3)',
              color: '#FF9100',
              fontSize: '12px',
              lineHeight: 1.5
            }}>
              <strong>Info:</strong> Tabel chat realtime di database belum diaktifkan oleh admin. Silakan gunakan tombol <strong>Chat WhatsApp</strong> di atas untuk respon instan, atau jalankan file SQL migration di dashboard Supabase.
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', fontSize: '13px', margin: 'auto' }}>
              Menghubungkan ke admin panel...
            </div>
          ) : (
            messages.map((msg) => {
              const isAdmin = msg.sender_role === 'admin';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAdmin ? 'flex-start' : 'flex-end',
                    maxWidth: '82%',
                    alignSelf: isAdmin ? 'flex-start' : 'flex-end'
                  }}
                >
                  <div style={{
                    fontSize: '10.5px',
                    color: '#777',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>{isAdmin ? 'CS Admin Dapur' : 'Anda'}</span>
                    <span>•</span>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isAdmin ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    background: isAdmin ? 'rgba(255, 255, 255, 0.08)' : 'linear-gradient(135deg, #C6FF00 0%, #90d600 100%)',
                    color: isAdmin ? '#eee' : '#000',
                    fontSize: '13.5px',
                    lineHeight: '1.45',
                    boxShadow: isAdmin ? '0 2px 8px rgba(0,0,0,0.2)' : '0 4px 16px rgba(198, 255, 0, 0.25)',
                    fontWeight: isAdmin ? 500 : 700,
                    wordBreak: 'break-word'
                  }}>
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK SUGGESTIONS CHIPS */}
        <div style={{
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          scrollbarWidth: 'none'
        }}>
          {[
            `Apakah warna ${selectedColor} stoknya ready?`,
            'Bisa langsung kirim hari ini kak?',
            'Apakah bergaransi resmi BNIB segel?'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#bbb',
                padding: '6px 11px',
                borderRadius: '16px',
                fontSize: '11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#C6FF00';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#bbb';
              }}
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* INPUT FOOTER */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            padding: '14px 16px',
            background: 'rgba(10, 11, 14, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Tanya ketersediaan stok ${product?.name}...`}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '12px 14px',
              color: '#fff',
              fontSize: '13.5px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#C6FF00'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
          />

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: inputMessage.trim() ? '#C6FF00' : 'rgba(255, 255, 255, 0.1)',
              color: inputMessage.trim() ? '#000' : '#666',
              border: 'none',
              cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            title="Kirim pesan"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes chatModalPop {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
