import './globals.css';
import ClientProviders from './components/ClientProviders';

export const metadata = {
  title: 'AduHP — Platform Adu Spek & Rekomendasi Gadget AI No. 1 Indonesia',
  description: 'Bingung Pilih HP? Adu Dulu Baru Beli. GRATIS. Bandingkan 2-3 HP secara objektif, tanpa sensor, no endorse. Stok fisik terintegrasi langsung ke gudang resmi aduhp.com.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ClientProviders>
          <div className="page-wrapper">
            {children}
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
