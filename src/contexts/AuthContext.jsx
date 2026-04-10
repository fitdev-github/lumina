import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, googleProvider } from '@/firebase/config'
import { createUser } from '@/firebase/services'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await createUser(firebaseUser.uid, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            provider: firebaseUser.providerData[0]?.providerId || 'google',
          })
        } catch (err) {
          console.log('User creation skipped (may already exist):', err.message)
        }
      }
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (err) {
      console.error('Sign in error:', err)
      switch (err.code) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
          setError('การเข้าสู่ระบบถูกยกเลิก')
          break
        case 'auth/network-request-failed':
          setError('เครือข่ายมีปัญหา กรุณาลองใหม่')
          break
        default:
          setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
      throw err
    }
  }

  const logout = async () => {
    setError(null)
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout error:', err)
      setError('ออกจากระบบไม่ได้ กรุณาลองใหม่')
      throw err
    }
  }

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    logout,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
