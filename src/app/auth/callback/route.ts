import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: { code?: string; error?: string }
}) {
  const code = searchParams.code
  const error = searchParams.error

  if (error) {
    return redirect('/login?error=' + error)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      return redirect('/mente')
    }
  }

  return redirect('/login')
}
