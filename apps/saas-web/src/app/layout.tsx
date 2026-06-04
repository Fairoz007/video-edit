import type { Metadata } from 'next';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocuForge',
  description: 'Premium longform documentary SaaS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
