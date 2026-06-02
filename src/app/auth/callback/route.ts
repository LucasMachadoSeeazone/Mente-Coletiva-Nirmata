import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const dominioPermitido = process.env.ALLOWED_DOMAIN ?? 'seazone.com.br'

  if (!code) {
    console.error('[auth/callback] Sem code na URL')
    return NextResponse.redirect(`${origin}/?erro=auth`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchange FALHOU:', error.message)
    return NextResponse.redirect(`${origin}/?erro=auth`)
  }

  if (data.user) {
    const email = data.user.email ?? ''
    console.log('[auth/callback] logou:', email)
    if (!email.endsWith(`@${dominioPermitido}`)) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/?erro=dominio`)
    }
    return NextResponse.redirect(`${origin}/mente`)
  }

  return NextResponse.redirect(`${origin}/?erro=auth`)
}
