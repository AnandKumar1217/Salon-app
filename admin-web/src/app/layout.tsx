import type { Metadata } from 'next';
import './globals.css';
import { AdminAuthProvider } from '../context/AdminAuthContext';

export const metadata: Metadata = {
  title: 'Glamora Super Admin Panel',
  description: 'Centralized administration and salon operations control for Glamora Platform',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF9F6] text-stone-900 min-h-screen">
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
      </body>
    </html>
  );
}

