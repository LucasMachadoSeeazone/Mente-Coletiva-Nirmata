'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: \\/auth/callback\,
          queryParams: {
            hd: 'seazone.com.br',
          },
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className=\"flex-1 flex items-center justify-center px-4 py-20\">
      <div className=\"w-full max-w-md space-y-8\">
        <div className=\"text-center space-y-4\">
          <h1 className=\"text-4xl font-bold\">Nirmata</h1>
          <p className=\"text-slate-600 dark:text-slate-400\">
            Sua consciência coletiva de 12 agentes IA
          </p>
        </div>

        <div className=\"bg-slate-100 dark:bg-slate-800 rounded-lg p-8 space-y-6\">
          <div className=\"text-center space-y-2\">
            <h2 className=\"text-2xl font-semibold\">Login</h2>
            <p className=\"text-sm text-slate-600 dark:text-slate-400\">
              Use seu email @seazone.com.br
            </p>
          </div>

          {error && (
            <div className=\"p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm\">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className=\"w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2\"
          >
            {loading ? 'Conectando...' : '🔐 Login com Google'}
          </button>

          <p className=\"text-xs text-center text-slate-600 dark:text-slate-400\">
            Apenas emails @seazone.com.br têm acesso
          </p>
        </div>
      </div>
    </main>
  )
}
