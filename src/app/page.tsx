import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { verifySession } from '@/lib/auth/jwt'

export default async function Home() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null

  if (session) {
    redirect('/dashboard')
  }
  redirect('/login')
}
