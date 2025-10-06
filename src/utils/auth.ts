import { signOut } from 'next-auth/react'

export const clearAuthState = async () => {
  try {
    // Clear all localStorage data related to user session
    const keysToRemove = [
      'anonymousUsername',
      'nextauth.message',
      'nextauth.csrf-token',
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Clear any session storage items
    sessionStorage.clear()
    
    // Clear all NextAuth cookies by removing items that start with 'next-auth'
    if (typeof document !== 'undefined') {
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
    }
    
    // Sign out and redirect to clear all cookies and session data
    await signOut({ 
      callbackUrl: window.location.origin + '?fresh=true',
      redirect: true 
    })
  } catch (error) {
    console.error('Error during sign out:', error)
    // Fallback: force page refresh
    window.location.href = window.location.origin
  }
}

export const forceRefreshSession = () => {
  // Force a hard refresh to clear any cached session data
  window.location.reload()
}

// Check if user just signed out and force refresh
export const checkFreshSession = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('fresh') === 'true') {
      // Remove the fresh parameter and reload
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => window.location.reload(), 100)
    }
  }
}