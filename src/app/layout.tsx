import type { Metadata } from 'next'
import './styles/globals.css'

export const metadata: Metadata = {
  title: 'Nirmata — Mente Coletiva',
  description: 'Consciência coletiva de 12 agentes IA especializados',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
