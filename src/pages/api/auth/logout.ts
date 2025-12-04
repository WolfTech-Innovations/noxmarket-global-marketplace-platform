import type { APIRoute } from 'astro';
import { deleteSession, clearSessionCookie } from '@/lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  try {
    const token = cookies.get('noxmarket_session')?.value;
    
    if (token) {
      deleteSession(token);
    }
    
    clearSessionCookie(cookies);
    
    return redirect('/');
  } catch (error) {
    console.error('Logout error:', error);
    return redirect('/');
  }
};