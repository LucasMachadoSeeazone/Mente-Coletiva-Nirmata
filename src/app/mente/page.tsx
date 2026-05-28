'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MentePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className=\"flex-1 flex items-center justify-center\">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className=\"flex-1 flex flex-col\">
      {/* Header */}
      <header className=\"border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900\">
        <div className=\"max-w-7xl mx-auto px-4 py-4 flex justify-between items-center\">
          <h1 className=\"text-2xl font-bold\">🧠 Nirmata</h1>
          <div className=\"flex items-center gap-4\">
            <span className=\"text-sm text-slate-600 dark:text-slate-400\">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className=\"px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors\"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className=\"flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8\">
        <div className=\"grid grid-cols-3 gap-8\">
          {/* Chat Column */}
          <div className=\"col-span-2 space-y-4\">
            <h2 className=\"text-xl font-semibold\">💬 Chat com Nirmata</h2>
            <div className=\"bg-slate-100 dark:bg-slate-800 rounded-lg p-6 h-96 flex items-center justify-center text-slate-500\">
              Chat box virá aqui
            </div>
          </div>

          {/* Agents Panel */}
          <div className=\"space-y-4\">
            <h2 className=\"text-xl font-semibold\">🤖 Agentes</h2>
            <div className=\"bg-slate-100 dark:bg-slate-800 rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto\">
              <p className=\"text-sm text-slate-600 dark:text-slate-400\">
                Agentes prontos pra ajudar
              </p>
            </div>
          </div>
        </div>

        {/* History */}
        <div className=\"space-y-4\">
          <h2 className=\"text-xl font-semibold\">📋 Histórico</h2>
          <div className=\"bg-slate-100 dark:bg-slate-800 rounded-lg p-6 h-40 flex items-center justify-center text-slate-500\">
            Histórico de conversas virá aqui
          </div>
        </div>
      </main>
    </div>
  )
}
