import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'StarPay | Secure UPI Payments',
    template: '%s | StarPay',
  },
  description: 'Fast, secure UPI-first payments powered by StarPay.',
  robots: { index: false, follow: false }, // Not a public site
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
