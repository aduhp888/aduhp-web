'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, User, LogOut, Package, ChevronDown } from 'lucide-react';

export default function NavbarCartAndAuth() {
  const { totalItems, openCart } = useCart();
  const { user, profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmailOrPhone = profile?.email || user?.email || profile?.whatsapp_number || '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* 1. Global Cart Trigger Button */}
      <button
        onClick={openCart}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '10px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
        title="Buka Keranjang Belanja"
      >
        <ShoppingBag size={16} color="var(--accent-lime)" />
        <span style={{ display: 'inline' }}>Keranjang</span>
        {totalItems > 0 && (
          <span style={{
            background: 'var(--accent-lime)',
            color: '#000',
            fontSize: '11px',
            fontWeight: 900,
            padding: '1px 6px',
            borderRadius: '10px',
            marginLeft: '2px',
            lineHeight: 1.2
          }}>
            {totalItems}
          </span>
        )}
      </button>

      {/* 2. Auth State Button */}
      {user ? (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'rgba(198, 255, 0, 0.2)',
              color: 'var(--accent-lime)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 900
            }}>
              {(displayName[0] || 'U').toUpperCase()}
            </div>
            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName.split(' ')[0]}
            </span>
            <ChevronDown size={14} color="#888" />
          </button>

          {/* User Dropdown */}
          {dropdownOpen && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '180px',
                background: '#181820',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '6px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 1000
              }}
              onClick={() => setDropdownOpen(false)}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '10px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayEmailOrPhone}
                </div>
              </div>

              <Link
                href="/pesanan"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  color: '#ccc',
                  fontSize: '12.5px',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  transition: 'background 0.15s'
                }}
              >
                <Package size={14} color="var(--accent-lime)" />
                <span>Pesanan Saya</span>
              </Link>

              <button
                onClick={async () => {
                  await signOut();
                  setDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  background: 'none',
                  border: 'none',
                  color: '#FF6B6B',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  textAlign: 'left'
                }}
              >
                <LogOut size={14} />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/login"
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#fff',
            fontSize: '12.5px',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}
        >
          <User size={14} />
          <span>Masuk</span>
        </Link>
      )}
    </div>
  );
}
