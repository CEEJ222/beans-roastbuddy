import { createClient } from './supabase/server'
import { redirect } from 'next/navigation'

/**
 * Check if the current user is authenticated
 * Redirects to login if not authenticated
 * 
 * For MVP: All authenticated users can access (you can add admin check later)
 * To restrict to specific admins, check user.email or user.user_metadata.is_admin
 */
export async function requireAdmin() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // TODO: Add admin check here
  // For example, check user.email against a list of admin emails:
  // const adminEmails = ['admin@example.com']
  // if (!adminEmails.includes(user.email || '')) {
  //   redirect('/unauthorized')
  // }

  // Or check user metadata:
  // const isAdmin = user.user_metadata?.is_admin === true
  // if (!isAdmin) {
  //   redirect('/unauthorized')
  // }

  return { user, supabase }
}

