import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/app/providers'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans-custom',
  display: 'swap',
});

const spaceGrotesque = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display-custom',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-custom',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DataMind - Analista de Datos Inteligente',
  description: 'Analista de datos con IA. Carga datos, haz preguntas y obtén insights automáticos',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`dark ${plusJakartaSans.variable} ${spaceGrotesque.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <AuthProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}

