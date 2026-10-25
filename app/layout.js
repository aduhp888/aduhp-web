import './globals.css';

export const metadata = {
  title: 'AduHP — Platform Adu Spek & Rekomendasi Gadget AI No. 1 Indonesia',
  description: 'Bingung Pilih HP? Adu Dulu Baru Beli. GRATIS. Bandingkan 2-3 HP secara objektif, tanpa sensor, no endorse. Stok fisik terintegrasi langsung ke gudang dapur.aduhp.com.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="page-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
