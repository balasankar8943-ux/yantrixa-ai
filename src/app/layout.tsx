import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yantrixa AI — Next Generation AI Conversation',
  description:
    'Experience the next generation of AI conversation. Lightning-fast streaming responses, code generation, multi-modal support, and more. Built by Yantrixa.in.',
  keywords: ['AI', 'chat', 'conversation', 'code generation', 'Yantrixa'],
  authors: [{ name: 'Yantrixa.in', url: 'https://yantrixa.in' }],
  openGraph: {
    title: 'Yantrixa AI — Next Generation AI Conversation',
    description:
      'Experience the next generation of AI conversation with streaming responses, code generation, and multi-modal support.',
    type: 'website',
    siteName: 'Yantrixa AI',
  },
  icons: {
    icon: '/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
